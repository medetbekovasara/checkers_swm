import { GameState, Move } from "@/game-engine";
import { supabase } from "@/services/supabase/client";
import { uid } from "@/lib/utils";

export type RoomSnapshot = {
  id: string;
  game: GameState;
  spectators: number;
  updatedAt: string;
};

export function createLocalRoom(game: GameState): RoomSnapshot {
  return {
    id: uid("room"),
    game,
    spectators: 0,
    updatedAt: new Date().toISOString()
  };
}

export async function publishMove(roomId: string, move: Move, game: GameState) {
  if (!supabase) return { ok: false, reason: "Supabase is not configured" };

  const { error } = await supabase.from("moves").insert({
    room_id: roomId,
    move,
    game_state: game
  });

  return error ? { ok: false, reason: error.message } : { ok: true };
}

export function subscribeToRoom(roomId: string, onMove: (payload: unknown) => void) {
  const client = supabase;
  if (!client) return () => undefined;

  const channel = client
    .channel(`room:${roomId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "moves", filter: `room_id=eq.${roomId}` },
      (payload) => onMove(payload.new)
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
