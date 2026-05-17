"use client";

import { BarChart3, Bot, Clock3, Globe2, Settings, Trophy, UserRound } from "lucide-react";
import type { PlayerProfile } from "@/services/profile/profile";
import { getRankTier } from "@/services/ranking/ranking";

export type PlatformScreen = "menu" | "ai-setup" | "online" | "rankings" | "profile" | "history" | "settings" | "game";

type MainMenuProps = {
  profile: PlayerProfile;
  onNavigate: (screen: PlatformScreen) => void;
  onLogout: () => void;
};

const items: Array<{ screen: PlatformScreen; label: string; description: string; icon: React.ReactNode; disabled?: boolean }> = [
  { screen: "ai-setup", label: "Play vs AI", description: "Choose difficulty and mode.", icon: <Bot className="h-5 w-5" /> },
  { screen: "online", label: "Play Online", description: "Create or join a room link.", icon: <Globe2 className="h-5 w-5" /> },
  { screen: "rankings", label: "Rankings", description: "See XP leaders and streaks.", icon: <Trophy className="h-5 w-5" /> },
  { screen: "profile", label: "Profile", description: "View progress and identity.", icon: <UserRound className="h-5 w-5" /> },
  { screen: "history", label: "Match History", description: "Recent games and rewards.", icon: <Clock3 className="h-5 w-5" /> },
  { screen: "settings", label: "Settings", description: "Session and comfort options.", icon: <Settings className="h-5 w-5" /> }
];

export function MainMenu({ profile, onNavigate, onLogout }: MainMenuProps) {
  const xpToNext = 500 - (profile.xp % 500);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 md:px-8">
      <header className="flex flex-col gap-4 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-ink/[0.52]">Welcome back, {profile.handle}</p>
          <h1 className="mt-1 text-4xl font-semibold text-ink md:text-6xl">Choose your next match.</h1>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="w-fit rounded-[8px] border border-[#ded8c9] bg-panel/[0.72] px-4 py-2 text-sm text-ink/[0.62] transition hover:bg-white hover:text-ink"
        >
          Sign out
        </button>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => !item.disabled && onNavigate(item.screen)}
              disabled={item.disabled}
              className="group min-h-28 rounded-[8px] border border-[#ded8c9] bg-panel/[0.84] p-4 text-left shadow-[0_12px_36px_rgba(63,69,75,0.09)] transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
            >
              <div className="mb-3 flex items-center justify-between text-ink">
                <span className="rounded-full bg-[#f2efe4] p-2 text-ink/[0.66]">{item.icon}</span>
                {item.disabled && <span className="text-xs text-ink/[0.42]">Soon</span>}
              </div>
              <div className="font-semibold text-ink">{item.label}</div>
              <div className="mt-1 text-sm leading-5 text-ink/[0.54]">{item.description}</div>
            </button>
          ))}
        </div>

        <aside className="rounded-[8px] border border-[#ded8c9] bg-panel/[0.84] p-5 shadow-[0_12px_36px_rgba(63,69,75,0.09)]">
          <div className="flex items-center gap-2 text-sm font-medium text-ink">
            <BarChart3 className="h-4 w-4 text-violet" />
            Progress
          </div>
          <div className="mt-5 text-5xl font-semibold text-ink">Lv {profile.level}</div>
          <div className="mt-2 text-sm text-ink/[0.54]">
            {getRankTier(profile.xp)} · {profile.xp} XP · {xpToNext} XP to next level
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#ece6d8]">
            <div className="h-full rounded-full bg-violet" style={{ width: `${(profile.xp % 500) / 5}%` }} />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <MiniStat label="Wins" value={profile.stats.wins} />
            <MiniStat label="Streak" value={profile.stats.streak} />
            <MiniStat label="Games" value={profile.stats.gamesPlayed} />
          </div>
        </aside>
      </section>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[8px] bg-[#f8f5ec] px-3 py-2">
      <div className="text-lg font-semibold text-ink">{value}</div>
      <div className="text-xs text-ink/[0.42]">{label}</div>
    </div>
  );
}
