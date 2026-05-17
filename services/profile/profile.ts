import { supabase } from "@/services/supabase/client";
import type { AuthIdentity } from "@/services/auth/auth";

export type PlayerStats = {
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  gamesPlayed: number;
};

export type PlayerSettings = {
  sound: boolean;
  reducedMotion: boolean;
  boardTheme: "classic" | "midnight" | "high-contrast";
};

export type PlayerProfile = {
  id: string;
  handle: string;
  email: string | null;
  xp: number;
  level: number;
  stats: PlayerStats;
  settings: PlayerSettings;
  updatedAt: string;
};

export type ProfilePatch = Partial<Pick<PlayerProfile, "handle" | "email" | "xp" | "level">> & {
  stats?: Partial<PlayerStats>;
  settings?: Partial<PlayerSettings>;
};

export type ProfileServiceError = {
  code: "profile_not_found" | "profile_persistence_error";
  message: string;
};

export type ProfileResult<T> =
  | { ok: true; data: T; source: "supabase" | "local" }
  | { ok: false; error: ProfileServiceError; source: "supabase" | "local" };

type PlayerProfileRow = {
  id: string;
  handle: string;
  email: string | null;
  xp: number;
  level: number;
  stats: Partial<PlayerStats> | null;
  settings: Partial<PlayerSettings> | null;
  updated_at: string;
};

type PlayerProfileDraft = Omit<Partial<PlayerProfile>, "stats" | "settings"> & {
  stats?: Partial<PlayerStats>;
  settings?: Partial<PlayerSettings>;
};

const PROFILE_PREFIX = "chaos-checkers:profile:";
const localProfiles = new Map<string, PlayerProfile>();

export const defaultPlayerStats: PlayerStats = {
  wins: 0,
  losses: 0,
  draws: 0,
  streak: 0,
  gamesPlayed: 0
};

export const defaultPlayerSettings: PlayerSettings = {
  sound: true,
  reducedMotion: false,
  boardTheme: "classic"
};

function canUseLocalStorage() {
  return typeof localStorage !== "undefined";
}

function calculateLevel(xp: number) {
  return Math.max(1, Math.floor(xp / 500) + 1);
}

function normalizeProfile(profile: PlayerProfileDraft, identity?: AuthIdentity): PlayerProfile {
  const xp = profile.xp ?? (identity?.kind === "guest" ? 80 : 180);
  const stats = { ...defaultPlayerStats, ...profile.stats };

  return {
    id: profile.id ?? identity?.id ?? "local-player",
    handle: profile.handle ?? identity?.handle ?? "Guest Player",
    email: profile.email ?? identity?.email ?? null,
    xp,
    level: profile.level ?? calculateLevel(xp),
    stats,
    settings: { ...defaultPlayerSettings, ...profile.settings },
    updatedAt: profile.updatedAt ?? new Date().toISOString()
  };
}

function rowToProfile(row: PlayerProfileRow): PlayerProfile {
  return normalizeProfile({
    id: row.id,
    handle: row.handle,
    email: row.email,
    xp: row.xp,
    level: row.level,
    stats: row.stats ?? undefined,
    settings: row.settings ?? undefined,
    updatedAt: row.updated_at
  });
}

function profileToRow(profile: PlayerProfile): PlayerProfileRow {
  return {
    id: profile.id,
    handle: profile.handle,
    email: profile.email,
    xp: profile.xp,
    level: profile.level,
    stats: profile.stats,
    settings: profile.settings,
    updated_at: profile.updatedAt
  };
}

function readLocalProfile(profileId: string): PlayerProfile | null {
  const cached = localProfiles.get(profileId);
  if (cached) return cached;

  if (!canUseLocalStorage()) return null;

  const raw = localStorage.getItem(`${PROFILE_PREFIX}${profileId}`);
  if (!raw) return null;

  try {
    const profile = normalizeProfile(JSON.parse(raw) as Partial<PlayerProfile>);
    localProfiles.set(profile.id, profile);
    return profile;
  } catch {
    localStorage.removeItem(`${PROFILE_PREFIX}${profileId}`);
    return null;
  }
}

function writeLocalProfile(profile: PlayerProfile): PlayerProfile {
  localProfiles.set(profile.id, profile);
  if (canUseLocalStorage()) localStorage.setItem(`${PROFILE_PREFIX}${profile.id}`, JSON.stringify(profile));
  return profile;
}

export function createDefaultProfile(identity: AuthIdentity): PlayerProfile {
  return normalizeProfile({}, identity);
}

export function applyProfilePatch(profile: PlayerProfile, patch: ProfilePatch): PlayerProfile {
  const xp = patch.xp ?? profile.xp;

  return normalizeProfile({
    ...profile,
    ...patch,
    xp,
    level: patch.level ?? calculateLevel(xp),
    stats: { ...profile.stats, ...patch.stats },
    settings: { ...profile.settings, ...patch.settings },
    updatedAt: new Date().toISOString()
  });
}

export async function fetchPlayerProfile(profileId: string): Promise<ProfileResult<PlayerProfile>> {
  if (!supabase) {
    const local = readLocalProfile(profileId);
    return local
      ? { ok: true, source: "local", data: local }
      : {
          ok: false,
          source: "local",
          error: { code: "profile_not_found", message: `Profile ${profileId} was not found.` }
        };
  }

  const { data, error } = await supabase
    .from("player_profiles")
    .select("id, handle, email, xp, level, stats, settings, updated_at")
    .eq("id", profileId)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      source: "supabase",
      error: { code: "profile_persistence_error", message: error.message }
    };
  }

  if (!data) {
    return {
      ok: false,
      source: "supabase",
      error: { code: "profile_not_found", message: `Profile ${profileId} was not found.` }
    };
  }

  return { ok: true, source: "supabase", data: rowToProfile(data as PlayerProfileRow) };
}

export async function savePlayerProfile(profile: PlayerProfile): Promise<ProfileResult<PlayerProfile>> {
  const normalized = normalizeProfile({ ...profile, updatedAt: new Date().toISOString() });
  writeLocalProfile(normalized);

  if (!supabase) return { ok: true, source: "local", data: normalized };

  const { data, error } = await supabase
    .from("player_profiles")
    .upsert(profileToRow(normalized))
    .select("id, handle, email, xp, level, stats, settings, updated_at")
    .single();

  if (error) {
    return {
      ok: false,
      source: "supabase",
      error: { code: "profile_persistence_error", message: error.message }
    };
  }

  return { ok: true, source: "supabase", data: rowToProfile(data as PlayerProfileRow) };
}

export async function updatePlayerProfile(
  profileId: string,
  patch: ProfilePatch
): Promise<ProfileResult<PlayerProfile>> {
  const current = await fetchPlayerProfile(profileId);
  if (!current.ok) return current;

  return savePlayerProfile(applyProfilePatch(current.data, patch));
}

export async function getOrCreatePlayerProfile(identity: AuthIdentity): Promise<ProfileResult<PlayerProfile>> {
  const current = await fetchPlayerProfile(identity.id);
  if (current.ok) return current;

  return savePlayerProfile(createDefaultProfile(identity));
}

export async function loadPlayerProfile(identity: AuthIdentity): Promise<PlayerProfile> {
  const result = await getOrCreatePlayerProfile(identity);
  return result.ok ? result.data : createDefaultProfile(identity);
}

export function awardXp(profile: PlayerProfile, amount: number): PlayerProfile {
  const xp = profile.xp + amount;
  return applyProfilePatch(profile, { xp });
}
