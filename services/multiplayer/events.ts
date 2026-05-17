import type { GameState, Move, Player } from "@/game-engine";

export type RoomEventType = "move_submitted" | "move_accepted" | "room_snapshot" | "presence_changed";
export type RoomStatus = "waiting" | "active" | "completed" | "abandoned";
export type RoomVisibility = "link" | "private";
export type RoomRole = "host" | "guest" | "spectator";

export type RoomParticipant = {
  clientId: string;
  playerId?: string;
  handle?: string;
  side: Player | "spectator";
  role: RoomRole;
  connectedAt: string;
};

export type RoomSession = {
  id: string;
  inviteCode: string;
  status: RoomStatus;
  visibility: RoomVisibility;
  version: number;
  stateHash: string;
  moveCount: number;
  players: RoomParticipant[];
  spectators: number;
  createdAt: string;
  updatedAt: string;
};

export type RoomSnapshot = {
  roomId: string;
  session: RoomSession;
  state: GameState;
};

export type MoveCommand = {
  type: "move_submitted";
  roomId: string;
  clientId: string;
  idempotencyKey: string;
  baseVersion: number;
  move: Move;
  submittedAt: string;
};

export type MoveAcceptedEvent = {
  type: "move_accepted";
  roomId: string;
  clientId: string;
  idempotencyKey: string;
  version: number;
  move: Move;
  state: GameState;
  moveCount: number;
  stateHash: string;
  acceptedAt: string;
};

export type RoomSnapshotEvent = {
  type: "room_snapshot";
  roomId: string;
  version: number;
  state: GameState;
  stateHash: string;
  moveCount: number;
  emittedAt: string;
};

export type PresenceChangedEvent = {
  type: "presence_changed";
  roomId: string;
  players: RoomParticipant[];
  spectators: number;
  emittedAt: string;
};

export type RoomEvent = MoveCommand | MoveAcceptedEvent | RoomSnapshotEvent | PresenceChangedEvent;

export type RoomServiceErrorCode =
  | "room_not_found"
  | "room_conflict"
  | "room_persistence_error"
  | "stale_room_version";

export type RoomServiceResult<T> =
  | { ok: true; data: T; source: "supabase" | "local" }
  | { ok: false; error: { code: RoomServiceErrorCode; message: string }; source: "supabase" | "local" };

export type RoomEventHandler = (event: RoomEvent) => void;

export function createStateHash(state: GameState): string {
  const basis = JSON.stringify({
    id: state.id,
    mode: state.mode,
    currentPlayer: state.currentPlayer,
    winner: state.winner,
    status: state.status,
    turn: state.turn,
    pieces: state.pieces,
    moves: state.moves.map((move) => move.id),
    chaosLog: state.chaosLog.map((event) => event.id)
  });
  let hash = 2166136261;

  for (let index = 0; index < basis.length; index += 1) {
    hash ^= basis.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function isRoomEvent(value: unknown): value is RoomEvent {
  if (!value || typeof value !== "object") return false;
  const type = (value as { type?: unknown }).type;
  return (
    type === "move_submitted" ||
    type === "move_accepted" ||
    type === "room_snapshot" ||
    type === "presence_changed"
  );
}
