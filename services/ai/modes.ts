import type { GameMode } from "@/game-engine";

export type AiMode = "classic" | "chaos" | "swap" | "speed" | "experimental";
export type PlayMode = AiMode;

export type AiModeConfig = {
  id: AiMode;
  label: string;
  description: string;
  engineMode: GameMode;
  supportsChaosEvents: boolean;
};

export const AI_MODES = {
  classic: {
    id: "classic",
    label: "Classic",
    description: "Standard checkers rules using the classic engine mode.",
    engineMode: "classic",
    supportsChaosEvents: false
  },
  chaos: {
    id: "chaos",
    label: "Chaos",
    description: "Chaos event rules backed by the current chaos engine mode.",
    engineMode: "chaos",
    supportsChaosEvents: true
  },
  swap: {
    id: "swap",
    label: "Swap",
    description: "Variant shell mapped to chaos until the engine owns a dedicated swap mode.",
    engineMode: "chaos",
    supportsChaosEvents: true
  },
  speed: {
    id: "speed",
    label: "Speed",
    description: "Fast-play shell mapped to classic rules without engine type changes.",
    engineMode: "classic",
    supportsChaosEvents: false
  },
  experimental: {
    id: "experimental",
    label: "Experimental",
    description: "Incubator shell mapped to chaos for current engine compatibility.",
    engineMode: "chaos",
    supportsChaosEvents: true
  }
} satisfies Record<AiMode, AiModeConfig>;

export const PLAY_MODES = AI_MODES;

export const AI_MODE_ORDER: AiMode[] = [
  "classic",
  "chaos",
  "swap",
  "speed",
  "experimental"
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
