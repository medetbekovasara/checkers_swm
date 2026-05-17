import { getOpponent, getPieceAt, isInsideBoard, samePosition } from "./board";
import { GameState, Move, Piece, Player, Position } from "./types";
import { uid } from "@/lib/utils";

const KING_DIRECTIONS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1]
] as const;

function directionsFor(piece: Piece) {
  if (piece.kind === "king") return KING_DIRECTIONS;
  return piece.player === "red"
    ? ([
        [-1, -1],
        [-1, 1]
      ] as const)
    : ([
        [1, -1],
        [1, 1]
      ] as const);
}

function captureDirectionsFor(piece: Piece) {
  if (piece.kind === "king") return KING_DIRECTIONS;
  return KING_DIRECTIONS;
}

function promotionRow(player: Player) {
  return player === "red" ? 0 : 7;
}

function captureMovesForPiece(
  state: GameState,
  piece: Piece,
  path: Position[] = [piece.position],
  pieces = state.pieces,
  captured: Position[] = []
): Move[] {
  const captures: Move[] = [];
  const current = path[path.length - 1];

  for (const [rowDelta, colDelta] of captureDirectionsFor(piece)) {
    if (piece.kind === "king") {
      captures.push(...kingCaptureMovesForDirection(state, piece, path, pieces, captured, rowDelta, colDelta));
      continue;
    }

    const jumped = { row: current.row + rowDelta, col: current.col + colDelta };
    const landing = { row: current.row + rowDelta * 2, col: current.col + colDelta * 2 };
    const victim = getPieceAt(pieces, jumped);

    if (!isInsideBoard(landing) || getPieceAt(pieces, landing) || !victim || victim.player === piece.player) {
      continue;
    }

    const nextPieces = pieces
      .filter((candidate) => candidate.id !== victim.id)
      .map((candidate) =>
        candidate.id === piece.id ? { ...candidate, position: landing } : candidate
      );

    const nextPiece = getPieceAt(nextPieces, landing);
    if (!nextPiece) continue;

    const nextPath = [...path, landing];
    const promotedOnLanding = piece.kind === "man" && landing.row === promotionRow(piece.player);
    if (promotedOnLanding) {
      captures.push({
        id: uid("move"),
        pieceId: piece.id,
        player: piece.player,
        path: nextPath,
        captures: [...captured, jumped]
      });
      continue;
    }

    const nextCaptures = [...captured, jumped];
    const followUps = captureMovesForPiece(state, nextPiece, nextPath, nextPieces, nextCaptures);

    if (followUps.length > 0) {
      captures.push(...followUps);
    } else {
      captures.push({
        id: uid("move"),
        pieceId: piece.id,
        player: piece.player,
        path: nextPath,
        captures: nextCaptures
      });
    }
  }

  return captures;
}

function kingCaptureMovesForDirection(
  state: GameState,
  piece: Piece,
  path: Position[],
  pieces: Piece[],
  captured: Position[],
  rowDelta: number,
  colDelta: number
): Move[] {
  const captures: Move[] = [];
  const current = path[path.length - 1];
  let cursor = { row: current.row + rowDelta, col: current.col + colDelta };
  let victim: Piece | null = null;

  while (isInsideBoard(cursor)) {
    const occupant = getPieceAt(pieces, cursor);
    if (!occupant) {
      if (victim) {
        const landing = cursor;
        const nextCaptures = [...captured, victim.position];
        const nextPieces = pieces
          .filter((candidate) => candidate.id !== victim?.id)
          .map((candidate) =>
            candidate.id === piece.id ? { ...candidate, position: landing } : candidate
          );
        const nextPiece = getPieceAt(nextPieces, landing);

        if (nextPiece) {
          const nextPath = [...path, landing];
          const followUps = captureMovesForPiece(state, nextPiece, nextPath, nextPieces, nextCaptures);

          if (followUps.length > 0) {
            captures.push(...followUps);
          } else {
            captures.push({
              id: uid("move"),
              pieceId: piece.id,
              player: piece.player,
              path: nextPath,
              captures: nextCaptures
            });
          }
        }
      }
    } else if (occupant.player === piece.player || victim) {
      break;
    } else {
      victim = occupant;
    }

    cursor = { row: cursor.row + rowDelta, col: cursor.col + colDelta };
  }

  return captures;
}

