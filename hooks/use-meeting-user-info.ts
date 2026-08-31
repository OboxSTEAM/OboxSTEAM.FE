"use client";

import { useMemo } from "react";

import { useAuthSession } from "@/hooks/use-auth-session";

export type MeetingUserInfo = {
  displayName: string;
  email: string;
};

/** Display name + email for JaaS `userInfo` (falls back to email local-part). */
export function useMeetingUserInfo(): MeetingUserInfo {
  const { session } = useAuthSession();

  return useMemo(() => {
    const email = session?.user?.email?.trim() ?? "";
    const displayName =
      session?.user?.displayName?.trim() ||
      email.split("@")[0]?.trim() ||
      "Học viên";

    return { displayName, email };
  }, [session?.user?.displayName, session?.user?.email]);
}
