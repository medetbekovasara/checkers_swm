"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuthIdentity } from "@/services/auth/auth";
import { loadPlayerProfile, savePlayerProfile, type PlayerProfile } from "@/services/profile/profile";

export function usePlatformProfile(identity: AuthIdentity | null) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!identity) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let active = true;
    setProfile(null);
    setLoading(true);
    void loadPlayerProfile(identity).then((loaded) => {
      if (active) setProfile(loaded);
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [identity]);

  const updateProfile = useCallback((next: PlayerProfile) => {
    setProfile(next);
    void savePlayerProfile(next);
  }, []);

  return {
    profile,
    loading: Boolean(identity) && (loading || profile === null),
    updateProfile
  };
}
