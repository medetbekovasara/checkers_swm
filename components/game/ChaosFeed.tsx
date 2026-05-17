"use client";

import { Zap } from "lucide-react";
import { GameState } from "@/game-engine";

export function ChaosFeed({ state }: { state: GameState }) {
  return (
    <section className="rounded-[8px] border border-[#ded8c9] bg-panel/[0.82] p-4 shadow-[0_14px_38px_rgba(63,69,75,0.10)] backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
        <Zap className="h-4 w-4 text-volt" />
        Chaos Feed
      </div>
      <div className="space-y-3">
        {state.chaosLog.length === 0 ? (
          <p className="text-sm leading-6 text-ink/[0.54]">Chaos events unlock after the opening.</p>
        ) : (
          state.chaosLog.slice(-4).reverse().map((event) => (
            <div key={event.id} className="rounded-[8px] border border-[#e4ddcb] bg-[#f8f5ec] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink">{event.label}</span>
                <span className="text-xs text-ink/[0.42]">T{event.turn}</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-ink/[0.58]">{event.description}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
