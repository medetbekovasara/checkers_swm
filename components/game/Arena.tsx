"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Eye, Radio } from "lucide-react";
import { CheckersBoard } from "@/components/board/CheckersBoard";
import { GameHud } from "@/components/game/GameHud";
import { MatchResultModal } from "@/components/game/MatchResultModal";
import { ReplayTimeline } from "@/components/game/ReplayTimeline";
import { useChaosCheckers } from "@/hooks/useChaosCheckers";
import type { GameState, Player } from "@/game-engine";
import type { AiDifficulty } from "@/services/ai/difficulty";
import type { PlayMode } from "@/services/ai/modes";

export type MatchCompletion = {
  state: GameState;
  playerSide: Player;
  difficulty: AiDifficulty;
  mode: PlayMode;
  startedAt: string;
  completedAt: string;
};

type ArenaProps = {
  initialMode?: PlayMode;
  initialDifficulty?: AiDifficulty;
  onExit?: () => void;
  onMatchComplete?: (match: MatchCompletion) => void;
};

export function Arena({
  initialMode = "chaos",
  initialDifficulty = "intermediate",
  onExit,
  onMatchComplete
}: ArenaProps) {
  const {
    state,
    selectedMoves,
    aiDifficulty,
    setAiDifficulty,
    mode,
    modeConfig,
    timers,
    selectPiece,
    moveSelectedTo,
    playerSide,
    isAiThinking,
    reset
  } = useChaosCheckers(initialMode, initialDifficulty, "red");

  const [origin, setOrigin] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const reportedMatchRef = useRef<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (state.status === "active") return;

    const reportKey = `${state.id}:${state.status}:${state.moves.length}`;
    if (reportedMatchRef.current === reportKey) return;
    reportedMatchRef.current = reportKey;

    onMatchComplete?.({
      state,
      playerSide,
      difficulty: aiDifficulty,
      mode: initialMode,
      startedAt,
      completedAt: new Date().toISOString()
    });
  }, [aiDifficulty, initialMode, onMatchComplete, playerSide, startedAt, state]);

  const roomUrl = origin ? `${origin}/room/${state.id}` : `/room/${state.id}`;
  const restartMatch = () => {
    reportedMatchRef.current = null;
    setStartedAt(new Date().toISOString());
    reset(initialMode);
  };

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

      <section className="mx-auto grid max-w-6xl gap-4 lg:gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        <GameHud
          state={state}
          mode={mode}
          modeConfig={modeConfig}
          timers={timers}
          aiDifficulty={aiDifficulty}
          onAiDifficultyChange={setAiDifficulty}
          isAiThinking={isAiThinking}
          onReset={restartMatch}
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

          {modeConfig.gameplay.chaosEvents && state.chaosLog.length > 0 && (
            <div className="rounded-[8px] border border-violet/[0.22] bg-violet/[0.10] px-4 py-3 text-sm text-ink/[0.66] shadow-sm">
              <span className="font-semibold uppercase tracking-[0.12em] text-ink">CHAOS EVENT: SIDES SWAPPED</span>
              <span className="mx-2 text-ink/[0.35]">·</span>
              {state.chaosLog[state.chaosLog.length - 1]?.description}
            </div>
          )}

          <ReplayTimeline moves={state.moves} />
        </div>
      </section>

      <MatchResultModal
        state={state}
        playerSide={playerSide}
        difficulty={aiDifficulty}
        mode={initialMode}
        startedAt={startedAt}
        onRestart={restartMatch}
        onMenu={onExit ?? restartMatch}
      />
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
