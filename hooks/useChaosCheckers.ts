"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createInitialState,
  GameState,
  getLegalMoves,
  getOpponent,
  getMovesForPiece,
  Move,
  Player
} from "@/game-engine";
import { getAiDifficultyConfig, type AiDifficulty } from "@/services/ai/difficulty";
import { applyAiTurn, applyRuntimeMove } from "@/services/ai/turn";
import { getPlayModeConfig, type GameTimers, type PlayMode } from "@/services/ai/modes";

export function useChaosCheckers(
  initialMode: PlayMode = "chaos",
  initialDifficulty: AiDifficulty = "intermediate",
  playerSide: Player = "red"
) {
  const modeConfig = useMemo(() => getPlayModeConfig(initialMode), [initialMode]);
  const [state, setState] = useState<GameState>(() => createInitialState(modeConfig.engineMode));
  const [timers, setTimers] = useState<GameTimers>(() => createTimers(initialMode));
  const [controlledSide, setControlledSide] = useState<Player>(playerSide);
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty>(initialDifficulty);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [pendingAiTurnKey, setPendingAiTurnKey] = useState<string | null>(null);
  const completedAiTurnKeyRef = useRef<string | null>(null);
  const processedSideSwapEventRef = useRef<string | null>(null);
  const aiTimeoutRef = useRef<number | null>(null);

  const legalMoves = useMemo(() => getLegalMoves(state), [state]);
  const selectedMoves = useMemo(
    () => state.selectedPieceId ? getMovesForPiece(state, state.selectedPieceId) : [],
    [state]
  );

  const applyValidatedMove = (current: GameState, move: Move) => {
    return applyRuntimeMove(current, move, modeConfig);
  };

  useEffect(() => {
    if (!modeConfig.gameplay.timers || state.status !== "active") return;

    let lastTick = Date.now();
    const interval = window.setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTick;
      lastTick = now;

      setTimers((currentTimers) => {
        const remaining = currentTimers[state.currentPlayer];
        if (remaining === null) return currentTimers;

        const nextRemaining = Math.max(0, remaining - elapsed);
        if (nextRemaining === remaining) return currentTimers;

        if (nextRemaining === 0) {
          const timedOutPlayer = state.currentPlayer;
          const winner = timedOutPlayer === "red" ? "black" : "red";
          setState((current) => {
            if (current.status !== "active" || current.currentPlayer !== timedOutPlayer) return current;
            return {
              ...current,
              status: winner === "red" ? "red_won" : "black_won",
              winner,
              selectedPieceId: undefined,
              forcedPieceId: undefined
            };
          });
        }

        return { ...currentTimers, [state.currentPlayer]: nextRemaining };
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [modeConfig.gameplay.timers, state.currentPlayer, state.status]);

  const latestChaosEvent = state.chaosLog[state.chaosLog.length - 1];
  const hasPendingSideSwap = latestChaosEvent?.type === "swap_sides" && processedSideSwapEventRef.current !== latestChaosEvent.id;
  const clearAiTimeout = () => {
    if (aiTimeoutRef.current === null) return;
    window.clearTimeout(aiTimeoutRef.current);
    aiTimeoutRef.current = null;
  };

  const queueAiTurn = (expectedState: GameState, humanSide: Player) => {
    if (expectedState.status !== "active" || expectedState.currentPlayer === humanSide) {
      setPendingAiTurnKey(null);
      setIsAiThinking(false);
      return;
    }

    const aiTurnKey = createAiTurnKey(expectedState);
    if (completedAiTurnKeyRef.current === aiTurnKey) return;
    setPendingAiTurnKey(aiTurnKey);
    setIsAiThinking(true);
  };

  useEffect(() => {
    if (!hasPendingSideSwap || !latestChaosEvent) return;
    processedSideSwapEventRef.current = latestChaosEvent.id;
    completedAiTurnKeyRef.current = null;
    clearAiTimeout();
    setControlledSide((side) => {
      const nextSide = getOpponent(side);
      queueAiTurn(state, nextSide);
      return nextSide;
    });
  }, [hasPendingSideSwap, latestChaosEvent, state]);

  useEffect(() => {
    if (hasPendingSideSwap) {
      clearAiTimeout();
      setIsAiThinking(false);
      return;
    }

    if (state.status !== "active" || state.currentPlayer === controlledSide) {
      setIsAiThinking(false);
      return;
    }

    queueAiTurn(state, controlledSide);
  }, [
    state.id,
    state.turn,
    state.currentPlayer,
    state.moves.length,
    state.status,
    aiDifficulty,
    modeConfig,
    modeConfig.gameplay.aiDelayMs,
    controlledSide,
    hasPendingSideSwap
  ]);

  useEffect(() => {
    if (!pendingAiTurnKey) return;

    const currentTurnKey = createAiTurnKey(state);
    if (state.status !== "active" || state.currentPlayer === controlledSide) {
      setPendingAiTurnKey(null);
      setIsAiThinking(false);
      return;
    }

    if (currentTurnKey !== pendingAiTurnKey || completedAiTurnKeyRef.current === pendingAiTurnKey) {
      return;
    }

    clearAiTimeout();
    setIsAiThinking(true);

    aiTimeoutRef.current = window.setTimeout(() => {
      aiTimeoutRef.current = null;
      setState((current) => {
        if (createAiTurnKey(current) !== pendingAiTurnKey || completedAiTurnKeyRef.current === pendingAiTurnKey) {
          return current;
        }

        const result = applyAiTurn(current, aiDifficulty, modeConfig, controlledSide);
        if (result.moved) completedAiTurnKeyRef.current = pendingAiTurnKey;
        if (result.move) setLastMove(result.move);
        return result.state;
      });
      setPendingAiTurnKey(null);
      setIsAiThinking(false);
    }, modeConfig.gameplay.aiDelayMs);

    return clearAiTimeout;
  }, [aiDifficulty, controlledSide, modeConfig, pendingAiTurnKey, state]);

  const selectPiece = (pieceId: string) => {
    if (isAiThinking) return;
    const piece = state.pieces.find((candidate) => candidate.id === pieceId);
    if (!piece || piece.player !== state.currentPlayer || piece.player !== controlledSide) return;
    setState((current) => ({ ...current, selectedPieceId: pieceId }));
  };

  const playMove = (move: Move) => {
    if (isAiThinking) return;
    setState((current) => {
      const result = applyValidatedMove(current, move);
      if (result.moved) setLastMove(result.state.moves[result.state.moves.length - 1] ?? null);
      if (result.moved) queueAiTurn(result.state, controlledSide);
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

  const reset = (mode: PlayMode = initialMode) => {
    const nextModeConfig = getPlayModeConfig(mode);
    completedAiTurnKeyRef.current = null;
    processedSideSwapEventRef.current = null;
    setPendingAiTurnKey(null);
    clearAiTimeout();
    setIsAiThinking(false);
    setControlledSide(playerSide);
    setState(createInitialState(nextModeConfig.engineMode));
    setTimers(createTimers(mode));
    setLastMove(null);
  };

  return {
    state,
    legalMoves,
    selectedMoves,
    aiDifficulty,
    aiConfig: getAiDifficultyConfig(aiDifficulty),
    mode: initialMode,
    modeConfig,
    timers,
    playerSide: controlledSide,
    isHumanTurn: state.currentPlayer === controlledSide,
    isAiTurn: state.currentPlayer !== controlledSide,
    isAiThinking,
    lastMove,
    setAiDifficulty,
    selectPiece,
    moveSelectedTo,
    playMove,
    reset
  };
}

function createAiTurnKey(state: GameState) {
  return `${state.id}:${state.turn}:${state.currentPlayer}:${state.moves.length}`;
}

function createTimers(mode: PlayMode): GameTimers {
  const seconds = getPlayModeConfig(mode).gameplay.initialClockSeconds;
  return {
    red: seconds === null ? null : seconds * 1000,
    black: seconds === null ? null : seconds * 1000
  };
}
