import { analyzeMoveHistory, createInitialState, GameState } from "@/game-engine";

export type CoachReport = {
  summary: string;
  advice: string[];
  style: string;
};

export function createLocalCoachReport(finalState: GameState): CoachReport {
  const analysis = analyzeMoveHistory(createInitialState(finalState.mode), finalState);
  const missed = analysis.filter((item) => item.missedCapture).length;
  const dangerous = analysis.filter((item) => item.danger >= 2).length;
  const risky = analysis.filter((item) => item.danger > 0).length;
  const captures = finalState.moves.reduce((sum, move) => sum + move.captures.length, 0);
  const quietMoves = finalState.moves.length - finalState.moves.filter((move) => move.captures.length > 0).length;
  const finalKings = finalState.pieces.filter((piece) => piece.kind === "king").length;
  const endgame = finalState.pieces.length <= 8;
  const aggression = captures >= Math.max(2, Math.floor(finalState.moves.length / 5));
  const defense = dangerous === 0 && risky <= Math.max(1, Math.floor(finalState.moves.length / 6));

  return {
    summary: finalState.winner
      ? `${finalState.winner.toUpperCase()} closed the game in ${finalState.moves.length} moves with ${captures} captures.`
      : finalState.status === "draw"
        ? `The game ended in a draw after ${finalState.moves.length} moves with ${captures} captures.`
        : `The game is still live after ${finalState.moves.length} moves.`,
    advice: [
      missed > 0
        ? `${missed} capture opportunity was missed. Before quiet moves, scan both diagonals for forced jumps.`
        : "Capture discipline was solid; you usually took material when it was available.",
      dangerous > 0
        ? `${dangerous} move${dangerous === 1 ? "" : "s"} allowed a multi-capture reply. Keep one back-rank defender before trading.`
        : defense
          ? "Defensive shape was stable; opponent rarely got clean capture replies."
          : "Reduce loose pieces on open diagonals before forcing contact.",
      endgame
        ? `Endgame reached with ${finalKings} king${finalKings === 1 ? "" : "s"} on board. Centralize kings and avoid edge traps.`
        : aggression
          ? "Aggression was high; convert pressure by trading only when the recapture is favorable."
          : `You played ${quietMoves} quiet moves. Look for tempo moves that threaten captures next turn.`,
      finalState.chaosLog.length > 0
        ? "After side swaps, pause one turn and re-map which army you now control before attacking."
        : "In classic positions, improve conversion by moving support pieces before the final capture sequence."
    ],
    style: aggression ? "aggressive tactician" : defense ? "compact defender" : "positional adapter"
  };
}

export async function requestOpenAiCoachReport(finalState: GameState): Promise<CoachReport> {
  const response = await fetch("/api/coach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game: finalState })
  });

  if (!response.ok) return createLocalCoachReport(finalState);
  return response.json() as Promise<CoachReport>;
}
