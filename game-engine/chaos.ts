import { getLegalMoves } from "./rules";
import { getOpponent } from "./board";
import { ChaosEvent, GameState } from "./types";
import { uid } from "@/lib/utils";

export function maybeApplyChaosEvent(state: GameState): GameState {
  if (state.mode !== "chaos" || state.status !== "active" || state.turn < 4 || state.turn % 5 !== 0) {
    return state;
  }

  const event = pickChaosEvent(state);
  return applyChaosEvent(state, event);
}

export function applyChaosEvent(state: GameState, event: ChaosEvent): GameState {
  if (event.type === "flip_perspective") {
    return { ...state, perspective: getOpponent(state.perspective), chaosLog: [...state.chaosLog, event] };
  }

  if (event.type === "swap_sides") {
    return {
      ...state,
      pieces: state.pieces.map((piece) => ({ ...piece, player: getOpponent(piece.player) })),
      currentPlayer: getOpponent(state.currentPlayer),
      perspective: getOpponent(state.perspective),
      chaosLog: [...state.chaosLog, event]
    };
  }

  if (event.type === "swap_random_pieces") {
    const red = state.pieces.find((piece) => piece.player === "red");
    const black = state.pieces.find((piece) => piece.player === "black");
    if (!red || !black) return state;

    return {
      ...state,
      pieces: state.pieces.map((piece) => {
        if (piece.id === red.id) return { ...piece, position: black.position };
        if (piece.id === black.id) return { ...piece, position: red.position };
        return piece;
      }),
      chaosLog: [...state.chaosLog, event]
    };
  }

  return {
    ...state,
    forcedPieceId: getLegalMoves(state)[0]?.pieceId,
    chaosLog: [...state.chaosLog, event]
  };
}

function pickChaosEvent(state: GameState): ChaosEvent {
  const events: Omit<ChaosEvent, "id" | "turn">[] = [
    {
      type: "flip_perspective",
      label: "Perspective Flip",
      description: "Camera flips and the board reads from the opposite side."
    },
    {
      type: "swap_random_pieces",
      label: "Piece Swap",
      description: "One red and one black piece trade squares without changing ownership."
    },
    {
      type: "tempo_surge",
      label: "Tempo Surge",
      description: "The next legal line is locked, forcing instant adaptation."
    },
    {
      type: "swap_sides",
      label: "Side Swap",
      description: "Players inherit the opposite army while the core rules stay intact."
    }
  ];

  const index = Math.abs((state.turn * 7 + state.moves.length * 3) % events.length);
  return { ...events[index], id: uid("chaos"), turn: state.turn };
}
