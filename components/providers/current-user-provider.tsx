"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getCurrentUser,
  toStoredAuthUser,
  type UserProfile,
} from "@/lib/api/account";
import { syncParentProfilePendingForProfile } from "@/lib/auth/parent-profile";
import {
  getAuthSession,
  persistAuthSession,
  type StoredAuthSession,
} from "@/lib/auth/session";

import { useAuthSession } from "@/hooks/use-auth-session";

type CurrentUserContextValue = {
  profile: UserProfile | null;
  session: StoredAuthSession | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  error: unknown;
  refresh: () => Promise<UserProfile | null>;
  applyProfileUpdate: (nextProfile: UserProfile) => void;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const { session, isAuthenticated, isHydrated } = useAuthSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const isMountedRef = useRef(false);
  const fetchGenerationRef = useRef(0);

  const syncSessionFromProfile = useCallback((nextProfile: UserProfile) => {
    const current = getAuthSession();
    if (!current?.accessToken) return;
    persistAuthSession(current, toStoredAuthUser(nextProfile));
  }, []);

  const applyProfileUpdate = useCallback(
    (nextProfile: UserProfile) => {
      if (!isMountedRef.current) return;
      setProfile(nextProfile);
      syncSessionFromProfile(nextProfile);
    },
    [syncSessionFromProfile],
  );

  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    const generation = ++fetchGenerationRef.current;

    if (!isAuthenticated) {
      if (isMountedRef.current) {
        setProfile(null);
        setError(null);
        setIsLoading(false);
      }
      return null;
    }

    if (isMountedRef.current) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const result = await getCurrentUser();
      if (!isMountedRef.current || generation !== fetchGenerationRef.current) {
        return null;
      }

      setProfile(result.data);
      syncSessionFromProfile(result.data);
      syncParentProfilePendingForProfile(result.data);
      return result.data;
    } catch (err) {
      if (isMountedRef.current && generation === fetchGenerationRef.current) {
        setError(err);
      }
      return null;
    } finally {
      if (isMountedRef.current && generation === fetchGenerationRef.current) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, syncSessionFromProfile]);

  const refresh = useCallback(() => fetchProfile(), [fetchProfile]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      fetchGenerationRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    void fetchProfile();
  }, [isHydrated, isAuthenticated, fetchProfile]);

  const value = useMemo<CurrentUserContextValue>(
    () => ({
      profile,
      session: session as StoredAuthSession | null,
      isAuthenticated,
      isHydrated,
      isLoading: !isHydrated || isLoading,
      error,
      refresh,
      applyProfileUpdate,
    }),
    [
      profile,
      session,
      isAuthenticated,
      isHydrated,
      isLoading,
      error,
      refresh,
      applyProfileUpdate,
    ],
  );

  return (
    <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): CurrentUserContextValue {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error("useCurrentUser must be used within CurrentUserProvider");
  }
  return context;
}
