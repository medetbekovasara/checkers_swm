"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Copy } from "lucide-react";
import { CheckersBoard } from "@/components/board/CheckersBoard";
import { AuthScreen } from "@/components/platform/AuthScreen";
import { getMovesForPiece, type GameState, type Player } from "@/game-engine";
import { useAuthSession } from "@/hooks/useAuthSession";
import { usePlatformProfile } from "@/hooks/usePlatformProfile";
import { cn, uid } from "@/lib/utils";
import {
  createRoomLink,
  getRoomSnapshotByInviteCode,
  joinRoomByLink,
  submitMoveCommand,
  subscribeToRoomEvents,
  type RoomParticipant,
  type RoomSession
} from "@/services/multiplayer/rooms";

type OnlineArenaProps = {
  inviteCode: string;
};

export function OnlineArena({ inviteCode }: OnlineArenaProps) {
  const auth = useAuthSession();
  const { profile, loading: profileLoading } = usePlatformProfile(auth.identity);
  const [state, setState] = useState<GameState | null>(null);
  const [session, setSession] = useState<RoomSession | null>(null);
  const [players, setPlayers] = useState<RoomParticipant[]>([]);
  const [ownSide, setOwnSide] = useState<Player | "spectator" | null>(null);
  const [selectedPieceId, setSelectedPieceId] = useState<string | undefined>();
  const [status, setStatus] = useState("Joining room...");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile) return;

    let active = true;
    void joinRoomByLink({
      inviteCodeOrUrl: inviteCode,
      clientId: profile.id,
      playerId: profile.id,
      handle: profile.handle
    }).then(async (joinResult) => {
      const result = joinResult.ok ? joinResult : await getRoomSnapshotByInviteCode(inviteCode);
      if (!active) return;

      if (!result.ok) {
        setStatus(result.error.message);
        return;
      }

      const participant = result.data.session.players.find((player) => (
        player.playerId === profile.id || player.clientId === profile.id
      ));

      setState(result.data.state);
      setSession(result.data.session);
      setPlayers(result.data.session.players);
      setOwnSide(participant?.side ?? "spectator");
      setStatus(result.data.session.players.length >= 2 ? "Connected. Match is live." : "Waiting for opponent to join.");
    });

    return () => {
      active = false;
    };
  }, [inviteCode, profile]);

  useEffect(() => {
    if (!session) return;

    return subscribeToRoomEvents(session.id, (event) => {
      if (event.type === "presence_changed") {
        setPlayers(event.players);
        setStatus(event.players.length >= 2 ? "Connected. Match is live." : "Waiting for opponent to join.");
        return;
      }

      if (event.type === "room_snapshot") {
        setState(event.state);
        setSession((current) => current ? {
          ...current,
          version: event.version,
          stateHash: event.stateHash,
          moveCount: event.moveCount
        } : current);
        return;
      }

      if (event.type === "move_accepted") {
        setState(event.state);
        setSession((current) => current ? {
          ...current,
          status: event.state.status === "active" ? "active" : "completed",
          version: event.version,
          stateHash: event.stateHash,
          moveCount: event.moveCount,
          updatedAt: event.acceptedAt
        } : current);
        setSelectedPieceId(undefined);
        setSubmitting(false);
      }
    });
  }, [session]);

  const selectedMoves = useMemo(() => {
    if (!state || !selectedPieceId) return [];
    return getMovesForPiece(state, selectedPieceId);
  }, [selectedPieceId, state]);

  const canMove = Boolean(
    state &&
    session &&
    ownSide !== null &&
    ownSide !== "spectator" &&
    state.status === "active" &&
    state.currentPlayer === ownSide &&
    players.length >= 2 &&
    !submitting
  );

  const selectPiece = (pieceId: string) => {
    if (!state || !canMove) return;
    const piece = state.pieces.find((candidate) => candidate.id === pieceId);
    if (!piece || piece.player !== ownSide || piece.player !== state.currentPlayer) return;
    setSelectedPieceId(pieceId);
  };

  const moveSelectedTo = async (row: number, col: number) => {
    if (!state || !session || !profile || !canMove) return;
    const move = selectedMoves.find((candidate) => {
      const destination = candidate.path[candidate.path.length - 1];
      return destination.row === row && destination.col === col;
    });
    if (!move) return;

    setSubmitting(true);
    const result = await submitMoveCommand({
      type: "move_submitted",
      roomId: session.id,
      clientId: profile.id,
      idempotencyKey: uid("online_move"),
      baseVersion: session.version,
      move,
      submittedAt: new Date().toISOString()
    });

    if (result.ok) {
      setState(result.data.state);
      setSession((current) => current ? {
        ...current,
        status: result.data.state.status === "active" ? "active" : "completed",
        version: result.data.version,
        stateHash: result.data.stateHash,
        moveCount: result.data.moveCount,
        updatedAt: result.data.acceptedAt
      } : current);
      setSelectedPieceId(undefined);
      setStatus("Move synced.");
    } else {
      setStatus(result.error.message);
    }
    setSubmitting(false);
  };

  const copyLink = async () => {
    if (!session) return;
    await navigator.clipboard?.writeText(createRoomLink(session, window.location.origin));
    setStatus("Room link copied.");
  };

  if (auth.loading || profileLoading) {
    return <main className="flex min-h-screen items-center justify-center text-sm text-ink/[0.58]">Loading room...</main>;
  }

  if (!auth.identity || !profile) {
    return (
      <AuthScreen
        error={auth.error}
        onLogin={auth.login}
        onSignup={auth.signup}
        onGuest={auth.continueAsGuest}
      />
    );
  }

  return (
    <main className="min-h-screen px-2 py-3 sm:px-4 md:px-6 md:py-5">
      <section className="mx-auto flex max-w-4xl flex-col gap-3">
        <div className="flex items-center justify-between gap-3 rounded-[8px] border border-[#ded8c9] bg-panel/[0.84] p-3 shadow-[0_10px_28px_rgba(63,69,75,0.08)]">
          <a href="/" className="inline-flex items-center gap-2 text-sm text-ink/[0.58] hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            Menu
          </a>
          <div className="min-w-0 text-center">
            <div className="text-xs uppercase tracking-[0.14em] text-ink/[0.42]">Online Match</div>
            <div className="truncate text-sm font-semibold text-ink">{getTurnLabel(state, ownSide)}</div>
          </div>
          <button
            type="button"
            onClick={() => void copyLink()}
            disabled={!session}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-[#ded8c9] bg-[#f8f5ec] text-ink/[0.58] transition hover:bg-white hover:text-ink disabled:opacity-50"
            aria-label="Copy room link"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-[8px] border border-[#ded8c9] bg-panel/[0.82] p-2 shadow-[0_14px_38px_rgba(63,69,75,0.10)] backdrop-blur-xl sm:p-3">
          {state ? (
            <div className="flex justify-center">
              <CheckersBoard
                state={{ ...state, selectedPieceId }}
                selectedMoves={selectedMoves}
                playablePlayer={canMove && ownSide !== "spectator" ? ownSide : null}
                onSelectPiece={selectPiece}
                onMoveTo={(row, col) => void moveSelectedTo(row, col)}
              />
            </div>
          ) : (
            <div className="flex aspect-square w-full items-center justify-center text-sm text-ink/[0.52]">
              {status}
            </div>
          )}

          <div className="mt-2 grid gap-2 rounded-[8px] bg-[#f2efe4] px-3 py-2 text-xs text-ink/[0.56] sm:grid-cols-[1fr_auto] sm:items-center">
            <span>{status}</span>
            <div className="flex gap-2">
              <PlayerBadge label="RED" active={state?.currentPlayer === "red"} owner={players.find((player) => player.side === "red")?.handle ?? "Waiting"} />
              <PlayerBadge label="BLACK" active={state?.currentPlayer === "black"} owner={players.find((player) => player.side === "black")?.handle ?? "Waiting"} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function getTurnLabel(state: GameState | null, ownSide: Player | "spectator" | null) {
  if (!state) return "Loading";
  if (state.status !== "active") {
    if (state.status === "draw") return "Draw";
    return `${state.winner?.toUpperCase() ?? "Winner"} wins`;
  }
  if (ownSide === "spectator") return `${state.currentPlayer.toUpperCase()} to move`;
  return state.currentPlayer === ownSide ? "Your turn" : `${state.currentPlayer.toUpperCase()} is thinking`;
}

function PlayerBadge({ label, owner, active }: { label: string; owner: string; active: boolean }) {
  return (
    <div className={cn("rounded-[6px] px-2 py-1 text-center", active ? "bg-volt/[0.16] text-ink" : "bg-white/55 text-ink/[0.56]")}>
      <div className="text-[9px] font-semibold uppercase tracking-[0.12em]">{label}</div>
      <div className="max-w-24 truncate text-[11px]">{owner}</div>
    </div>
  );
}
