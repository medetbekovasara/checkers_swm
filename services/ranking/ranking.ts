import { Player } from "@/game-engine";
import {
  applyProfilePatch,
  savePlayerProfile
} from "@/services/profile/profile";
import type { PlayerProfile, ProfileResult } from "@/services/profile/profile";
import type { AiDifficulty } from "@/services/ai/difficulty";
import type { PlayMode } from "@/services/ai/modes";
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

export type RankedMatchDifficulty = AiDifficulty | "human";
export type RankedMatchMode = PlayMode | "ranked" | "friendly";

export type RankResultContext = {
  difficulty?: RankedMatchDifficulty;
  mode?: RankedMatchMode;
  streak?: number;
};

export type XpGainBreakdown = {
  base: number;
  difficultyBonus: number;
  modeBonus: number;
  streakBonus: number;
  total: number;
};

export type RankTier = "Beginner" | "Strategist" | "Master" | "Grandmaster";

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

const difficultyXpBonus: Record<RankedMatchDifficulty, number> = {
  beginner: 0,
  intermediate: 15,
  nightmare: 60,
  human: 45
};

const modeXpBonus: Record<RankedMatchMode, number> = {
  classic: 0,
  chaos: 20,
  speed: 10,
  ranked: 40,
  friendly: 0
};

export function calculateXpGain(
  winner: Player | null,
  playerSide: Player,
  context: RankResultContext = {}
): XpGainBreakdown {
  const won = winner === playerSide;
  const drew = winner === null;
  const base = won ? 120 : drew ? 60 : 35;
  const difficultyBonus = won ? difficultyXpBonus[context.difficulty ?? "human"] : 0;
  const modeBonus = modeXpBonus[context.mode ?? "friendly"];
  const streakBonus = won ? Math.min(context.streak ?? 0, 5) * 20 : 0;

  return {
    base,
    difficultyBonus,
    modeBonus,
    streakBonus,
    total: base + difficultyBonus + modeBonus + streakBonus
  };
}

export function getRankTier(xp: number): RankTier {
  if (xp >= 8000) return "Grandmaster";
  if (xp >= 4000) return "Master";
  if (xp >= 1200) return "Strategist";
  return "Beginner";
}

export function applyRankResult(
  profile: PlayerProfile,
  winner: Player | null,
  playerSide: Player,
  context: RankResultContext = {}
): PlayerProfile {
  const won = winner === playerSide;
  const drew = winner === null;
  const xpGain = calculateXpGain(winner, playerSide, {
    streak: profile.stats.streak,
    ...context
  }).total;

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
  playerSide: Player,
  context: RankResultContext = {}
): Promise<ProfileResult<PlayerProfile>> {
  return savePlayerProfile(applyRankResult(profile, winner, playerSide, context));
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
