"use client";

import { Crown } from "lucide-react";
import { motion } from "framer-motion";
import { Piece } from "@/game-engine";
import { cn } from "@/lib/utils";

type GamePieceProps = {
  piece: Piece;
  selected: boolean;
};

export function GamePiece({ piece, selected }: GamePieceProps) {
  return (
    <motion.div
      layoutId={piece.id}
      transition={{
        type: "tween",
        duration: 0.16,
        ease: "easeOut"
      }}
      className={cn(
        "pointer-events-none relative z-10 flex h-[72%] w-[72%] items-center justify-center rounded-full border text-white shadow-sm",
        piece.player === "red"
          ? "border-[#d4a198] bg-[radial-gradient(circle_at_34%_27%,#efc8bf,#c98578_60%,#8d5a51)]"
          : "border-[#94adb5] bg-[radial-gradient(circle_at_34%_27%,#bfd0d5,#6f8790_60%,#35464c)]",
        selected && "ring-2 ring-violet/[0.55] ring-offset-1 ring-offset-[#f8f8f2]"
      )}
      aria-label={`${piece.player} ${piece.kind}`}
    >
      <span className="absolute inset-[15%] rounded-full border border-white/[0.20] bg-white/[0.03]" />
      <span className="absolute inset-x-[28%] top-[16%] h-[12%] rounded-full bg-white/[0.16]" />
      {piece.kind === "king" && <Crown className="relative h-5 w-5 text-bone drop-shadow-sm" />}
    </motion.div>
  );
}
