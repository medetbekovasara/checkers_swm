import { applyMove, type GameState, type Move, type Player } from "@/game-engine";
import { uid } from "@/lib/utils";
import { supabase } from "@/services/supabase/client";
import {
  createStateHash,
  isRoomEvent,
  type MoveAcceptedEvent,
  type MoveCommand,
  type PresenceChangedEvent,
  type RoomEvent,
  type RoomEventHandler,
  type RoomParticipant,
  type RoomServiceResult,
  type RoomSession,
  type RoomSnapshot,
  type RoomSnapshotEvent
} from "@/services/multiplayer/events";

export type {
  MoveAcceptedEvent,
  MoveCommand,
  PresenceChangedEvent,
  RoomEvent,
  RoomEventHandler,
  RoomParticipant,
  RoomServiceResult,
  RoomSession,
  RoomSnapshot,
  RoomSnapshotEvent
} from "@/services/multiplayer/events";

export type CreateRoomSessionInput = {
  game: GameState;
  hostClientId: string;
  hostPlayerId?: string;
  hostHandle?: string;
  hostSide?: Player;
};

export type JoinRoomInput = {
  inviteCodeOrUrl: string;
  clientId: string;
  playerId?: string;
  handle?: string;
  asSpectator?: boolean;
};

type LocalRoomRecord = {
  snapshot: RoomSnapshot;
  acceptedByIdempotencyKey: Map<string, MoveAcceptedEvent>;
  listeners: Set<RoomEventHandler>;
};

type RoomRow = {
  id: string;
  invite_code: string;
  status: RoomSession["status"];
  visibility: RoomSession["visibility"];
  version: number;
  state_hash: string;
  move_count: number;
  players: RoomParticipant[];
  spectators: number;
  game_state: GameState;
  created_at: string;
  updated_at: string;
};

type MoveEventRow = {
  room_id: string;
  type: RoomEvent["type"];
  payload: RoomEvent;
};

const localRooms = new Map<string, LocalRoomRecord>();

function now() {
  return new Date().toISOString();
}

function createInviteCode() {
  return uid("join").replace(/^join_/, "");
}

function createParticipant(input: {
  clientId: string;
  playerId?: string;
  handle?: string;
  side: Player | "spectator";
  role: RoomParticipant["role"];
}): RoomParticipant {
  return {
    clientId: input.clientId,
    playerId: input.playerId,
    handle: input.handle,
    side: input.side,
    role: input.role,
    connectedAt: now()
  };
}

function createPresenceEvent(snapshot: RoomSnapshot): PresenceChangedEvent {
  return {
    type: "presence_changed",
    roomId: snapshot.roomId,
    players: snapshot.session.players,
    spectators: snapshot.session.spectators,
    emittedAt: now()
  };
}

function createSnapshotEvent(snapshot: RoomSnapshot): RoomSnapshotEvent {
  return {
    type: "room_snapshot",
    roomId: snapshot.roomId,
    version: snapshot.session.version,
    state: snapshot.state,
    stateHash: snapshot.session.stateHash,
    moveCount: snapshot.session.moveCount,
    emittedAt: now()
  };
}

function addParticipantToSnapshot(snapshot: RoomSnapshot, input: JoinRoomInput): RoomSnapshot {
  const existingParticipant = snapshot.session.players.find((player) => player.clientId === input.clientId);
  if (existingParticipant) return snapshot;

  const side = input.asSpectator || snapshot.session.players.length >= 2 ? "spectator" : "black";
  const participant = createParticipant({
    clientId: input.clientId,
    playerId: input.playerId,
    handle: input.handle,
    side,
    role: side === "spectator" ? "spectator" : "guest"
  });

  return {
    ...snapshot,
    session: {
      ...snapshot.session,
      status: snapshot.session.players.length >= 1 && side !== "spectator" ? "active" : snapshot.session.status,
      players: side === "spectator" ? snapshot.session.players : [...snapshot.session.players, participant],
      spectators: side === "spectator" ? snapshot.session.spectators + 1 : snapshot.session.spectators,
      updatedAt: now()
    }
  };
}

function emitLocalRoomEvent(roomId: string, event: RoomEvent) {
  const record = localRooms.get(roomId);
  if (!record) return;
  record.listeners.forEach((listener) => listener(event));
}

function toRoomSnapshot(row: RoomRow): RoomSnapshot {
  return {
    roomId: row.id,
    session: {
      id: row.id,
      inviteCode: row.invite_code,
      status: row.status,
      visibility: row.visibility,
      version: row.version,
      stateHash: row.state_hash,
      moveCount: row.move_count,
      players: row.players,
      spectators: row.spectators,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    },
    state: row.game_state
  };
}

