"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Eye, Radio } from "lucide-react";
import { CheckersBoard } from "@/components/board/CheckersBoard";
import { ChaosFeed } from "@/components/game/ChaosFeed";
import { CoachPanel } from "@/components/game/CoachPanel";
import { GameHud } from "@/components/game/GameHud";
import { Leaderboard } from "@/components/game/Leaderboard";
import { ReplayTimeline } from "@/components/game/ReplayTimeline";
import { useChaosCheckers } from "@/hooks/useChaosCheckers";
import type { AiDifficulty } from "@/services/ai/difficulty";
import { getPlayModeConfig, type PlayMode } from "@/services/ai/modes";

type ArenaProps = {
  initialMode?: PlayMode;
  initialDifficulty?: AiDifficulty;
  onExit?: () => void;
};

export function Arena({ initialMode = "chaos", initialDifficulty = "intermediate", onExit }: ArenaProps) {
  const {
    state,
    selectedMoves,
    aiDifficulty,
    setAiDifficulty,
    selectPiece,
    moveSelectedTo,
    playerSide,
    isAiThinking,
    reset
  } = useChaosCheckers(getPlayModeConfig(initialMode).engineMode, initialDifficulty, "red");

  const [origin, setOrigin] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const roomUrl = origin ? `${origin}/room/${state.id}` : `/room/${state.id}`;

  const copyRoomLink = async () => {
    if (!navigator.clipboard) {
      setCopyState("failed");
      return;
    }

    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1600);
    } catch {
      setCopyState("failed");
      window.setTimeout(() => setCopyState("idle"), 1800);
    }
  };

  return (
    <main className="min-h-screen px-3 py-4 sm:px-5 md:px-8 md:py-6">
      <header className="mx-auto flex max-w-7xl flex-col gap-4 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 inline-flex rounded-full border border-[#ded8c9] bg-panel/[0.72] px-3 py-1 text-xs font-medium text-ink/[0.55] shadow-sm backdrop-blur-xl">
            Modern strategy board
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-ink md:text-5xl">
            Chaos Checkers
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/[0.62] md:text-base">
            A calm competitive board for checkers, AI practice, replay, and light chaos events.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill icon={<Radio className="h-4 w-4" />} label="Realtime-ready" />
          <Pill icon={<Eye className="h-4 w-4" />} label="Spectator architecture" />
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-4 lg:gap-5 xl:grid-cols-[270px_minmax(0,1fr)_300px]">
        <GameHud
          state={state}
          aiDifficulty={aiDifficulty}
          onAiDifficultyChange={setAiDifficulty}
          isAiThinking={isAiThinking}
          onReset={reset}
          className="order-2 xl:order-1"
        />

        <div className="order-1 min-w-0 space-y-4 xl:order-2">
          <div className="rounded-[8px] border border-[#ded8c9] bg-panel/[0.82] p-3 shadow-[0_16px_48px_rgba(63,69,75,0.12)] backdrop-blur-xl md:p-4">
            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-ink/[0.42]">Room Link</div>
                <div className="mt-1 max-w-[72vw] truncate text-sm text-ink/[0.58] md:max-w-md">{roomUrl}</div>
              </div>
              <button
                type="button"
                onClick={() => void copyRoomLink()}
                className="flex min-h-10 items-center justify-center gap-2 rounded-[8px] border border-[#d9d2c0] bg-[#f7f3e8] px-3 py-2 text-sm text-ink/[0.72] transition hover:border-[#c9c0aa] hover:bg-white hover:text-ink active:scale-[0.98]"
                aria-live="polite"
              >
                {copyState === "copied" ? <Check className="h-4 w-4 text-mint" /> : <Copy className="h-4 w-4" />}
                {copyState === "copied" ? "Copied" : copyState === "failed" ? "Unavailable" : "Copy"}
              </button>
            </div>
            <div className="flex justify-center">
              <CheckersBoard
                state={state}
                selectedMoves={selectedMoves}
                playablePlayer={playerSide}
                onSelectPiece={selectPiece}
                onMoveTo={moveSelectedTo}
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-[8px] bg-[#f2efe4] px-3 py-2 text-xs text-ink/[0.56]">
              {onExit && (
                <button
                  type="button"
                  onClick={onExit}
                  className="rounded-full border border-[#d9d2c0] px-3 py-1 text-ink/[0.58] transition hover:bg-white hover:text-ink sm:hidden"
                >
                  Menu
                </button>
              )}
              <span>{isAiThinking ? "AI thinking..." : "Tap a piece, then choose a highlighted square."}</span>
              <div className="hidden items-center gap-3 sm:flex">
                {onExit && (
                  <button
                    type="button"
                    onClick={onExit}
                    className="rounded-full border border-[#d9d2c0] px-3 py-1 text-ink/[0.58] transition hover:bg-white hover:text-ink"
                  >
                    Menu
                  </button>
                )}
                <span>Turn {state.turn}</span>
              </div>
            </div>
          </div>

          <ReplayTimeline moves={state.moves} />
        </div>

        <div className="order-3 min-w-0 space-y-4">
          <ChaosFeed state={state} />
          <CoachPanel state={state} />
          <Leaderboard />
        </div>
      </section>
    </main>
  );
}

function Pill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[#ded8c9] bg-panel/[0.72] px-3 py-2 text-sm text-ink/[0.58] shadow-sm backdrop-blur-xl">
      {icon}
      {label}
    </div>
  );
}
