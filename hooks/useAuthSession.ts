"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createGuestIdentity,
  getCurrentIdentity,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  type AuthIdentity
} from "@/services/auth/auth";

export type AuthView = "login" | "signup";

export function useAuthSession() {
  const [identity, setIdentity] = useState<AuthIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getCurrentIdentity()
      .then(setIdentity)
      .finally(() => setLoading(false));
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