function asRoomRow(value: unknown): RoomRow {
  return value as RoomRow;
}

function toRoomRow(snapshot: RoomSnapshot): RoomRow {
  return {
    id: snapshot.roomId,
    invite_code: snapshot.session.inviteCode,
    status: snapshot.session.status,
    visibility: snapshot.session.visibility,
    version: snapshot.session.version,
    state_hash: snapshot.session.stateHash,
    move_count: snapshot.session.moveCount,
    players: snapshot.session.players,
    spectators: snapshot.session.spectators,
    game_state: snapshot.state,
    created_at: snapshot.session.createdAt,
    updated_at: snapshot.session.updatedAt
  };
}

function roomSelectColumns() {
  return "id, invite_code, status, visibility, version, state_hash, move_count, players, spectators, game_state, created_at, updated_at";
}

function createLocalRoomRecord(input: CreateRoomSessionInput): LocalRoomRecord {
  const createdAt = now();
  const roomId = uid("room");
  const snapshot: RoomSnapshot = {
    roomId,
    session: {
      id: roomId,
      inviteCode: createInviteCode(),
      status: "waiting",
      visibility: "link",
      version: 0,
      stateHash: createStateHash(input.game),
      moveCount: 0,
      players: [
        createParticipant({
          clientId: input.hostClientId,
          playerId: input.hostPlayerId,
          handle: input.hostHandle,
          side: input.hostSide ?? "red",
          role: "host"
        })
      ],
      spectators: 0,
      createdAt,
      updatedAt: createdAt
    },
    state: input.game
  };

  return {
    snapshot,
    acceptedByIdempotencyKey: new Map(),
    listeners: new Set()
  };
}

export async function createRoomSession(input: CreateRoomSessionInput): Promise<RoomServiceResult<RoomSnapshot>> {
  const localRecord = createLocalRoomRecord(input);
  localRooms.set(localRecord.snapshot.roomId, localRecord);

  if (!supabase) return { ok: true, source: "local", data: localRecord.snapshot };

  const { data, error } = await supabase
    .from("rooms")
    .insert(toRoomRow(localRecord.snapshot))
    .select(roomSelectColumns())
    .single();

  if (error) {
    return {
      ok: false,
      source: "supabase",
      error: { code: "room_persistence_error", message: error.message }
    };
  }

  return { ok: true, source: "supabase", data: toRoomSnapshot(asRoomRow(data)) };
}

export function createRoomLink(session: Pick<RoomSession, "inviteCode">, origin = "") {
  const baseUrl = origin.replace(/\/$/, "");
  return `${baseUrl}/room/${session.inviteCode}`;
}

export function parseInviteCode(inviteCodeOrUrl: string) {
  const trimmed = inviteCodeOrUrl.trim();
  const lastSegment = trimmed.split("?")[0]?.split("#")[0]?.split("/").filter(Boolean).at(-1);
  return lastSegment ?? trimmed;
}

export async function joinRoomByLink(input: JoinRoomInput): Promise<RoomServiceResult<RoomSnapshot>> {
  const inviteCode = parseInviteCode(input.inviteCodeOrUrl);
  const localRecord = [...localRooms.values()].find((record) => record.snapshot.session.inviteCode === inviteCode);

  if (!supabase || localRecord) {
    if (!localRecord) {
      return {
        ok: false,
        source: "local",
        error: { code: "room_not_found", message: `Room invite ${inviteCode} was not found.` }
      };
    }

    localRecord.snapshot = addParticipantToSnapshot(localRecord.snapshot, input);
    emitLocalRoomEvent(localRecord.snapshot.roomId, createPresenceEvent(localRecord.snapshot));

    return { ok: true, source: "local", data: localRecord.snapshot };
  }

  const { data, error } = await supabase
    .from("rooms")
    .select(roomSelectColumns())
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      source: "supabase",
      error: { code: "room_persistence_error", message: error.message }
    };
  }

  if (!data) {
    return {
      ok: false,
      source: "supabase",
      error: { code: "room_not_found", message: `Room invite ${inviteCode} was not found.` }
    };
  }

  const joinedSnapshot = addParticipantToSnapshot(toRoomSnapshot(asRoomRow(data)), input);
  const { data: updatedData, error: updateError } = await supabase
    .from("rooms")
    .update({
      status: joinedSnapshot.session.status,
      players: joinedSnapshot.session.players,
      spectators: joinedSnapshot.session.spectators,
      updated_at: joinedSnapshot.session.updatedAt
    })
    .eq("id", joinedSnapshot.roomId)
    .select(roomSelectColumns())
    .single();

  if (updateError) {
    return {
      ok: false,
      source: "supabase",
      error: { code: "room_persistence_error", message: updateError.message }
    };
  }

  const updatedSnapshot = toRoomSnapshot(asRoomRow(updatedData));
  await insertRoomEvent(createPresenceEvent(updatedSnapshot));

  return { ok: true, source: "supabase", data: updatedSnapshot };
}

