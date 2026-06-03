import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { AuthFormSkeleton } from "@/components/auth/auth-form-skeleton";
import { MagicLoginPageClient } from "@/components/parent/magic-login-page-client";

type ApproveLinkPageProps = {
  searchParams: Promise<{ email?: string; token?: string }>;
};

export default async function ApproveLinkPage({ searchParams }: ApproveLinkPageProps) {
  const params = await searchParams;

  return (
    <AuthShell pageKey="approve-link">
      <Suspense fallback={<AuthFormSkeleton />}>
        <MagicLoginPageClient
          variant="approve-link"
          email={params.email ?? null}
          token={params.token ?? null}
        />
      </Suspense>
    </AuthShell>
  );
}
