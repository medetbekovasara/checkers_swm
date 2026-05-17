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

function promotionRow(player: Player) {
  return player === "red" ? 0 : 7;
}

function captureMovesForPiece(state: GameState, piece: Piece, path: Position[] = [piece.position], pieces = state.pieces): Move[] {
  const captures: Move[] = [];
  const current = path[path.length - 1];

  for (const [rowDelta, colDelta] of directionsFor(piece)) {
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
        captures: pathToCaptures(nextPath)
      });
      continue;
    }

    const followUps = captureMovesForPiece(state, nextPiece, nextPath, nextPieces);

    if (followUps.length > 0) {
      captures.push(...followUps);
    } else {
      captures.push({
        id: uid("move"),
        pieceId: piece.id,
        player: piece.player,
        path: nextPath,
        captures: pathToCaptures(nextPath)
      });
    }
  }

  return captures;
}

function pathToCaptures(path: Position[]) {
  const captures: Position[] = [];

  for (let index = 1; index < path.length; index += 1) {
    const previous = path[index - 1];
    const next = path[index];
    if (Math.abs(previous.row - next.row) === 2) {
      captures.push({
        row: (previous.row + next.row) / 2,
        col: (previous.col + next.col) / 2
      });
    }
  }

  return captures;
}

function quietMovesForPiece(state: GameState, piece: Piece): Move[] {
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
  const status = opponentPieces.length === 0 || opponentMoves.length === 0
    ? winnerStatus(state.currentPlayer)
    : "active";

  return {
    ...state,
    pieces: nextPieces,
    currentPlayer: status === "active" ? opponent : state.currentPlayer,
    winner: status === "active" ? null : state.currentPlayer,
    status,
    selectedPieceId: undefined,
    forcedPieceId: undefined,
    turn: state.turn + 1,
    moves: [...state.moves, { ...legalMove, promoted }]
  };
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
