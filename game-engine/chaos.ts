import { getLegalMoves } from "./rules";
import { getOpponent } from "./board";
import { ChaosEvent, GameState } from "./types";
import { uid } from "@/lib/utils";

export type ChaosRuntimeConfig = {
  enabled?: boolean;
  intervalTurns?: number | null;
  startsAfterTurn?: number;
  probability?: number;
  cooldownTurns?: number;
  maxEvents?: number;
};

export function maybeApplyChaosEvent(state: GameState, config: ChaosRuntimeConfig = {}): GameState {
  const enabled = config.enabled ?? state.mode === "chaos";
  const intervalTurns = config.intervalTurns ?? 5;
  const startsAfterTurn = config.startsAfterTurn ?? 4;
  const probability = config.probability ?? 1;
  const cooldownTurns = config.cooldownTurns ?? 0;
  const maxEvents = config.maxEvents ?? Infinity;
  const lastChaosTurn = state.chaosLog[state.chaosLog.length - 1]?.turn ?? -Infinity;

  if (
    !enabled ||
    state.mode !== "chaos" ||
    state.status !== "active" ||
    state.chaosLog.length >= maxEvents ||
    state.turn < startsAfterTurn ||
    intervalTurns === null ||
    state.turn % intervalTurns !== 0 ||
    state.turn - lastChaosTurn < cooldownTurns ||
    chaosRoll(state) >= probability
  ) {
    return state;
  }

  const event = pickChaosEvent(state);
  return applyChaosEvent(state, event);
}

export function applyChaosEvent(state: GameState, event: ChaosEvent): GameState {
  if (event.type === "flip_perspective") {
    return finalizeChaosState({ ...state, perspective: getOpponent(state.perspective), chaosLog: [...state.chaosLog, event] });
  }

  if (event.type === "swap_sides") {
    return finalizeChaosState({
      ...state,
      perspective: getOpponent(state.perspective),
      chaosLog: [...state.chaosLog, event]
    });
  }

  if (event.type === "swap_random_pieces") {
    const redPieces = state.pieces.filter((piece) => piece.player === "red");
    const blackPieces = state.pieces.filter((piece) => piece.player === "black");
    const red = redPieces[chaosIndex(state, redPieces.length, 11)];
    const black = blackPieces[chaosIndex(state, blackPieces.length, 23)];
    if (!red || !black) return state;

    return finalizeChaosState({
      ...state,
      pieces: state.pieces.map((piece) => {
        if (piece.id === red.id) return { ...piece, position: black.position };
        if (piece.id === black.id) return { ...piece, position: red.position };
        return piece;
      }),
      chaosLog: [...state.chaosLog, event]
    });
  }

  return finalizeChaosState({
    ...state,
    forcedPieceId: getLegalMoves(state)[0]?.pieceId,
    chaosLog: [...state.chaosLog, event]
  });
}

function finalizeChaosState(state: GameState): GameState {
  if (state.status !== "active") return state;

  const activePieces = state.pieces.filter((piece) => piece.player === state.currentPlayer);
  const activeMoves = getLegalMoves(state, state.currentPlayer);
  if (activePieces.length > 0 && activeMoves.length > 0) return state;

  const winner = getOpponent(state.currentPlayer);
  return {
    ...state,
    winner,
    status: winner === "red" ? "red_won" : "black_won",
    selectedPieceId: undefined,
    forcedPieceId: undefined
  };
}

function pickChaosEvent(state: GameState): ChaosEvent {
  return {
    id: uid("chaos"),
    type: "swap_sides",
    turn: state.turn,
    label: "Sides Swapped",
    description: "The board flips and both players inherit the opposite army."
  };
}

function chaosIndex(state: GameState, count: number, salt: number) {
  if (count <= 1) return 0;
  return Math.floor(chaosRoll(state, salt) * count) % count;
}

function chaosRoll(state: GameState, salt = 0) {
  const basis = `${state.id}:${state.turn}:${state.moves.length}:${state.currentPlayer}:${salt}`;
  let hash = 2166136261;

  for (let index = 0; index < basis.length; index += 1) {
    hash ^= basis.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967296;
}
