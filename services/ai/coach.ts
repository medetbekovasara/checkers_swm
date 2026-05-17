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
  const captures = finalState.moves.reduce((sum, move) => sum + move.captures.length, 0);

  return {
    summary: finalState.winner
      ? `${finalState.winner.toUpperCase()} closed the game in ${finalState.moves.length} moves with ${captures} captures.`
      : `The game is still live after ${finalState.moves.length} moves.`,
    advice: [
      missed > 0 ? `Review ${missed} missed capture windows before committing quiet moves.` : "Capture discipline was solid.",
      dangerous > 0 ? "Several moves allowed multi-capture replies. Stabilize the back rank before forcing trades." : "You kept opponent reply threats mostly under control.",
      finalState.chaosLog.length > 0 ? "In Chaos Mode, pause after events and re-evaluate ownership before attacking." : "Classic tempo stayed readable; convert material edges faster."
    ],
    style: captures >= 4 ? "aggressive tactician" : dangerous > missed ? "high-tempo risk taker" : "positional adapter"
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
