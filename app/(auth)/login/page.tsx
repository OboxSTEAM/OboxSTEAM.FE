import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { AuthFormSkeleton } from "@/components/auth/auth-form-skeleton";
import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{ returnUrl?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <AuthShell pageKey="login">
      <Suspense fallback={<AuthFormSkeleton />}>
        <LoginForm returnUrl={params.returnUrl ?? null} />
      </Suspense>
    </AuthShell>
  );
}
