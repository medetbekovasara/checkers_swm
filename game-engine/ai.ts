import { applyMove, getLegalMoves } from "./rules";
import { getOpponent, serializeBoard } from "./board";
import { AiPersonality, GameState, Move, Player } from "./types";

type SearchConfig = {
  depth: number;
  personality: AiPersonality;
};

const PERSONALITY = {
  aggressive: { capture: 18, king: 7, center: 2, safety: -2, chaos: 0 },
  defensive: { capture: 10, king: 10, center: 1, safety: 5, chaos: -1 },
  tactical: { capture: 14, king: 9, center: 4, safety: 2, chaos: 0 },
  chaos: { capture: 13, king: 6, center: 1, safety: -4, chaos: 7 }
} satisfies Record<AiPersonality, Record<string, number>>;

export function chooseAiMove(state: GameState, player: Player, config: SearchConfig): Move | null {
  const cache = new Map<string, number>();
  const legalMoves = orderMoves(getLegalMoves(state, player), config.personality);
  let bestMove: Move | null = null;
  let bestScore = -Infinity;

  for (const move of legalMoves) {
    const next = applyMove({ ...state, currentPlayer: player }, move);
    const score = minimax(next, getOpponent(player), player, config.depth - 1, -Infinity, Infinity, config.personality, cache);
    if (score > bestScore) {
      bestScore = score;
      bestMove = { ...move, score };
    }
  }

  return bestMove;
}

function minimax(
  state: GameState,
  playerToMove: Player,
  aiPlayer: Player,
  depth: number,
  alpha: number,
  beta: number,
  personality: AiPersonality,
  cache: Map<string, number>
): number {
  if (depth <= 0 || state.status !== "active") return evaluateState(state, aiPlayer, personality);

  const key = `${serializeBoard(state)}:${playerToMove}:${depth}:${personality}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const moves = orderMoves(getLegalMoves({ ...state, currentPlayer: playerToMove }, playerToMove), personality);
  if (moves.length === 0) return playerToMove === aiPlayer ? -100000 : 100000;

  const maximizing = playerToMove === aiPlayer;
  let value = maximizing ? -Infinity : Infinity;

  for (const move of moves) {
    const next = applyMove({ ...state, currentPlayer: playerToMove }, move);
    const score = minimax(next, getOpponent(playerToMove), aiPlayer, depth - 1, alpha, beta, personality, cache);

    if (maximizing) {
      value = Math.max(value, score);
      alpha = Math.max(alpha, value);
    } else {
      value = Math.min(value, score);
      beta = Math.min(beta, value);
    }

    if (alpha >= beta) break;
  }

  cache.set(key, value);
  return value;
}

export function evaluateState(state: GameState, player: Player, personality: AiPersonality) {
  const weights = PERSONALITY[personality];
  const opponent = getOpponent(player);

  if (state.winner === player) return 100000 - state.turn;
  if (state.winner === opponent) return -100000 + state.turn;

  return state.pieces.reduce((score, piece) => {
    const owner = piece.player === player ? 1 : -1;
    const material = piece.kind === "king" ? 175 : 100;
    const centerDistance = Math.abs(3.5 - piece.position.row) + Math.abs(3.5 - piece.position.col);
    const advancement = piece.player === "red" ? 7 - piece.position.row : piece.position.row;
    const backline = piece.kind === "man" && (piece.position.row === 0 || piece.position.row === 7) ? 1 : 0;

    return score + owner * (
      material +
      weights.king * (piece.kind === "king" ? 12 : 0) +
      weights.center * (7 - centerDistance) +
      weights.safety * backline +
      advancement * 2
    );
  }, state.mode === "chaos" ? weights.chaos * state.chaosLog.length : 0);
}

function orderMoves(moves: Move[], personality: AiPersonality) {
  const weights = PERSONALITY[personality];
  return [...moves].sort((a, b) => scoreMove(b, weights) - scoreMove(a, weights));
}

function scoreMove(move: Move, weights: Record<string, number>) {
  const destination = move.path[move.path.length - 1];
  const center = 7 - (Math.abs(3.5 - destination.row) + Math.abs(3.5 - destination.col));
  return move.captures.length * weights.capture + center * weights.center + move.path.length;
}
