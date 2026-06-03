"use client";

import { useEffect, useMemo } from "react";

import {
  shouldShowParentProfileGate,
  shouldShowParentProfileGateWhileLoading,
  syncParentProfilePendingForProfile,
} from "@/lib/auth/parent-profile";
import { isParentRole } from "@/lib/auth/roles";
import { useCurrentUser } from "@/hooks/use-current-user";

import { ParentProfileCompletionDialog } from "./parent-profile-completion-dialog";

export function ParentProfileGate() {
  const { profile, isAuthenticated, isHydrated, isLoading } = useCurrentUser();

  useEffect(() => {
    syncParentProfilePendingForProfile(profile);
  }, [profile]);

  const showGate = useMemo(() => {
    if (!isHydrated || !isAuthenticated) return false;
    if (profile && !isParentRole(profile.role)) return false;
    if (shouldShowParentProfileGateWhileLoading(profile, isLoading)) return true;
    if (isLoading || !profile) return false;
    return shouldShowParentProfileGate(profile);
  }, [profile, isAuthenticated, isHydrated, isLoading]);

  return <ParentProfileCompletionDialog open={showGate} profile={profile} />;
}
