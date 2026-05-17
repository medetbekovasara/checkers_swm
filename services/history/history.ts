import type { Move, Player } from "@/game-engine";
import { uid } from "@/lib/utils";
import type { AiDifficulty } from "@/services/ai/difficulty";
import type { PlayMode } from "@/services/ai/modes";
import { supabase } from "@/services/supabase/client";

export type MatchHistoryPlayer = {
  id: string;
  handle: string;
  side: Player;
};

export type MatchHistoryRecord = {
  id: string;
  roomId?: string;
  mode: PlayMode;
  difficulty: AiDifficulty | "human";
  opponent: string;
  durationSeconds: number;
  result: "victory" | "defeat" | "draw";
  players: MatchHistoryPlayer[];
  winner: Player | null;
  moves: Move[];
  startedAt: string;
  completedAt: string;
  stateHash: string;
};

export type MatchHistoryDraft = Omit<MatchHistoryRecord, "id"> & {
  id?: string;
};

export type MatchHistoryResult<T> =
  | { ok: true; data: T; source: "supabase" | "local" }
  | {
      ok: false;
      error: { code: "match_history_persistence_error"; message: string };
      source: "supabase" | "local";
    };

type MatchHistoryRow = {
  id: string;
  room_id: string | null;
  mode: PlayMode;
  difficulty: AiDifficulty | "human";
  opponent: string | null;
  duration_seconds: number | null;
  result: "victory" | "defeat" | "draw";
  players: MatchHistoryPlayer[];
  winner: Player | null;
  moves: Move[];
  started_at: string;
  completed_at: string;
  state_hash: string;
};

const localMatchHistory = new Map<string, MatchHistoryRecord>();

function normalizeMatchHistoryRecord(record: MatchHistoryDraft): MatchHistoryRecord {
  return {
    ...record,
    id: record.id ?? uid("match")
  };
}

function rowToMatchHistoryRecord(row: MatchHistoryRow): MatchHistoryRecord {
  return {
    id: row.id,
    roomId: row.room_id ?? undefined,
    mode: row.mode,
    difficulty: row.difficulty,
    opponent: row.opponent ?? "AI",
    durationSeconds: row.duration_seconds ?? estimateDurationSeconds(row.started_at, row.completed_at),
    result: row.result,
    players: row.players,
    winner: row.winner,
    moves: row.moves,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    stateHash: row.state_hash
  };
}

function matchHistoryRecordToRow(record: MatchHistoryRecord): MatchHistoryRow {
  return {
    id: record.id,
    room_id: record.roomId ?? null,
    mode: record.mode,
    difficulty: record.difficulty,
    opponent: record.opponent,
    duration_seconds: record.durationSeconds,
    result: record.result,
    players: record.players,
    winner: record.winner,
    moves: record.moves,
    started_at: record.startedAt,
    completed_at: record.completedAt,
    state_hash: record.stateHash
  };
}

export async function saveMatchHistoryRecord(
  record: MatchHistoryDraft
): Promise<MatchHistoryResult<MatchHistoryRecord>> {
  const normalized = normalizeMatchHistoryRecord(record);
  localMatchHistory.set(normalized.id, normalized);

  if (!supabase) return { ok: true, source: "local", data: normalized };

  const { data, error } = await supabase
    .from("match_history")
    .upsert(matchHistoryRecordToRow(normalized))
    .select("id, room_id, mode, difficulty, opponent, duration_seconds, result, players, winner, moves, started_at, completed_at, state_hash")
    .single();

  if (error) {
    return { ok: true, source: "local", data: normalized };
  }

  return { ok: true, source: "supabase", data: rowToMatchHistoryRecord(data as MatchHistoryRow) };
}

export async function fetchMatchHistory(playerId: string, limit = 20): Promise<MatchHistoryResult<MatchHistoryRecord[]>> {
  if (!supabase) {
    return {
      ok: true,
      source: "local",
      data: getLocalMatchHistory(playerId, limit)
    };
  }

  const { data, error } = await supabase
    .from("match_history")
    .select("id, room_id, mode, difficulty, opponent, duration_seconds, result, players, winner, moves, started_at, completed_at, state_hash")
    .contains("players", [{ id: playerId }])
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error) {
    return {
      ok: true,
      source: "local",
      data: getLocalMatchHistory(playerId, limit)
    };
  }

  return { ok: true, source: "supabase", data: (data as MatchHistoryRow[]).map(rowToMatchHistoryRecord) };
}

export function getLocalMatchHistory(playerId: string, limit = 20): MatchHistoryRecord[] {
  return [...localMatchHistory.values()]
    .filter((record) => record.players.some((player) => player.id === playerId))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, limit);
}

function estimateDurationSeconds(startedAt: string, completedAt: string) {
  return Math.max(1, Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000));
}
