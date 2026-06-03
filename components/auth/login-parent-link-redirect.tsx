"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { resolveParentLinkDestination } from "@/lib/parent/link-url";

/**
 * Email links sometimes land on `/login?returnUrl=/approve-link?...` instead of
 * `/approve-link?...`. Send users to the parent-link page first unless they
 * explicitly opened login to sign in (`intent=login`).
 */
export function LoginParentLinkRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const didRedirectRef = useRef(false);

  useEffect(() => {
    if (didRedirectRef.current) return;
    if (searchParams.get("intent") === "login") return;

    const destination = resolveParentLinkDestination(
      searchParams.get("returnUrl"),
      {
        email: searchParams.get("email"),
        token: searchParams.get("token"),
      },
    );

    if (!destination) return;

    didRedirectRef.current = true;
    router.replace(destination);
  }, [router, searchParams]);

  return null;
}
