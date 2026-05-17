import { getOpponent } from "./board";
import { applyMove, getLegalMoves } from "./rules";
import { GameState, MoveAnalysis } from "./types";

export function analyzeMoveHistory(initial: GameState, finalState: GameState): MoveAnalysis[] {
  let state = initial;

  return finalState.moves.map((move) => {
    const legalBefore = getLegalMoves(state, move.player);
    const bestCaptureCount = Math.max(0, ...legalBefore.map((candidate) => candidate.captures.length));
    const next = applyMove({ ...state, currentPlayer: move.player }, move);
    const opponentReplies = getLegalMoves({ ...next, currentPlayer: getOpponent(move.player) });
    const danger = Math.max(0, ...opponentReplies.map((reply) => reply.captures.length));
    const materialBefore = state.pieces.length;
    const materialAfter = next.pieces.length;

    state = next;

    return {
      move,
      missedCapture: bestCaptureCount > move.captures.length,
      danger,
      materialDelta: materialAfter - materialBefore
    };
  });
}
