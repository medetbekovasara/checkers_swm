import type { GameMode, Player } from "@/game-engine";

export type AiMode = "classic" | "chaos" | "local";
export type PlayMode = AiMode;
export type GameTimers = Record<Player, number | null>;

export type AiModeConfig = {
  id: AiMode;
  label: string;
  description: string;
  engineMode: GameMode;
  gameplay: {
    chaosEvents: boolean;
    chaosIntervalTurns: number | null;
    chaosStartsAfterTurn: number;
    chaosProbability: number;
    chaosCooldownTurns: number;
    chaosMaxEvents: number;
    timers: boolean;
    initialClockSeconds: number | null;
    aiDelayMs: number;
    localMultiplayer: boolean;
  };
};

export const AI_MODES = {
  classic: {
    id: "classic",
    label: "Classic",
    description: "Standard checkers rules using the classic engine mode.",
    engineMode: "classic",
    gameplay: {
      chaosEvents: false,
      chaosIntervalTurns: null,
      chaosStartsAfterTurn: 0,
      chaosProbability: 0,
      chaosCooldownTurns: 0,
      chaosMaxEvents: 0,
      timers: false,
      initialClockSeconds: null,
      aiDelayMs: 360,
      localMultiplayer: false
    }
  },
  chaos: {
    id: "chaos",
    label: "Chaos",
    description: "Adaptive checkers with rare board events that force strategic resets.",
    engineMode: "chaos",
    gameplay: {
      chaosEvents: true,
      chaosIntervalTurns: 1,
      chaosStartsAfterTurn: 6,
      chaosProbability: 0.34,
      chaosCooldownTurns: 8,
      chaosMaxEvents: 3,
      timers: false,
      initialClockSeconds: null,
      aiDelayMs: 520,
      localMultiplayer: false
    }
  },
  local: {
    id: "local",
    label: "2 Players Local",
    description: "Two players share one screen with difficulty-based match clocks.",
    engineMode: "classic",
    gameplay: {
      chaosEvents: false,
      chaosIntervalTurns: null,
      chaosStartsAfterTurn: 0,
      chaosProbability: 0,
      chaosCooldownTurns: 0,
      chaosMaxEvents: 0,
      timers: true,
      initialClockSeconds: null,
      aiDelayMs: 0,
      localMultiplayer: true
    }
  }
} satisfies Record<AiMode, AiModeConfig>;

export const PLAY_MODES = AI_MODES;

export const AI_MODE_ORDER: AiMode[] = [
  "classic",
  "chaos",
  "local"
];

export function getAiModeConfig(mode: AiMode): AiModeConfig {
  return AI_MODES[mode];
}

export function getPlayModeConfig(mode: PlayMode): AiModeConfig {
  return getAiModeConfig(mode);
}

export function toEngineGameMode(mode: AiMode): GameMode {
  return getAiModeConfig(mode).engineMode;
}
