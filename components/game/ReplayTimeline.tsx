"use client";

import { Move } from "@/game-engine";

type ReplayTimelineProps = {
  moves: Move[];
};

export function ReplayTimeline({ moves }: ReplayTimelineProps) {
  return (
    <section className="rounded-[8px] border border-[#ded8c9] bg-panel/[0.82] p-4 shadow-[0_14px_38px_rgba(63,69,75,0.10)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-ink">Replay Timeline</h2>
        <span className="text-xs text-ink/[0.44]">{moves.length} moves</span>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {moves.length === 0 ? (
          <div className="text-sm text-ink/[0.52]">Moves will appear here as an animated timeline.</div>
        ) : (
          moves.map((move, index) => {
            const end = move.path[move.path.length - 1];
            return (
              <div
                key={move.id}
                className="min-w-24 rounded-[8px] border border-[#e4ddcb] bg-[#f8f5ec] p-3 text-xs text-ink/[0.62]"
              >
                <div className="font-semibold text-ink">#{index + 1}</div>
                <div className="mt-1 capitalize">{move.player}</div>
                <div className="mt-1 text-ink/[0.44]">r{end.row + 1} c{end.col + 1}</div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
