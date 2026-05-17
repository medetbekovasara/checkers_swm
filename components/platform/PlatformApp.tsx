"use client";

import { useState } from "react";
import { Arena } from "@/components/game/Arena";
import { AiSetupScreen } from "@/components/platform/AiSetupScreen";
import { AuthScreen } from "@/components/platform/AuthScreen";
import { MainMenu, type PlatformScreen } from "@/components/platform/MainMenu";
import { MatchHistoryScreen, ProfileScreen, RankingsScreen, SettingsScreen } from "@/components/platform/InfoScreens";
import { useAuthSession } from "@/hooks/useAuthSession";
import { usePlatformProfile } from "@/hooks/usePlatformProfile";
import type { AiDifficulty } from "@/services/ai/difficulty";
import type { PlayMode } from "@/services/ai/modes";

export function PlatformApp() {
  const auth = useAuthSession();
  const { profile, loading: profileLoading } = usePlatformProfile(auth.identity);
  const [screen, setScreen] = useState<PlatformScreen>("menu");
  const [difficulty, setDifficulty] = useState<AiDifficulty>("intermediate");
  const [mode, setMode] = useState<PlayMode>("chaos");

  if (auth.loading || profileLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 text-sm text-ink/[0.58]">
        Preparing your board...
      </main>
    );
  }

  if (!auth.identity || !profile) {
    return (
      <AuthScreen
        error={auth.error}
        onLogin={auth.login}
        onSignup={auth.signup}
        onGuest={auth.continueAsGuest}
      />
    );
  }

  if (screen === "ai-setup") {
    return (
      <AiSetupScreen
        difficulty={difficulty}
        mode={mode}
        onDifficultyChange={setDifficulty}
        onModeChange={setMode}
        onStart={() => setScreen("game")}
        onBack={() => setScreen("menu")}
      />
    );
  }

  if (screen === "game") {
    return <Arena initialMode={mode} initialDifficulty={difficulty} onExit={() => setScreen("menu")} />;
  }

  if (screen === "rankings") return <RankingsScreen profile={profile} onBack={() => setScreen("menu")} />;
  if (screen === "profile") return <ProfileScreen profile={profile} onBack={() => setScreen("menu")} />;
  if (screen === "history") return <MatchHistoryScreen onBack={() => setScreen("menu")} />;
  if (screen === "settings") return <SettingsScreen profile={profile} onBack={() => setScreen("menu")} />;

  return (
    <MainMenu
      profile={profile}
      onNavigate={setScreen}
      onLogout={() => void auth.logout()}
    />
  );
}
