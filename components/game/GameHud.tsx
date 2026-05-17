"use client";

import { Bot, Flame, RotateCcw, Swords, Users } from "lucide-react";
import { GameMode, GameState } from "@/game-engine";
import { cn } from "@/lib/utils";
import { AI_DIFFICULTIES, type AiDifficulty } from "@/services/ai/difficulty";

type GameHudProps = {
  state: GameState;
  aiDifficulty: AiDifficulty;
  onAiDifficultyChange: (difficulty: AiDifficulty) => void;
  isAiThinking?: boolean;
  onReset: (mode?: GameMode) => void;
  className?: string;
};

export function GameHud({ state, aiDifficulty, onAiDifficultyChange, isAiThinking = false, onReset, className }: GameHudProps) {
  return (
    <aside className={cn("flex min-w-0 flex-col gap-4", className)}>
      <div className="rounded-[8px] border border-[#ded8c9] bg-panel/[0.82] p-4 shadow-[0_14px_38px_rgba(63,69,75,0.10)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-ink/[0.42]">Live Match</p>
            <h2 className="mt-1 text-2xl font-semibold text-ink">Chaos Arena</h2>
          </div>
          <div className="rounded-full border border-mint/[0.22] bg-mint/[0.10] p-3 text-mint">
            <Swords className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <Stat label="Turn" value={state.turn.toString()} />
          <Stat label="Mode" value={state.mode} />
          <Stat label="Player" value={state.currentPlayer} />
        </div>
      </div>

      <div className="rounded-[8px] border border-[#ded8c9] bg-panel/[0.82] p-4 shadow-[0_14px_38px_rgba(63,69,75,0.10)] backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
          <Bot className="h-4 w-4 text-mint" />
          AI Difficulty
        </div>
        <div className="grid grid-cols-2 gap-2">
          {AI_DIFFICULTIES.map((difficulty) => (
            <button
              key={difficulty.id}
              type="button"
              onClick={() => onAiDifficultyChange(difficulty.id)}
              className={cn(
                "min-h-10 rounded-[8px] border px-3 py-2 text-sm capitalize transition active:scale-[0.98]",
                aiDifficulty === difficulty.id
                  ? "border-mint/[0.45] bg-mint/[0.16] text-ink shadow-sm"
                  : "border-[#ded8c9] bg-[#f8f5ec] text-ink/[0.62] hover:border-[#c9c0aa] hover:bg-white hover:text-ink"
              )}
            >
              {difficulty.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-[#ded8c9] bg-[#f8f5ec] px-4 py-3 text-sm font-medium text-ink/[0.64]">
          <Bot className="h-4 w-4" />
          {state.status !== "active" ? "Match Complete" : isAiThinking ? "AI thinking..." : "AI responds automatically"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onReset("classic")}
          className="flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-[#ded8c9] bg-panel/[0.76] px-3 py-3 text-sm text-ink/[0.68] transition hover:border-[#c9c0aa] hover:bg-white hover:text-ink active:scale-[0.98]"
        >
          <Users className="h-4 w-4" />
          Classic
        </button>
        <button
          type="button"
          onClick={() => onReset("chaos")}
          className="flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-violet/[0.28] bg-violet/[0.10] px-3 py-3 text-sm text-ink/[0.72] transition hover:border-violet/[0.42] hover:bg-violet/[0.14] hover:text-ink active:scale-[0.98]"
        >
          <Flame className="h-4 w-4" />
          Chaos
        </button>
      </div>

      <button
        type="button"
        onClick={() => onReset()}
        className="flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-[#ded8c9] bg-transparent px-4 py-3 text-sm text-ink/[0.58] transition hover:border-[#c9c0aa] hover:bg-panel/[0.68] hover:text-ink active:scale-[0.98]"
      >
        <RotateCcw className="h-4 w-4" />
        Reset Match
      </button>
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[#e4ddcb] bg-[#f8f5ec] px-3 py-2">
      <div className="text-[11px] uppercase tracking-[0.14em] text-ink/[0.38]">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold capitalize text-ink">{value}</div>
    </div>
  );
}
