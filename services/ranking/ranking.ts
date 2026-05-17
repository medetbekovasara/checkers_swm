import { Player } from "@/game-engine";
import {
  applyProfilePatch,
  savePlayerProfile
} from "@/services/profile/profile";
import type { PlayerProfile, ProfileResult } from "@/services/profile/profile";
import { supabase } from "@/services/supabase/client";

export type { PlayerProfile } from "@/services/profile/profile";

export type LeaderboardEntry = {
  id: string;
  handle: string;
  xp: number;
  wins: number;
  losses: number;
  streak: number;
};

export type RankingResult<T> =
  | { ok: true; data: T; source: "supabase" | "local" }
  | { ok: false; error: { code: "ranking_persistence_error"; message: string }; source: "supabase" | "local" };

type RankingRow = {
  id: string;
  handle: string;
  xp: number;
  stats: Partial<Pick<LeaderboardEntry, "wins" | "losses" | "streak">> | null;
};

function toLeaderboardEntry(profile: PlayerProfile): LeaderboardEntry {
  return {
    id: profile.id,
    handle: profile.handle,
    xp: profile.xp,
    wins: profile.stats.wins,
    losses: profile.stats.losses,
    streak: profile.stats.streak
  };
}

function rowToLeaderboardEntry(row: RankingRow): LeaderboardEntry {
  return {
    id: row.id,
    handle: row.handle,
    xp: row.xp,
    wins: row.stats?.wins ?? 0,
    losses: row.stats?.losses ?? 0,
    streak: row.stats?.streak ?? 0
  };
}

export function applyRankResult(profile: PlayerProfile, winner: Player | null, playerSide: Player): PlayerProfile {
  const won = winner === playerSide;
  const drew = winner === null;
  const xpGain = won ? 120 + Math.min(profile.stats.streak, 5) * 20 : drew ? 60 : 35;

  return applyProfilePatch(profile, {
    xp: profile.xp + xpGain,
    stats: {
      wins: profile.stats.wins + (won ? 1 : 0),
      losses: profile.stats.losses + (!won && !drew ? 1 : 0),
      draws: profile.stats.draws + (drew ? 1 : 0),
      gamesPlayed: profile.stats.gamesPlayed + 1,
      streak: won ? profile.stats.streak + 1 : 0
    }
  });
}

export async function fetchLeaderboard(limit = 25): Promise<RankingResult<LeaderboardEntry[]>> {
  if (!supabase) return { ok: true, source: "local", data: demoLeaderboard.slice(0, limit) };

  const { data, error } = await supabase
    .from("player_profiles")
    .select("id, handle, xp, stats")
    .order("xp", { ascending: false })
    .limit(limit);

  if (error) {
    return {
      ok: false,
      source: "supabase",
      error: { code: "ranking_persistence_error", message: error.message }
    };
  }

  return { ok: true, source: "supabase", data: (data as RankingRow[]).map(rowToLeaderboardEntry) };
}

export async function updateRankingForResult(
  profile: PlayerProfile,
  winner: Player | null,
  playerSide: Player
): Promise<ProfileResult<PlayerProfile>> {
  return savePlayerProfile(applyRankResult(profile, winner, playerSide));
}

export function getLocalLeaderboard(profiles: PlayerProfile[], limit = 25): LeaderboardEntry[] {
  return profiles
    .map(toLeaderboardEntry)
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit);
}

export const demoLeaderboard: LeaderboardEntry[] = [
  { id: "1", handle: "NovaFork", xp: 8420, wins: 68, losses: 21, streak: 6 },
  { id: "2", handle: "Kingline", xp: 7790, wins: 59, losses: 19, streak: 3 },
  { id: "3", handle: "SwapLord", xp: 7210, wins: 51, losses: 17, streak: 4 },
  { id: "4", handle: "Diagonalist", xp: 6880, wins: 48, losses: 25, streak: 1 }
];
