"use client";

import { useState } from "react";
import { ArrowLeft, Copy, Globe2, LinkIcon } from "lucide-react";
import { createInitialState } from "@/game-engine";
import type { PlayerProfile } from "@/services/profile/profile";
import { createRoomLink, createRoomSession, joinRoomByLink } from "@/services/multiplayer/rooms";

type OnlineScreenProps = {
  profile: PlayerProfile;
  onBack: () => void;
};

export function OnlineScreen({ profile, onBack }: OnlineScreenProps) {
  const [roomLink, setRoomLink] = useState("");
  const [joinValue, setJoinValue] = useState("");
  const [status, setStatus] = useState("Create a room link to invite another player.");
  const [busy, setBusy] = useState(false);

  const createRoom = async () => {
    if (busy) return;
    setBusy(true);
    const result = await createRoomSession({
      game: createInitialState("classic"),
      hostClientId: profile.id,
      hostPlayerId: profile.id,
      hostHandle: profile.handle,
      hostSide: "red"
    });

    if (result.ok) {
      const link = createRoomLink(result.data.session, window.location.origin);
      setRoomLink(link);
      setStatus("Room created. Share the link with your opponent.");
    } else {
      setStatus(result.error.message);
    }
    setBusy(false);
  };

  const joinRoom = async () => {
    if (busy || !joinValue.trim()) return;
    setBusy(true);
    const result = await joinRoomByLink({
      inviteCodeOrUrl: joinValue,
      clientId: profile.id,
      playerId: profile.id,
      handle: profile.handle
    });

    if (result.ok) {
      window.location.href = `/room/${result.data.session.inviteCode}`;
      return;
    }

    setStatus(result.error.message);
    setBusy(false);
  };

  const copyRoom = async () => {
    if (!roomLink) return;
    await navigator.clipboard?.writeText(roomLink);
    setStatus("Room link copied.");
  };

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-6 md:px-8">
      <button type="button" onClick={onBack} className="mb-5 flex items-center gap-2 text-sm text-ink/[0.56] hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Menu
      </button>

      <header className="mb-5">
        <div className="mb-3 inline-flex rounded-full border border-[#ded8c9] bg-panel/[0.78] px-3 py-1 text-xs font-medium text-ink/[0.56]">
          Realtime foundation
        </div>
        <h1 className="text-4xl font-semibold text-ink md:text-5xl">Online Room</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/[0.58]">
          Create a room link or join one. This is the multiplayer sync foundation, ready for deeper gameplay polish.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[8px] border border-[#ded8c9] bg-panel/[0.84] p-4">
          <div className="mb-3 flex items-center gap-2 font-semibold text-ink">
            <Globe2 className="h-4 w-4 text-mint" />
            Create Room
          </div>
          <button
            type="button"
            onClick={() => void createRoom()}
            disabled={busy}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-ink px-4 py-3 text-sm font-semibold text-bone transition hover:bg-[#34383d] disabled:opacity-50"
          >
            Create invite link
          </button>
          {roomLink && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void copyRoom()}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-[#ded8c9] bg-white px-4 py-3 text-sm text-ink/[0.68] transition hover:text-ink"
              >
                <Copy className="h-4 w-4" />
                Copy link
              </button>
              <a
                href={roomLink}
                className="flex min-h-11 w-full items-center justify-center rounded-[8px] border border-[#ded8c9] bg-[#f8f5ec] px-4 py-3 text-sm font-semibold text-ink/[0.72] transition hover:bg-white hover:text-ink"
              >
                Open room
              </a>
            </div>
          )}
        </div>

        <div className="rounded-[8px] border border-[#ded8c9] bg-panel/[0.84] p-4">
          <div className="mb-3 flex items-center gap-2 font-semibold text-ink">
            <LinkIcon className="h-4 w-4 text-violet" />
            Join Room
          </div>
          <input
            value={joinValue}
            onChange={(event) => setJoinValue(event.target.value)}
            placeholder="Paste room link"
            className="min-h-11 w-full rounded-[8px] border border-[#ded8c9] bg-white px-3 text-ink outline-none transition placeholder:text-ink/[0.28] focus:border-mint/[0.55]"
          />
          <button
            type="button"
            onClick={() => void joinRoom()}
            disabled={busy || !joinValue.trim()}
            className="mt-3 flex min-h-11 w-full items-center justify-center rounded-[8px] border border-[#ded8c9] bg-[#f8f5ec] px-4 py-3 text-sm font-semibold text-ink/[0.72] transition hover:bg-white hover:text-ink disabled:opacity-50"
          >
            Join
          </button>
        </div>
      </section>

      <div className="mt-4 rounded-[8px] border border-[#ded8c9] bg-[#f8f5ec] px-4 py-3 text-sm text-ink/[0.62]">
        {status}
      </div>
    </main>
  );
}
