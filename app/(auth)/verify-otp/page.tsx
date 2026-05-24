import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { AuthFormSkeleton } from "@/components/auth/auth-form-skeleton";
import { VerifyOtpForm } from "@/components/auth/verify-otp-form";

export default function VerifyOtpPage() {
  return (
    <AuthShell pageKey="verify-otp">
      <Suspense fallback={<AuthFormSkeleton />}>
        <VerifyOtpForm />
      </Suspense>
    </AuthShell>
  );
}
