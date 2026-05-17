"use client";

import { useState } from "react";
import { ArrowRight, UserRound } from "lucide-react";
import type { AuthView } from "@/hooks/useAuthSession";

type AuthScreenProps = {
  error: string | null;
  onLogin: (email: string, password: string) => Promise<boolean>;
  onSignup: (email: string, password: string, handle: string) => Promise<boolean>;
  onGuest: (handle?: string) => void;
};

export function AuthScreen({ error, onLogin, onSignup, onGuest }: AuthScreenProps) {
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    if (view === "login") await onLogin(email, password);
    else await onSignup(email, password, handle || email.split("@")[0] || "Player");
    setBusy(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section className="grid w-full max-w-5xl gap-5 rounded-[8px] border border-[#ded8c9] bg-panel/[0.86] p-5 shadow-[0_18px_55px_rgba(63,69,75,0.12)] backdrop-blur-xl md:grid-cols-[1fr_380px] md:p-8">
        <div className="flex flex-col justify-between gap-8">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-[#ded8c9] bg-[#f8f5ec] px-3 py-1 text-xs font-medium text-ink/[0.56]">
              Competitive strategy platform
            </div>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight text-ink md:text-6xl">
              Play smarter checkers.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-ink/[0.62] md:text-base">
              Build your profile, practice against scalable AI, track XP, and keep your match history ready for future online play.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-ink/[0.62] sm:grid-cols-3">
            <Metric label="AI modes" value="5" />
            <Metric label="Difficulties" value="4" />
            <Metric label="Guest ready" value="Yes" />
          </div>
        </div>

        <div className="rounded-[8px] border border-[#e4ddcb] bg-[#fbfaf4] p-4">
          <div className="mb-4 flex rounded-[8px] bg-[#f2efe4] p-1">
            {(["login", "signup"] as const).map((item) => (
              <button
                key={item}
              type="button"
              onClick={() => setView(item)}
              disabled={busy}
                className={`min-h-10 flex-1 rounded-[8px] text-sm capitalize transition ${
                  view === item ? "bg-white text-ink shadow-sm" : "text-ink/[0.52] hover:text-ink"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {view === "signup" && (
              <TextInput label="Handle" value={handle} onChange={setHandle} placeholder="NovaFork" />
            )}
            <TextInput label="Email" value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
            <TextInput label="Password" value={password} onChange={setPassword} placeholder="••••••••" type="password" />
            {error && <div className="rounded-[8px] bg-ember/[0.12] px-3 py-2 text-sm text-ink/[0.68]">{error}</div>}
            <button
              type="button"
              onClick={() => void submit()}
              disabled={busy}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-ink px-4 py-3 font-semibold text-bone transition hover:bg-[#34383d] disabled:opacity-50"
            >
              {view === "login" ? "Continue" : "Create profile"}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onGuest(handle)}
              disabled={busy}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-[#ded8c9] bg-transparent px-4 py-3 text-sm text-ink/[0.68] transition hover:bg-white hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UserRound className="h-4 w-4" />
              Continue as guest
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function TextInput({ label, value, onChange, placeholder, type = "text" }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block text-sm font-medium text-ink/[0.66]">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 min-h-11 w-full rounded-[8px] border border-[#ded8c9] bg-white px-3 text-ink outline-none transition placeholder:text-ink/[0.28] focus:border-mint/[0.55]"
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[#ded8c9] bg-[#f8f5ec] p-3">
      <div className="text-xl font-semibold text-ink">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.12em] text-ink/[0.42]">{label}</div>
    </div>
  );
}
