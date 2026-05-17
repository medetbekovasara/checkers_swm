import { GameState, Piece, Player, Position } from "./types";
import { uid } from "@/lib/utils";

export const BOARD_SIZE = 8;

export function createInitialPieces(): Piece[] {
  const pieces: Piece[] = [];

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (isPlayableSquare({ row, col })) {
        pieces.push({
          id: uid("black"),
          player: "black",
          kind: "man",
          position: { row, col }
        });
      }
    }
  }

  for (let row = 5; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (isPlayableSquare({ row, col })) {
        pieces.push({
          id: uid("red"),
          player: "red",
          kind: "man",
          position: { row, col }
        });
      }
    }
  }

  return pieces;
}

export function createInitialState(mode: GameState["mode"] = "chaos"): GameState {
  return {
    id: uid("game"),
    mode,
    boardSize: BOARD_SIZE,
    pieces: createInitialPieces(),
    currentPlayer: "red",
    winner: null,
    status: "active",
    perspective: "red",
    turn: 1,
    moves: [],
    chaosLog: []
  };
}

export function isPlayableSquare(position: Position) {
  return isInsideBoard(position) && (position.row + position.col) % 2 === 1;
}

export function isInsideBoard(position: Position) {
  return (
    position.row >= 0 &&
    position.row < BOARD_SIZE &&
    position.col >= 0 &&
    position.col < BOARD_SIZE
  );
}

export function samePosition(a: Position, b: Position) {
  return a.row === b.row && a.col === b.col;
}

export function getPieceAt(pieces: Piece[], position: Position) {
  return pieces.find((piece) => samePosition(piece.position, position));
}

export function getOpponent(player: Player): Player {
  return player === "red" ? "black" : "red";
}

export function serializeBoard(state: GameState) {
  return state.pieces
    .map((piece) => `${piece.player[0]}${piece.kind[0]}${piece.position.row}${piece.position.col}`)
    .sort()
    .join("|");
}
