"use client";

import { useMemo } from "react";

import { shouldShowParentProfileGate } from "@/lib/auth/parent-profile";
import { useCurrentUser } from "@/hooks/use-current-user";

import { ParentProfileCompletionDialog } from "./parent-profile-completion-dialog";

export function ParentProfileGate() {
  const { profile, isAuthenticated, isHydrated, isLoading } = useCurrentUser();

  const showGate = useMemo(() => {
    if (!isHydrated || isLoading || !isAuthenticated || !profile) return false;
    return shouldShowParentProfileGate(profile);
  }, [profile, isAuthenticated, isHydrated, isLoading]);

  return <ParentProfileCompletionDialog open={showGate} />;
}
