import type { Session, User } from "@supabase/supabase-js";

import { uid } from "@/lib/utils";
import { supabase } from "@/services/supabase/client";

export type AuthServiceError = {
  code: "supabase_not_configured" | "auth_error";
  message: string;
};

export type AuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AuthServiceError };

export type AuthIdentityResult =
  | { ok: true; data: AuthIdentity; identity: AuthIdentity }
  | { ok: false; error: AuthServiceError; message: string };

export type GuestIdentity = {
  kind: "guest";
  id: string;
  email: null;
  handle: string;
  session: null;
  createdAt: string;
};

export type SupabaseIdentity = {
  kind: "user";
  id: string;
  email: string | null;
  handle: string;
  session: Session;
  user: User;
};

export type AuthIdentity = GuestIdentity | SupabaseIdentity;

export type AuthSession = {
  session: Session | null;
  user: User | null;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

export type SignUpCredentials = AuthCredentials & {
  handle?: string;
};

const GUEST_KEY = "chaos-checkers:guest";
const notConfiguredError: AuthServiceError = {
  code: "supabase_not_configured",
  message: "Supabase auth is not configured."
};

function readGuestIdentity(): GuestIdentity | null {
  if (typeof localStorage === "undefined") return null;

  const raw = localStorage.getItem(GUEST_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as GuestIdentity;
  } catch {
    localStorage.removeItem(GUEST_KEY);
    return null;
  }
}

function writeGuestIdentity(identity: GuestIdentity) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(GUEST_KEY, JSON.stringify(identity));
}

function clearGuestIdentity() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(GUEST_KEY);
}

function handleFromUser(user: User) {
  return typeof user.user_metadata?.handle === "string"
    ? user.user_metadata.handle
    : user.email?.split("@")[0] ?? "Player";
}

export function createGuestIdentity(handle = "Guest Player"): GuestIdentity {
  const identity: GuestIdentity = {
    kind: "guest",
    id: uid("guest"),
    email: null,
    handle,
    session: null,
    createdAt: new Date().toISOString()
  };

  writeGuestIdentity(identity);
  return identity;
}

export function identityFromSession(session: Session): SupabaseIdentity {
  return {
    kind: "user",
    id: session.user.id,
    email: session.user.email ?? null,
    handle: handleFromUser(session.user),
    session,
    user: session.user
  };
}

export async function signIn(credentials: AuthCredentials): Promise<AuthResult<AuthSession>> {
  if (!supabase) return { ok: false, error: notConfiguredError };

  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  if (error) return { ok: false, error: { code: "auth_error", message: error.message } };

  return { ok: true, data: { session: data.session, user: data.user } };
}

export async function signUp(credentials: SignUpCredentials): Promise<AuthResult<AuthSession>> {
  if (!supabase) return { ok: false, error: notConfiguredError };

  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: credentials.handle ? { data: { handle: credentials.handle } } : undefined
  });

  if (error) return { ok: false, error: { code: "auth_error", message: error.message } };

  return { ok: true, data: { session: data.session, user: data.user } };
}

export async function signOut(): Promise<AuthResult<null>> {
  clearGuestIdentity();
  if (!supabase) return { ok: true, data: null };

  const { error } = await supabase.auth.signOut();
  if (error) return { ok: false, error: { code: "auth_error", message: error.message } };

  return { ok: true, data: null };
}

export async function getSession(): Promise<AuthResult<AuthSession>> {
  if (!supabase) return { ok: false, error: notConfiguredError };

  const { data, error } = await supabase.auth.getSession();
  if (error) return { ok: false, error: { code: "auth_error", message: error.message } };

  return {
    ok: true,
    data: {
      session: data.session,
      user: data.session?.user ?? null
    }
  };
}

export async function getCurrentIdentity(): Promise<AuthIdentity | null> {
  const sessionResult = await getSession();
  if (sessionResult.ok && sessionResult.data.session) return identityFromSession(sessionResult.data.session);

  return readGuestIdentity();
}

export async function getIdentityOrGuest(handle?: string): Promise<AuthIdentity> {
  return (await getCurrentIdentity()) ?? createGuestIdentity(handle);
}

export async function signInWithEmail(email: string, password: string): Promise<AuthIdentityResult> {
  const result = await signIn({ email, password });
  if (!result.ok) return { ...result, message: result.error.message };
  if (!result.data.session) {
    const error: AuthServiceError = { code: "auth_error", message: "Sign in did not return a session." };
    return { ok: false, error, message: error.message };
  }

  const identity = identityFromSession(result.data.session);
  return { ok: true, data: identity, identity };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  handle: string
): Promise<AuthIdentityResult> {
  const result = await signUp({ email, password, handle });
  if (!result.ok) return { ...result, message: result.error.message };
  if (!result.data.session) {
    const error: AuthServiceError = { code: "auth_error", message: "Check your email to finish sign up." };
    return { ok: false, error, message: error.message };
  }

  const identity = identityFromSession(result.data.session);
  return { ok: true, data: identity, identity };
}
