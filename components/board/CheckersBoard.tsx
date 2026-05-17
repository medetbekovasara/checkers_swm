"use client";

import { motion } from "framer-motion";
import { GameState, Move, Piece, Player, Position } from "@/game-engine";
import { getPieceAt } from "@/game-engine/board";
import { cn } from "@/lib/utils";
import { GamePiece } from "./GamePiece";

type CheckersBoardProps = {
  state: GameState;
  selectedMoves: Move[];
  playablePlayer?: Player | null;
  onSelectPiece: (pieceId: string) => void;
  onMoveTo: (row: number, col: number) => void;
};

export function CheckersBoard({ state, selectedMoves, playablePlayer = state.currentPlayer, onSelectPiece, onMoveTo }: CheckersBoardProps) {
  const rows = state.perspective === "red" ? [...Array(8).keys()] : [...Array(8).keys()].reverse();
  const cols = state.perspective === "red" ? [...Array(8).keys()] : [...Array(8).keys()].reverse();

  return (
    <motion.div
      key={state.perspective}
      layout={false}
      initial={{ opacity: 0.88, rotate: state.perspective === "red" ? -2 : 2, scale: 0.985 }}
      animate={{ opacity: 1, rotate: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="grid aspect-square w-full max-w-[min(94vw,700px)] grid-cols-8 overflow-hidden rounded-[8px] border border-[#cad3d5] bg-[#e8edf0] p-2 shadow-[0_10px_28px_rgba(45,58,66,0.10)]"
    >
      {rows.flatMap((row) =>
        cols.map((col) => {
          const position = { row, col };
          const piece = getPieceAt(state.pieces, position);
          const highlighted = selectedMoves.some((move) => {
            const destination = move.path[move.path.length - 1];
            return destination.row === row && destination.col === col;
          });
          const lastDestination = state.moves.at(-1)?.path.at(-1);

          return (
            <BoardCell
              key={`${row}-${col}`}
              position={position}
              piece={piece}
              highlighted={highlighted}
              lastDestination={lastDestination}
              selected={piece?.id === state.selectedPieceId}
              selectable={playablePlayer !== null && piece?.player === state.currentPlayer && piece.player === playablePlayer}
              onSelectPiece={onSelectPiece}
              onMoveTo={onMoveTo}
            />
          );
        })
      )}
    </motion.div>
  );
}

type BoardCellProps = {
  position: Position;
  piece?: Piece;
  highlighted: boolean;
  selected: boolean;
  selectable: boolean;
  lastDestination?: Position;
  onSelectPiece: (pieceId: string) => void;
  onMoveTo: (row: number, col: number) => void;
};

function BoardCell({ position, piece, highlighted, selected, selectable, lastDestination, onSelectPiece, onMoveTo }: BoardCellProps) {
  const dark = (position.row + position.col) % 2 === 1;
  const isLast = lastDestination?.row === position.row && lastDestination.col === position.col;
  const actionable = highlighted || selectable;
  const label = piece
    ? `${piece.player} ${piece.kind} on row ${position.row + 1}, column ${position.col + 1}`
    : `Square row ${position.row + 1}, column ${position.col + 1}`;

  return (
    <button
      type="button"
      className={cn(
        "group relative flex aspect-square items-center justify-center overflow-hidden transition-colors duration-150",
        dark
          ? "bg-[#9fb2b9]"
          : "bg-[#f8f8f2]",
        actionable
          ? dark
            ? "cursor-pointer hover:bg-[#96acb4]"
            : "cursor-pointer hover:bg-[#f2f0e7]"
          : "cursor-default",
        isLast && "ring-1 ring-inset ring-violet/[0.45]"
      )}
      onClick={() => {
        if (selectable && piece) onSelectPiece(piece.id);
        else if (highlighted) onMoveTo(position.row, position.col);
      }}
      aria-disabled={!actionable}
      aria-label={label}
    >
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.22),transparent_58%)] opacity-70" />
      {highlighted && (
        <span className="pointer-events-none absolute z-0 h-[20%] w-[20%] rounded-full bg-violet/[0.24]" />
      )}
      {piece && (
        <GamePiece
          piece={piece}
          selected={selected}
        />
      )}
    </button>
  );
}
