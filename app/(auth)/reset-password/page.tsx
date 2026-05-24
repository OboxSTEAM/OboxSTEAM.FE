import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { AuthFormSkeleton } from "@/components/auth/auth-form-skeleton";
import { ResetPasswordPageClient } from "@/components/auth/reset-password-form";

type ResetPasswordPageProps = {
  searchParams: Promise<{ email?: string; token?: string }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;

  return (
    <AuthShell pageKey="reset-password">
      <Suspense fallback={<AuthFormSkeleton />}>
        <ResetPasswordPageClient
          email={params.email ?? null}
          token={params.token ?? null}
        />
      </Suspense>
    </AuthShell>
  );
}
