import { applyMove, GameState, Move } from "@/game-engine";

export type ReplayFrame = {
  index: number;
  move: Move | null;
  state: GameState;
};

export function buildReplay(initial: GameState, moves: Move[]): ReplayFrame[] {
  const frames: ReplayFrame[] = [{ index: 0, move: null, state: initial }];
  let state = initial;

  moves.forEach((move, index) => {
    state = applyMove({ ...state, currentPlayer: move.player }, move);
    frames.push({ index: index + 1, move, state });
  });

  return frames;
}
