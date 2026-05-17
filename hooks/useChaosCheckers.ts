"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyMove,
  createInitialState,
  GameMode,
  GameState,
  getLegalMoves,
  getMovesForPiece,
  maybeApplyChaosEvent,
  Move,
  Player
} from "@/game-engine";
import { getAiDifficultyConfig, selectAiMoveForDifficulty, type AiDifficulty } from "@/services/ai/difficulty";

const AI_THINKING_DELAY_MS = 360;

export function useChaosCheckers(
  initialMode: GameMode = "chaos",
  initialDifficulty: AiDifficulty = "intermediate",
  playerSide: Player = "red"
) {
  const [state, setState] = useState<GameState>(() => createInitialState(initialMode));
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty>(initialDifficulty);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const completedAiTurnKeyRef = useRef<string | null>(null);

  const legalMoves = useMemo(() => getLegalMoves(state), [state]);
  const selectedMoves = useMemo(
    () => state.selectedPieceId ? getMovesForPiece(state, state.selectedPieceId) : [],
    [state]
  );

  const applyValidatedMove = (current: GameState, move: Move) => {
    const applied = applyMove(current, move);
    if (applied === current || applied.moves.length === current.moves.length) {
      return { moved: false, state: current };
    }

    const next = maybeApplyChaosEvent(applied);
    return { moved: true, state: next };
  };

  useEffect(() => {
    if (state.status !== "active" || state.currentPlayer === playerSide) {
      setIsAiThinking(false);
      return;
    }

    const aiTurnKey = `${state.id}:${state.turn}:${state.currentPlayer}:${state.moves.length}`;
    if (completedAiTurnKeyRef.current === aiTurnKey) return;

    setIsAiThinking(true);

    const timeout = window.setTimeout(() => {
      setState((current) => {
        const currentTurnKey = `${current.id}:${current.turn}:${current.currentPlayer}:${current.moves.length}`;
        if (currentTurnKey !== aiTurnKey || completedAiTurnKeyRef.current === aiTurnKey) return current;
        if (current.status !== "active" || current.currentPlayer === playerSide) return current;

        const move = selectAiMoveForDifficulty(current, aiDifficulty);
        if (!move) return current;

        const result = applyValidatedMove(current, move);
        if (result.moved) completedAiTurnKeyRef.current = aiTurnKey;
        if (result.moved) setLastMove(result.state.moves[result.state.moves.length - 1] ?? null);
        return result.state;
      });
      setIsAiThinking(false);
    }, AI_THINKING_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [state.id, state.turn, state.currentPlayer, state.moves.length, state.status, aiDifficulty, playerSide]);

  const selectPiece = (pieceId: string) => {
    if (isAiThinking) return;
    const piece = state.pieces.find((candidate) => candidate.id === pieceId);
    if (!piece || piece.player !== state.currentPlayer || piece.player !== playerSide) return;
    setState((current) => ({ ...current, selectedPieceId: pieceId }));
  };

  const playMove = (move: Move) => {
    if (isAiThinking) return;
    setState((current) => {
      const result = applyValidatedMove(current, move);
      if (result.moved) setLastMove(result.state.moves[result.state.moves.length - 1] ?? null);
      return result.state;
    });
  };

  const moveSelectedTo = (row: number, col: number) => {
    const move = selectedMoves.find((candidate) => {
      const destination = candidate.path[candidate.path.length - 1];
      return destination.row === row && destination.col === col;
    });

    if (move) playMove(move);
  };

  const reset = (mode: GameMode = state.mode) => {
    completedAiTurnKeyRef.current = null;
    setIsAiThinking(false);
    setState(createInitialState(mode));
    setLastMove(null);
  };

  return {
    state,
    legalMoves,
    selectedMoves,
    aiDifficulty,
    aiConfig: getAiDifficultyConfig(aiDifficulty),
    playerSide,
    isHumanTurn: state.currentPlayer === playerSide,
    isAiTurn: state.currentPlayer !== playerSide,
    isAiThinking,
    lastMove,
    setAiDifficulty,
    selectPiece,
    moveSelectedTo,
    playMove,
    reset
  };
}
