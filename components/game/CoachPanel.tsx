"use client";

import { useMemo } from "react";
import { Brain } from "lucide-react";
import { GameState } from "@/game-engine";
import { createLocalCoachReport } from "@/services/ai/coach";

export function CoachPanel({ state }: { state: GameState }) {
  const report = useMemo(() => createLocalCoachReport(state), [state]);

  return (
    <section className="rounded-[8px] border border-[#ded8c9] bg-panel/[0.82] p-4 shadow-[0_14px_38px_rgba(63,69,75,0.10)] backdrop-blur-xl">
      <div className="flex items-center gap-2 text-sm font-medium text-ink">
        <Brain className="h-4 w-4 text-mint" />
        AI Coach
      </div>
      <p className="mt-3 text-sm leading-6 text-ink/[0.60]">{report.summary}</p>
      <div className="mt-4 space-y-2">
        {report.advice.map((item) => (
          <div key={item} className="rounded-[8px] border border-[#e4ddcb] bg-[#f8f5ec] px-3 py-2 text-sm leading-5 text-ink/[0.60]">
            {item}
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-[8px] border border-mint/[0.22] bg-mint/[0.10] px-3 py-2 text-sm capitalize text-ink/[0.72]">
        Style: {report.style}
      </div>
    </section>
  );
}