export async function getRoomSnapshotByInviteCode(inviteCodeOrUrl: string): Promise<RoomServiceResult<RoomSnapshot>> {
  const inviteCode = parseInviteCode(inviteCodeOrUrl);
  const localRecord = [...localRooms.values()].find((record) => (
    record.snapshot.session.inviteCode === inviteCode || record.snapshot.roomId === inviteCode
  ));

  if (!supabase || localRecord) {
    if (!localRecord) {
      return {
        ok: false,
        source: "local",
        error: { code: "room_not_found", message: `Room invite ${inviteCode} was not found.` }
      };
    }

    return { ok: true, source: "local", data: localRecord.snapshot };
  }

  const { data, error } = await supabase
    .from("rooms")
    .select(roomSelectColumns())
    .or(`invite_code.eq.${inviteCode},id.eq.${inviteCode}`)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      source: "supabase",
      error: { code: "room_persistence_error", message: error.message }
    };
  }

  if (!data) {
    return {
      ok: false,
      source: "supabase",
      error: { code: "room_not_found", message: `Room invite ${inviteCode} was not found.` }
    };
  }

  return { ok: true, source: "supabase", data: toRoomSnapshot(asRoomRow(data)) };
}

export function createLocalRoom(game: GameState): RoomSnapshot {
  const record = createLocalRoomRecord({ game, hostClientId: uid("client") });
  localRooms.set(record.snapshot.roomId, record);
  return record.snapshot;
}

export async function submitMoveCommand(command: MoveCommand): Promise<RoomServiceResult<MoveAcceptedEvent>> {
  const localRecord = localRooms.get(command.roomId);

  if (!supabase || localRecord) {
    if (!localRecord) {
      return {
        ok: false,
        source: "local",
        error: { code: "room_not_found", message: `Room ${command.roomId} was not found.` }
      };
    }

    const previousAccepted = localRecord.acceptedByIdempotencyKey.get(command.idempotencyKey);
    if (previousAccepted) return { ok: true, source: "local", data: previousAccepted };

    if (command.baseVersion !== localRecord.snapshot.session.version) {
      return {
        ok: false,
        source: "local",
        error: {
          code: "stale_room_version",
          message: `Expected base version ${localRecord.snapshot.session.version}, received ${command.baseVersion}.`
        }
      };
    }

    const acceptedAt = now();
    const nextState = applyMove(localRecord.snapshot.state, command.move);
    if (nextState === localRecord.snapshot.state || nextState.moves.length === localRecord.snapshot.state.moves.length) {
      return {
        ok: false,
        source: "local",
        error: { code: "room_conflict", message: "Move is not legal for the current room state." }
      };
    }
    const stateHash = createStateHash(nextState);
    const acceptedEvent: MoveAcceptedEvent = {
      type: "move_accepted",
      roomId: command.roomId,
      clientId: command.clientId,
      idempotencyKey: command.idempotencyKey,
      version: localRecord.snapshot.session.version + 1,
      move: command.move,
      state: nextState,
      moveCount: nextState.moves.length,
      stateHash,
      acceptedAt
    };

    localRecord.snapshot = {
      ...localRecord.snapshot,
      session: {
        ...localRecord.snapshot.session,
        status: nextState.status === "active" ? "active" : "completed",
        version: acceptedEvent.version,
        stateHash,
        moveCount: acceptedEvent.moveCount,
        updatedAt: acceptedAt
      },
      state: nextState
    };
    localRecord.acceptedByIdempotencyKey.set(command.idempotencyKey, acceptedEvent);
    emitLocalRoomEvent(command.roomId, command);
    emitLocalRoomEvent(command.roomId, acceptedEvent);

    return { ok: true, source: "local", data: acceptedEvent };
  }

  const { data: roomData, error: roomError } = await supabase
    .from("rooms")
    .select(roomSelectColumns())
    .eq("id", command.roomId)
    .maybeSingle();

  if (roomError) {
    return {
      ok: false,
      source: "supabase",
      error: { code: "room_persistence_error", message: roomError.message }
    };
  }

  if (!roomData) {
    return {
      ok: false,
      source: "supabase",
      error: { code: "room_not_found", message: `Room ${command.roomId} was not found.` }
    };
  }

  const snapshot = toRoomSnapshot(asRoomRow(roomData));
  if (command.baseVersion !== snapshot.session.version) {
    return {
      ok: false,
      source: "supabase",
      error: {
        code: "stale_room_version",
        message: `Expected base version ${snapshot.session.version}, received ${command.baseVersion}.`
      }
    };
  }

  const nextState = applyMove(snapshot.state, command.move);
  if (nextState === snapshot.state || nextState.moves.length === snapshot.state.moves.length) {
    return {
      ok: false,
      source: "supabase",
      error: { code: "room_conflict", message: "Move is not legal for the current room state." }
    };
  }

  const acceptedAt = now();
  const stateHash = createStateHash(nextState);
  const acceptedEvent: MoveAcceptedEvent = {
    type: "move_accepted",
    roomId: command.roomId,
    clientId: command.clientId,
    idempotencyKey: command.idempotencyKey,
    version: snapshot.session.version + 1,
    move: command.move,
    state: nextState,
    moveCount: nextState.moves.length,
    stateHash,
    acceptedAt
  };

  const { data: updatedRoom, error: updateError } = await supabase
    .from("rooms")
    .update({
      status: nextState.status === "active" ? "active" : "completed",
      version: acceptedEvent.version,
      state_hash: stateHash,
      move_count: acceptedEvent.moveCount,
      game_state: nextState,
      updated_at: acceptedAt
    })
    .eq("id", command.roomId)
    .eq("version", command.baseVersion)
    .select(roomSelectColumns())
    .maybeSingle();

  if (updateError) {
    return {
      ok: false,
      source: "supabase",
      error: { code: "room_persistence_error", message: updateError.message }
    };
  }

  if (!updatedRoom) {
    return {
      ok: false,
      source: "supabase",
      error: { code: "stale_room_version", message: "Room changed before this move was accepted." }
    };
  }

  const inserted = await insertRoomEvent(acceptedEvent, command.baseVersion);
  if (!inserted.ok) {
    return {
      ok: false,
      source: inserted.source,
      error: inserted.error
    };
  }

  return { ok: true, source: "supabase", data: acceptedEvent };
}

