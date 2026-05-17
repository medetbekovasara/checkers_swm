"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createGuestIdentity,
  getCurrentIdentity,
  identityFromSession,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  type AuthIdentity
} from "@/services/auth/auth";
import { supabase } from "@/services/supabase/client";

export type AuthView = "login" | "signup";

export function useAuthSession() {
  const [identity, setIdentity] = useState<AuthIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void getCurrentIdentity()
      .then((current) => {
        if (active) setIdentity(current);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const subscription = supabase?.auth.onAuthStateChange((_event, session) => {
      setIdentity(session ? identityFromSession(session) : null);
      setLoading(false);
      setError(null);
    });

    return () => {
      active = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const result = await signInWithEmail(email, password);
    if (result.ok) setIdentity(result.identity);
    else setError(result.message);
    return result.ok;
  }, []);

  const signup = useCallback(async (email: string, password: string, handle: string) => {
    setError(null);
    const result = await signUpWithEmail(email, password, handle);
    if (result.ok) setIdentity(result.identity);
    else setError(result.message);
    return result.ok;
  }, []);

  const continueAsGuest = useCallback((handle?: string) => {
    const guest = createGuestIdentity(handle?.trim() || "Guest Player");
    setIdentity(guest);
    setError(null);
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setIdentity(null);
  }, []);

  return {
    identity,
    loading,
    error,
    login,
    signup,
    continueAsGuest,
    logout
  };
}
