import {
  applyMove,
  getLegalMoves,
  getOpponent,
  maybeApplyChaosEvent,
  type GameState,
  type Move,
  type Player
} from "@/game-engine";
import type { AiDifficulty } from "@/services/ai/difficulty";
import { selectAiMoveForDifficulty } from "@/services/ai/difficulty";
import type { AiModeConfig } from "@/services/ai/modes";

export type TurnApplicationResult = {
  moved: boolean;
  state: GameState;
  move: Move | null;
};

export function applyRuntimeMove(
  current: GameState,
  move: Move,
  modeConfig: AiModeConfig
): TurnApplicationResult {
  const playableState = finalizeBlockedTurn(current);
  if (playableState.status !== "active") {
    return { moved: false, state: playableState, move: null };
  }

  const applied = applyMove(playableState, move);
  if (applied === playableState || applied.moves.length === playableState.moves.length) {
    return { moved: false, state: playableState, move: null };
  }

  const next = maybeApplyChaosEvent(applied, {
    enabled: modeConfig.gameplay.chaosEvents,
    intervalTurns: modeConfig.gameplay.chaosIntervalTurns,
    startsAfterTurn: modeConfig.gameplay.chaosStartsAfterTurn,
    probability: modeConfig.gameplay.chaosProbability,
    cooldownTurns: modeConfig.gameplay.chaosCooldownTurns,
    maxEvents: modeConfig.gameplay.chaosMaxEvents
  });

  return {
    moved: true,
    state: finalizeBlockedTurn(next),
    move: next.moves[next.moves.length - 1] ?? null
  };
}

export function applyAiTurn(
  current: GameState,
  difficulty: AiDifficulty,
  modeConfig: AiModeConfig,
  humanSide: Player
): TurnApplicationResult {
  const playableState = finalizeBlockedTurn(current);
  if (playableState.status !== "active" || playableState.currentPlayer === humanSide) {
    return { moved: false, state: playableState, move: null };
  }

  const legalMoves = getLegalMoves(playableState, playableState.currentPlayer);
  if (legalMoves.length === 0) {
    return { moved: false, state: finalizeBlockedTurn(playableState), move: null };
  }

  const selectedMove = selectAiMoveForDifficulty(playableState, difficulty) ?? legalMoves[0];
  return applyRuntimeMove(playableState, selectedMove, modeConfig);
}

function finalizeBlockedTurn(state: GameState): GameState {
  if (state.status !== "active") return state;

  const activePieces = state.pieces.filter((piece) => piece.player === state.currentPlayer);
  const legalMoves = getLegalMoves(state, state.currentPlayer);
  if (activePieces.length > 0 && legalMoves.length > 0) return state;

  const winner = getOpponent(state.currentPlayer);
  return {
    ...state,
    status: winner === "red" ? "red_won" : "black_won",
    winner,
    selectedPieceId: undefined,
    forcedPieceId: undefined
  };
}
