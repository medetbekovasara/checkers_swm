"use client";

import { ArrowLeft, Play } from "lucide-react";
import { AI_DIFFICULTIES, type AiDifficulty } from "@/services/ai/difficulty";
import { AI_MODE_ORDER, getPlayModeConfig, type PlayMode } from "@/services/ai/modes";
import { cn } from "@/lib/utils";

type AiSetupScreenProps = {
  difficulty: AiDifficulty;
  mode: PlayMode;
  onDifficultyChange: (difficulty: AiDifficulty) => void;
  onModeChange: (mode: PlayMode) => void;
  onStart: () => void;
  onBack: () => void;
};

export function AiSetupScreen({ difficulty, mode, onDifficultyChange, onModeChange, onStart, onBack }: AiSetupScreenProps) {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-6 md:px-8">
      <button type="button" onClick={onBack} className="mb-5 flex items-center gap-2 text-sm text-ink/[0.56] hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Menu
      </button>
      <header className="mb-5">
        <h1 className="text-4xl font-semibold text-ink md:text-5xl">Set up AI match.</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/[0.58]">
          Pick a difficulty and mode. Preview modes currently map to stable engine rules while the platform grows.
        </p>
      </header>

      <section className="grid gap-5 lg:grid-cols-2">
        <ChoiceGroup title="Difficulty">
          {AI_DIFFICULTIES.map((item) => (
            <ChoiceButton
              key={item.id}
              selected={difficulty === item.id}
              label={item.label}
              description={item.description}
              onClick={() => onDifficultyChange(item.id)}
            />
          ))}
        </ChoiceGroup>

        <ChoiceGroup title="Mode">
          {AI_MODE_ORDER.map((modeId) => {
            const item = getPlayModeConfig(modeId);
            return (
            <ChoiceButton
              key={item.id}
              selected={mode === item.id}
              label={item.label}
              description={item.description}
              onClick={() => onModeChange(item.id)}
            />
          );
          })}
        </ChoiceGroup>
      </section>

      <button
        type="button"
        onClick={onStart}
        className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-ink px-5 font-semibold text-bone transition hover:bg-[#34383d] md:w-fit"
      >
        <Play className="h-4 w-4" />
        Start game
      </button>
    </main>
  );
}

function ChoiceGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[8px] border border-[#ded8c9] bg-panel/[0.84] p-4 shadow-[0_12px_36px_rgba(63,69,75,0.09)]">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-ink/[0.46]">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ChoiceButton({ selected, label, description, onClick }: {
  selected: boolean;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-[8px] border p-3 text-left transition active:scale-[0.99]",
        selected
          ? "border-violet/[0.45] bg-violet/[0.12]"
          : "border-[#e4ddcb] bg-[#f8f5ec] hover:bg-white"
      )}
    >
      <div className="font-semibold text-ink">{label}</div>
      <div className="mt-1 text-sm leading-5 text-ink/[0.55]">{description}</div>
    </button>
  );
}
