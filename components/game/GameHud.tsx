"use client";

import { RotateCcw } from "lucide-react";
import { GameState } from "@/game-engine";
import { cn } from "@/lib/utils";
import type { AiDifficulty } from "@/services/ai/difficulty";
import { getPlayModeConfig, type GameTimers, type PlayMode } from "@/services/ai/modes";

type GameHudProps = {
  state: GameState;
  mode: PlayMode;
  aiDifficulty: AiDifficulty;
  timers: GameTimers;
  onReset: () => void;
  className?: string;
};

export function GameHud({
  state,
  mode,
  aiDifficulty,
  timers,
  onReset,
  className
}: GameHudProps) {
  return (
    <aside
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-[8px] border border-[#ded8c9] bg-panel/[0.84] p-2 shadow-[0_10px_28px_rgba(63,69,75,0.08)] backdrop-blur-xl",
        className
      )}
    >
      <div className="grid min-w-0 flex-1 grid-cols-3 gap-2">
        <Stat label="Moves" value={state.moves.length.toString()} />
        <Stat label="Mode" value={getPlayModeConfig(mode).label} />
        <Stat label="Difficulty" value={aiDifficulty} />
      </div>
      {mode === "local" && (
        <div className="grid shrink-0 grid-cols-2 gap-1 rounded-[8px] bg-[#f8f5ec] p-1 text-center">
          <div className="col-span-2 rounded-[6px] bg-white/70 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-ink/[0.58]">
            Turn {state.currentPlayer}
          </div>
          <ClockStat label="Red" active={state.currentPlayer === "red"} value={formatClock(timers.red)} />
          <ClockStat label="Black" active={state.currentPlayer === "black"} value={formatClock(timers.black)} />
        </div>
      )}
      <button
        type="button"
        onClick={() => onReset()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-[#ded8c9] bg-[#f8f5ec] text-ink/[0.58] transition hover:border-[#c9c0aa] hover:bg-white hover:text-ink active:scale-[0.98]"
        aria-label="Reset match"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
    </aside>
  );
}

function ClockStat({ label, active, value }: { label: string; active: boolean; value: string }) {
  return (
    <div
      className={cn(
        "min-w-12 rounded-[6px] px-2 py-1 transition",
        active ? "bg-volt/[0.14] text-ink" : "text-ink/[0.55]"
      )}
    >
      <div className="text-[9px] font-semibold uppercase tracking-[0.12em]">{label}</div>
      <div className="font-mono text-xs font-semibold">{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[8px] bg-[#f8f5ec] px-2 py-2 text-center sm:px-3">
      <div className="truncate text-[10px] uppercase tracking-[0.12em] text-ink/[0.38]">{label}</div>
      <div className="mt-1 truncate text-xs font-semibold capitalize text-ink sm:text-sm">{value}</div>
    </div>
  );
}

function formatClock(milliseconds: number | null) {
  if (milliseconds === null) return "--:--";
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
