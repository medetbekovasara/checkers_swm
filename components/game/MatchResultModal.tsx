"use client";

import { RotateCcw, Send, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import type { GameState, Player } from "@/game-engine";
import { createLocalCoachReport } from "@/services/ai/coach";
import type { AiDifficulty } from "@/services/ai/difficulty";
import type { PlayMode } from "@/services/ai/modes";

type MatchResultModalProps = {
  state: GameState;
  playerSide: Player;
  difficulty: AiDifficulty;
  mode: PlayMode;
  startedAt: string;
  onRestart: () => void;
  onMenu: () => void;
};

export function MatchResultModal({
  state,
  playerSide,
  difficulty,
  mode,
  startedAt,
  onRestart,
  onMenu
}: MatchResultModalProps) {
  if (state.status === "active") return null;

  const result = getResultLabel(state, playerSide, mode);
  const captures = state.moves.reduce((sum, move) => sum + move.captures.length, 0);
  const durationSeconds = Math.max(1, Math.round((Date.now() - new Date(startedAt).getTime()) / 1000));
  const coach = createLocalCoachReport(state);
  const isLocalMatch = mode === "local";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/[0.28] px-4 py-6 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="w-full max-w-xl rounded-[8px] border border-[#ded8c9] bg-panel p-5 shadow-[0_24px_80px_rgba(48,54,61,0.22)] md:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-result-title"
      >
        <div className="flex items-start gap-3">
          <span className="rounded-full bg-mint/[0.12] p-3 text-mint">
            <Trophy className="h-5 w-5" />
          </span>
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-ink/[0.42]">Match Complete</div>
            <h2 id="match-result-title" className="mt-1 text-3xl font-semibold text-ink">
              {result.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink/[0.58]">{result.copy}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-4">
          <SummaryItem label="Mode" value={mode} />
          <SummaryItem label="Difficulty" value={difficulty} />
          <SummaryItem label="Moves" value={state.moves.length.toString()} />
          <SummaryItem label="Time" value={formatDuration(durationSeconds)} />
        </div>

        <div className="mt-4 rounded-[8px] border border-[#e6dfcf] bg-[#fbf8ef] p-4">
          <div className="text-sm font-semibold text-ink">{isLocalMatch ? "Match Summary" : "AI Coach"}</div>
          <p className="mt-2 text-sm leading-6 text-ink/[0.58]">
            {isLocalMatch ? "Local match complete. Review the move count, captures, and clock pressure before the rematch." : coach.summary}
          </p>
          <div className="mt-3 grid gap-2 text-sm text-ink/[0.62]">
            {(isLocalMatch ? getLocalSummaryItems(state) : coach.advice.slice(0, 2)).map((item) => (
              <div key={item} className="rounded-[8px] bg-white/70 px-3 py-2">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs uppercase tracking-[0.16em] text-ink/[0.38]">
            Style: {coach.style} · Captures: {captures}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onRestart}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[8px] bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink/[0.88] active:scale-[0.99]"
          >
            <RotateCcw className="h-4 w-4" />
            Restart
          </button>
          <button
            type="button"
            onClick={onMenu}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[8px] border border-[#d9d2c0] bg-white px-4 py-3 text-sm font-semibold text-ink/[0.72] transition hover:border-[#c8bea8] hover:text-ink active:scale-[0.99]"
          >
            <Send className="h-4 w-4" />
            Return to Menu
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function getResultLabel(state: GameState, playerSide: Player, mode: PlayMode) {
  if (state.status === "draw") {
    return {
      title: "Draw",
      copy: "Both sides reached a stable position. Review the final phase and look for faster conversion paths."
    };
  }

  if (mode === "local") {
    return {
      title: `${state.winner?.toUpperCase() ?? "Player"} wins`,
      copy: "Clock pressure and board control decided the local match."
    };
  }

  if (state.winner === playerSide) {
    return {
      title: "Victory",
      copy: "You converted the position. The summary below keeps the next improvement clear and lightweight."
    };
  }

  return {
    title: "Defeat",
    copy: "The AI found the cleaner path this time. Use the coach notes to tighten your next match."
  };
}

function getLocalSummaryItems(state: GameState) {
  const winner = state.winner ? `${state.winner.toUpperCase()} wins.` : "The match ended in a draw.";
  return [
    winner,
    `${state.currentPlayer.toUpperCase()} was the final active side.`
  ];
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[#e6dfcf] bg-white/70 px-3 py-3">
      <div className="text-xs uppercase tracking-[0.16em] text-ink/[0.38]">{label}</div>
      <div className="mt-1 capitalize text-sm font-semibold text-ink">{value}</div>
    </div>
  );
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}