async function insertRoomEvent(event: RoomEvent, baseVersion?: number): Promise<RoomServiceResult<RoomEvent>> {
  if (!supabase) return { ok: true, source: "local", data: event };

  const { error } = await supabase
    .from("room_events")
    .insert({
      room_id: event.roomId,
      type: event.type,
      idempotency_key: "idempotencyKey" in event ? event.idempotencyKey : null,
      base_version: baseVersion ?? ("version" in event ? event.version : null),
      payload: event
    });

  if (error) {
    return {
      ok: false,
      source: "supabase",
      error: { code: "room_persistence_error", message: error.message }
    };
  }

  return { ok: true, source: "supabase", data: event };
}

export function getLocalRoomSnapshot(roomId: string): RoomSnapshot | null {
  return localRooms.get(roomId)?.snapshot ?? null;
}

export function subscribeToRoomEvents(roomId: string, onEvent: RoomEventHandler) {
  const localRecord = localRooms.get(roomId);
  if (!supabase || localRecord) {
    if (!localRecord) return () => undefined;
    localRecord.listeners.add(onEvent);
    onEvent(createSnapshotEvent(localRecord.snapshot));
    return () => {
      localRecord.listeners.delete(onEvent);
    };
  }

  const client = supabase;
  const channel = client
    .channel(`room:${roomId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "room_events", filter: `room_id=eq.${roomId}` },
      (payload) => {
        const row = payload.new as MoveEventRow;
        if (isRoomEvent(row.payload)) onEvent(row.payload);
      }
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}

export async function publishMove(roomId: string, move: Move, game: GameState) {
  return submitMoveCommand({
    type: "move_submitted",
    roomId,
    clientId: uid("client"),
    idempotencyKey: move.id,
    baseVersion: getLocalRoomSnapshot(roomId)?.session.version ?? game.moves.length,
    move,
    submittedAt: now()
  });
}

export function subscribeToRoom(roomId: string, onMove: (payload: unknown) => void) {
  return subscribeToRoomEvents(roomId, (event) => {
    if (event.type === "move_accepted") onMove(event);
  });
}
