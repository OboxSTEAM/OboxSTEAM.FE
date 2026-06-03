import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { AuthFormSkeleton } from "@/components/auth/auth-form-skeleton";
import { LoginForm } from "@/components/auth/login-form";
import { LoginParentLinkRedirect } from "@/components/auth/login-parent-link-redirect";
import { resolveLoginAuthPageKey } from "@/lib/parent/link-url";

type LoginPageProps = {
  searchParams: Promise<{
    returnUrl?: string;
    email?: string;
    token?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const pageKey = resolveLoginAuthPageKey(params.returnUrl ?? null);

  return (
    <AuthShell pageKey={pageKey}>
      <Suspense fallback={<AuthFormSkeleton />}>
        <LoginParentLinkRedirect />
        <LoginForm
          returnUrl={params.returnUrl ?? null}
          linkEmail={params.email ?? null}
          linkToken={params.token ?? null}
        />
      </Suspense>
    </AuthShell>
  );
}
