import {
  applyMove,
  chooseAiMove,
  evaluateState,
  getLegalMoves,
  type AiPersonality,
  type GameState,
  type Move,
  type Player
} from "@/game-engine";

export type AiDifficulty = "beginner" | "intermediate" | "nightmare";

export type AiMistakeBehavior = {
  enabled: boolean;
  cadence: number;
  maxRankOffset: number;
  minScoreDrop: number;
};

export type AiDifficultyConfig = {
  id: AiDifficulty;
  label: string;
  description: string;
  depth: number;
  personality: AiPersonality;
  mistake: AiMistakeBehavior;
};

export type MoveSelector = (state: GameState, difficulty: AiDifficulty) => Move | null;

type ScoredMove = Move & {
  score: number;
};

export const AI_DIFFICULTY_CONFIGS = {
  beginner: {
    id: "beginner",
    label: "Beginner",
    description: "Short lookahead with periodic deterministic weaker choices.",
    depth: 1,
    personality: "defensive",
    mistake: {
      enabled: true,
      cadence: 3,
      maxRankOffset: 2,
      minScoreDrop: 8
    }
  },
  intermediate: {
    id: "intermediate",
    label: "Intermediate",
    description: "Balanced tactical play with bounded two-ply search.",
    depth: 2,
    personality: "tactical",
    mistake: {
      enabled: false,
      cadence: 0,
      maxRankOffset: 0,
      minScoreDrop: 0
    }
  },
  nightmare: {
    id: "nightmare",
    label: "Nightmare",
    description: "Deepest bounded search with aggressive pressure.",
    depth: 4,
    personality: "aggressive",
    mistake: {
      enabled: false,
      cadence: 0,
      maxRankOffset: 0,
      minScoreDrop: 0
    }
  }
} satisfies Record<AiDifficulty, AiDifficultyConfig>;

export const AI_DIFFICULTY_ORDER: AiDifficulty[] = [
  "beginner",
  "intermediate",
  "nightmare"
];

export const AI_DIFFICULTIES = AI_DIFFICULTY_ORDER.map((difficulty) => AI_DIFFICULTY_CONFIGS[difficulty]);

export function getAiDifficultyConfig(difficulty: AiDifficulty): AiDifficultyConfig {
  return AI_DIFFICULTY_CONFIGS[difficulty];
}

export const selectAiMoveForDifficulty: MoveSelector = (state, difficulty) => {
  const config = getAiDifficultyConfig(difficulty);
  const legalMoves = getLegalMoves(state, state.currentPlayer);
  if (legalMoves.length === 0) return null;

  const bestMove = chooseAiMove(state, state.currentPlayer, {
    depth: config.depth,
    personality: config.personality
  });
  if (!bestMove) return null;

  if (!shouldSelectWeakerMove(state, config)) {
    return tagMove(bestMove, config, "principal");
  }

  const weakerMove = selectDeterministicWeakerMove(
    state,
    state.currentPlayer,
    legalMoves,
    bestMove,
    config
  );

  return tagMove(weakerMove ?? bestMove, config, weakerMove ? "mistake" : "principal");
};

function shouldSelectWeakerMove(state: GameState, config: AiDifficultyConfig) {
  return config.mistake.enabled && config.mistake.cadence > 0 && state.turn % config.mistake.cadence === 0;
}

function selectDeterministicWeakerMove(
  state: GameState,
  player: Player,
  legalMoves: Move[],
  bestMove: Move,
  config: AiDifficultyConfig
) {
  if (legalMoves.length < 2) return null;

  const rankedMoves = rankMoves(state, player, legalMoves, config.personality);
  const bestScore = bestMove.score ?? rankedMoves[0]?.score ?? 0;
  const weakerMoves = rankedMoves.filter((move) => move.score <= bestScore - config.mistake.minScoreDrop);
  if (weakerMoves.length === 0) return null;

  const maxIndex = Math.min(config.mistake.maxRankOffset - 1, weakerMoves.length - 1);
  const selectedIndex = deterministicIndex(state, maxIndex + 1);
  return weakerMoves[selectedIndex] ?? null;
}

function rankMoves(
  state: GameState,
  player: Player,
  legalMoves: Move[],
  personality: AiPersonality
): ScoredMove[] {
  return legalMoves
    .map((move) => {
      const nextState = applyMove({ ...state, currentPlayer: player }, move);
      return {
        ...move,
        score: evaluateState(nextState, player, personality)
      };
    })
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

function deterministicIndex(state: GameState, count: number) {
  if (count <= 1) return 0;
  const basis = `${state.id}:${state.turn}:${state.currentPlayer}:${state.moves.length}`;
  let hash = 0;

  for (let index = 0; index < basis.length; index += 1) {
    hash = (hash * 31 + basis.charCodeAt(index)) >>> 0;
  }

  return hash % count;
}

function tagMove(move: Move, config: AiDifficultyConfig, decision: "principal" | "mistake"): Move {
  return {
    ...move,
    tags: [...(move.tags ?? []), `difficulty:${config.id}`, `ai:${decision}`]
  };
}
