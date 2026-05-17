"use client";

import { useEffect, useRef, useState } from "react";
import { CheckersBoard } from "@/components/board/CheckersBoard";
import { GameHud } from "@/components/game/GameHud";
import { MatchResultModal } from "@/components/game/MatchResultModal";
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
    mode,
    modeConfig,
    timers,
    selectPiece,
    moveSelectedTo,
    playerSide,
    isAiThinking,
    reset
  } = useChaosCheckers(initialMode, initialDifficulty, "red");

  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const reportedMatchRef = useRef<string | null>(null);

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

  const restartMatch = () => {
    reportedMatchRef.current = null;
    setStartedAt(new Date().toISOString());
    reset(initialMode);
  };

  return (
    <main className="min-h-screen px-2 py-3 sm:px-4 md:px-6 md:py-5">
      <section className="mx-auto flex max-w-4xl flex-col gap-3">
        <GameHud
          state={state}
          mode={mode}
          aiDifficulty={aiDifficulty}
          timers={timers}
          onReset={restartMatch}
        />

        <div className="min-w-0 space-y-3">
          <div className="rounded-[8px] border border-[#ded8c9] bg-panel/[0.82] p-2 shadow-[0_14px_38px_rgba(63,69,75,0.10)] backdrop-blur-xl sm:p-3">
            <div className="flex justify-center">
              <CheckersBoard
                state={state}
                selectedMoves={selectedMoves}
                playablePlayer={modeConfig.gameplay.localMultiplayer ? undefined : playerSide}
                onSelectPiece={selectPiece}
                onMoveTo={moveSelectedTo}
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 rounded-[8px] bg-[#f2efe4] px-3 py-2 text-xs text-ink/[0.56]">
              {onExit && (
                <button
                  type="button"
                  onClick={onExit}
                  className="rounded-full border border-[#d9d2c0] px-3 py-1 text-ink/[0.58] transition hover:bg-white hover:text-ink sm:hidden"
                >
                  Menu
                </button>
              )}
              <span className="truncate">
                {isAiThinking
                  ? "AI thinking..."
                  : modeConfig.gameplay.localMultiplayer
                    ? `${state.currentPlayer.toUpperCase()} to move.`
                    : "Tap a piece, then choose a square."}
              </span>
              {onExit && (
                <button
                  type="button"
                  onClick={onExit}
                  className="hidden rounded-full border border-[#d9d2c0] px-3 py-1 text-ink/[0.58] transition hover:bg-white hover:text-ink sm:block"
                >
                  Menu
                </button>
              )}
            </div>
          </div>

          {modeConfig.gameplay.chaosEvents && state.chaosLog.length > 0 && (
            <div className="rounded-[8px] border border-violet/[0.22] bg-violet/[0.10] px-4 py-3 text-sm text-ink/[0.66] shadow-sm">
              <span className="font-semibold uppercase tracking-[0.12em] text-ink">CHAOS EVENT: SIDES SWAPPED</span>
              <span className="mx-2 text-ink/[0.35]">·</span>
              {state.chaosLog[state.chaosLog.length - 1]?.description}
            </div>
          )}
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
