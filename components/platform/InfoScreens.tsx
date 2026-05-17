"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, History, Settings, Trophy, UserRound } from "lucide-react";
import { Leaderboard } from "@/components/game/Leaderboard";
import type { PlayerProfile } from "@/services/profile/profile";
import { fetchMatchHistory, type MatchHistoryRecord } from "@/services/history/history";
import { getRankTier } from "@/services/ranking/ranking";

type InfoScreenProps = {
  profile: PlayerProfile;
  onBack: () => void;
};

export function ProfileScreen({ profile, onBack }: InfoScreenProps) {
  return (
    <ScreenShell title="Profile" icon={<UserRound className="h-5 w-5" />} onBack={onBack}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Level" value={profile.level.toString()} />
        <Stat label="XP" value={profile.xp.toString()} />
        <Stat label="Streak" value={profile.stats.streak.toString()} />
      </div>
      <div className="rounded-[8px] border border-[#ded8c9] bg-panel/[0.84] p-4">
        <div className="text-sm text-ink/[0.52]">Handle</div>
        <div className="mt-1 text-2xl font-semibold text-ink">{profile.handle}</div>
        <div className="mt-3 grid gap-2 text-sm text-ink/[0.56] sm:grid-cols-2">
          <div>{profile.email ?? "Guest session"}</div>
          <div className="font-medium text-ink/[0.66]">Rank: {getRankTier(profile.xp)}</div>
          <div>Matches: {profile.stats.gamesPlayed}</div>
          <div>W/L/D: {profile.stats.wins}/{profile.stats.losses}/{profile.stats.draws}</div>
        </div>
      </div>
    </ScreenShell>
  );
}

export function RankingsScreen({ profile, onBack }: InfoScreenProps) {
  return (
    <ScreenShell title="Rankings" icon={<Trophy className="h-5 w-5" />} onBack={onBack}>
      <div className="rounded-[8px] border border-violet/[0.22] bg-violet/[0.08] p-4 text-sm text-ink/[0.62]">
        {profile.handle}, keep climbing through XP wins and streak bonuses.
      </div>
      <Leaderboard />
    </ScreenShell>
  );
}

export function MatchHistoryScreen({ profile, onBack }: InfoScreenProps) {
  const [matches, setMatches] = useState<MatchHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    void fetchMatchHistory(profile.id, 20)
      .then((result) => {
        if (active && result.ok) setMatches(result.data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [profile.id]);

  return (
    <ScreenShell title="Match History" icon={<History className="h-5 w-5" />} onBack={onBack}>
      {loading ? (
        <EmptyState title="Loading matches" copy="Pulling your recent AI games and summaries." />
      ) : matches.length === 0 ? (
        <EmptyState title="No saved matches yet" copy="Finished AI games will appear here after your next match." />
      ) : (
        <div className="space-y-3">
          {matches.map((match) => (
            <MatchHistoryItem key={match.id} match={match} />
          ))}
        </div>
      )}
    </ScreenShell>
  );
}

export function SettingsScreen({ profile, onBack }: InfoScreenProps) {
  return (
    <ScreenShell title="Settings" icon={<Settings className="h-5 w-5" />} onBack={onBack}>
      <div className="rounded-[8px] border border-[#ded8c9] bg-panel/[0.84] p-4">
        <div className="flex items-center justify-between gap-3 border-b border-[#ebe5d7] pb-3">
          <div>
            <div className="font-semibold text-ink">Sound</div>
            <div className="text-sm text-ink/[0.52]">Prepared for future move and reward cues.</div>
          </div>
          <span className="rounded-full bg-mint/[0.10] px-3 py-1 text-sm text-ink/[0.62]">
            {profile.settings.sound ? "On" : "Off"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 pt-3">
          <div>
            <div className="font-semibold text-ink">Reduced motion</div>
            <div className="text-sm text-ink/[0.52]">Stored in profile settings.</div>
          </div>
          <span className="rounded-full bg-[#f2efe4] px-3 py-1 text-sm text-ink/[0.62]">
            {profile.settings.reducedMotion ? "On" : "Off"}
          </span>
        </div>
      </div>
    </ScreenShell>
  );
}

function ScreenShell({ title, icon, onBack, children }: {
  title: string;
  icon: React.ReactNode;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-6 md:px-8">
      <button type="button" onClick={onBack} className="mb-5 flex items-center gap-2 text-sm text-ink/[0.56] hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Menu
      </button>
      <header className="mb-5 flex items-center gap-3">
        <span className="rounded-full border border-[#ded8c9] bg-panel/[0.78] p-3 text-ink/[0.62]">{icon}</span>
        <h1 className="text-4xl font-semibold text-ink md:text-5xl">{title}</h1>
      </header>
      <div className="space-y-4">{children}</div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[#ded8c9] bg-panel/[0.84] p-4">
      <div className="text-3xl font-semibold text-ink">{value}</div>
      <div className="mt-1 text-sm text-ink/[0.48]">{label}</div>
    </div>
  );
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-[8px] border border-[#ded8c9] bg-panel/[0.84] p-6 text-center">
      <div className="text-xl font-semibold text-ink">{title}</div>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/[0.56]">{copy}</p>
    </div>
  );
}

function MatchHistoryItem({ match }: { match: MatchHistoryRecord }) {
  return (
    <div className="rounded-[8px] border border-[#ded8c9] bg-panel/[0.84] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="capitalize text-lg font-semibold text-ink">{match.result}</div>
          <div className="mt-1 text-sm text-ink/[0.54]">
            vs {match.opponent} · {match.mode} · {match.difficulty}
          </div>
        </div>
        <div className="text-sm text-ink/[0.48]">{formatDate(match.completedAt)}</div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Stat label="Duration" value={formatDuration(match.durationSeconds)} />
        <Stat label="Moves" value={match.moves.length.toString()} />
        <Stat label="Captures" value={match.moves.reduce((sum, move) => sum + move.captures.length, 0).toString()} />
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}
