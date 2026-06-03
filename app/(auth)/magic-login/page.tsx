import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { AuthFormSkeleton } from "@/components/auth/auth-form-skeleton";
import { MagicLoginPageClient } from "@/components/parent/magic-login-page-client";

type MagicLoginPageProps = {
  searchParams: Promise<{ email?: string; token?: string }>;
};

export default async function MagicLoginPage({ searchParams }: MagicLoginPageProps) {
  const params = await searchParams;

  return (
    <AuthShell pageKey="magic-login">
      <Suspense fallback={<AuthFormSkeleton />}>
        <MagicLoginPageClient email={params.email ?? null} token={params.token ?? null} />
      </Suspense>
    </AuthShell>
  );
}
