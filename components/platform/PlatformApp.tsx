"use client";

import { useCallback, useRef, useState } from "react";
import { Arena, type MatchCompletion } from "@/components/game/Arena";
import { AiSetupScreen } from "@/components/platform/AiSetupScreen";
import { AuthScreen } from "@/components/platform/AuthScreen";
import { MainMenu, type PlatformScreen } from "@/components/platform/MainMenu";
import { MatchHistoryScreen, ProfileScreen, RankingsScreen, SettingsScreen } from "@/components/platform/InfoScreens";
import { useAuthSession } from "@/hooks/useAuthSession";
import { usePlatformProfile } from "@/hooks/usePlatformProfile";
import type { AiDifficulty } from "@/services/ai/difficulty";
import type { PlayMode } from "@/services/ai/modes";
import { saveMatchHistoryRecord } from "@/services/history/history";
import { createStateHash } from "@/services/multiplayer/events";
import { applyRankResult } from "@/services/ranking/ranking";

export function PlatformApp() {
  const auth = useAuthSession();
  const { profile, loading: profileLoading, updateProfile } = usePlatformProfile(auth.identity);
  const [screen, setScreen] = useState<PlatformScreen>("menu");
  const [difficulty, setDifficulty] = useState<AiDifficulty>("intermediate");
  const [mode, setMode] = useState<PlayMode>("chaos");
  const persistedMatchesRef = useRef<Set<string>>(new Set());

  const handleMatchComplete = useCallback((match: MatchCompletion) => {
    if (!profile) return;

    const key = `${match.state.id}:${match.state.status}:${match.state.moves.length}`;
    if (persistedMatchesRef.current.has(key)) return;
    persistedMatchesRef.current.add(key);

    const nextProfile = applyRankResult(profile, match.state.winner, match.playerSide, {
      difficulty: match.difficulty,
      mode: match.mode
    });
    updateProfile(nextProfile);

    const result = match.state.winner === null
      ? "draw"
      : match.state.winner === match.playerSide
        ? "victory"
        : "defeat";

    void saveMatchHistoryRecord({
      mode: match.mode,
      difficulty: match.difficulty,
      opponent: `${match.difficulty} AI`,
      durationSeconds: Math.max(
        1,
        Math.round((new Date(match.completedAt).getTime() - new Date(match.startedAt).getTime()) / 1000)
      ),
      result,
      players: [
        { id: profile.id, handle: profile.handle, side: match.playerSide },
        { id: "ai-opponent", handle: `${match.difficulty} AI`, side: match.playerSide === "red" ? "black" : "red" }
      ],
      winner: match.state.winner,
      moves: match.state.moves,
      startedAt: match.startedAt,
      completedAt: match.completedAt,
      stateHash: createStateHash(match.state)
    });
  }, [profile, updateProfile]);

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
    return (
      <Arena
        initialMode={mode}
        initialDifficulty={difficulty}
        onExit={() => setScreen("menu")}
        onMatchComplete={handleMatchComplete}
      />
    );
  }

  if (screen === "rankings") return <RankingsScreen profile={profile} onBack={() => setScreen("menu")} />;
  if (screen === "profile") return <ProfileScreen profile={profile} onBack={() => setScreen("menu")} />;
  if (screen === "history") return <MatchHistoryScreen profile={profile} onBack={() => setScreen("menu")} />;
  if (screen === "settings") return <SettingsScreen profile={profile} onBack={() => setScreen("menu")} />;

  return (
    <MainMenu
      profile={profile}
      onNavigate={setScreen}
      onLogout={() => void auth.logout()}
    />
  );
}