function quietMovesForPiece(state: GameState, piece: Piece): Move[] {
  if (piece.kind === "king") {
    return KING_DIRECTIONS.flatMap(([rowDelta, colDelta]) => {
      const moves: Move[] = [];
      let cursor = {
        row: piece.position.row + rowDelta,
        col: piece.position.col + colDelta
      };

      while (isInsideBoard(cursor) && !getPieceAt(state.pieces, cursor)) {
        moves.push({
          id: uid("move"),
          pieceId: piece.id,
          player: piece.player,
          path: [piece.position, cursor],
          captures: []
        });
        cursor = { row: cursor.row + rowDelta, col: cursor.col + colDelta };
      }

      return moves;
    });
  }

  return directionsFor(piece)
    .map(([rowDelta, colDelta]) => ({
      row: piece.position.row + rowDelta,
      col: piece.position.col + colDelta
    }))
    .filter((position) => isInsideBoard(position) && !getPieceAt(state.pieces, position))
    .map((position) => ({
      id: uid("move"),
      pieceId: piece.id,
      player: piece.player,
      path: [piece.position, position],
      captures: []
    }));
}

export function getLegalMoves(state: GameState, player = state.currentPlayer): Move[] {
  if (state.status !== "active") return [];

  const pieces = state.pieces.filter((piece) => piece.player === player);
  const captures = pieces.flatMap((piece) => captureMovesForPiece(state, piece));
  const legal = captures.length > 0 ? captures : pieces.flatMap((piece) => quietMovesForPiece(state, piece));

  if (!state.forcedPieceId) return legal;
  return legal.filter((move) => move.pieceId === state.forcedPieceId);
}

export function getMovesForPiece(state: GameState, pieceId: string) {
  return getLegalMoves(state).filter((move) => move.pieceId === pieceId);
}

export function applyMove(state: GameState, move: Move): GameState {
  const piece = state.pieces.find((candidate) => candidate.id === move.pieceId);
  if (!piece || piece.player !== state.currentPlayer || state.status !== "active") return state;

  const legalMove = getLegalMoves(state).find((candidate) => candidate.id === move.id || sameMove(candidate, move));
  if (!legalMove) return state;

  const destination = legalMove.path[legalMove.path.length - 1];
  const captureKeys = new Set(legalMove.captures.map((capture) => `${capture.row}:${capture.col}`));
  const promoted = piece.kind === "man" && destination.row === promotionRow(piece.player);
  const nextPieces = state.pieces
    .filter((candidate) => !captureKeys.has(`${candidate.position.row}:${candidate.position.col}`))
    .map((candidate) =>
      candidate.id === piece.id
        ? { ...candidate, kind: promoted ? "king" : candidate.kind, position: destination }
        : candidate
    );

  const opponent = getOpponent(state.currentPlayer);
  const opponentMoves = getLegalMoves({
    ...state,
    pieces: nextPieces,
    currentPlayer: opponent,
    selectedPieceId: undefined,
    forcedPieceId: undefined
  });
  const opponentPieces = nextPieces.filter((candidate) => candidate.player === opponent);
  const nextMove = { ...legalMove, promoted };
  const nextMoves = [...state.moves, nextMove];
  const status = opponentPieces.length === 0 || opponentMoves.length === 0
    ? winnerStatus(state.currentPlayer)
    : isDrawByQuietPlay(nextMoves)
      ? "draw"
    : "active";

  return {
    ...state,
    pieces: nextPieces,
    currentPlayer: status === "active" ? opponent : state.currentPlayer,
    winner: status === "draw" || status === "active" ? null : state.currentPlayer,
    status,
    selectedPieceId: undefined,
    forcedPieceId: undefined,
    turn: state.turn + 1,
    moves: nextMoves
  };
}

function isDrawByQuietPlay(moves: Move[]) {
  const quietMoveLimit = 80;
  if (moves.length < quietMoveLimit) return false;

  return moves
    .slice(-quietMoveLimit)
    .every((move) => move.captures.length === 0 && !move.promoted);
}

function winnerStatus(player: Player) {
  return player === "red" ? "red_won" : "black_won";
}

function sameMove(a: Move, b: Move) {
  return (
    a.pieceId === b.pieceId &&
    a.path.length === b.path.length &&
    a.path.every((position, index) => samePosition(position, b.path[index]))
  );
}
