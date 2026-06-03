"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AuthFooterLink, AuthFormHeader } from "@/components/auth/auth-shell";
import { AuthFormSkeleton } from "@/components/auth/auth-form-skeleton";
import { Button } from "@/components/ui/button";
import { approveParentLink, parentMagicLogin } from "@/lib/api";
import { ApiResponseError } from "@/lib/api/errors";
import { setParentProfilePending } from "@/lib/auth/parent-profile";
import { isParentRole } from "@/lib/auth/roles";
import { persistAuthSession } from "@/lib/auth/session";
import { showAppError, showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { isExistingParentAccountError } from "@/lib/parent/magic-login-errors";
import {
  buildParentLinkUrl,
  PARENT_LINK_PATHS,
  type ParentLinkConfirmVariant,
} from "@/lib/parent/link-url";
import { parentMagicLoginLinkParamsSchema } from "@/lib/validations/parent";
import { useCurrentUser } from "@/hooks/use-current-user";

export type { ParentLinkConfirmVariant };

type MagicLoginPageClientProps = {
  email: string | null;
  token: string | null;
  /** URL path from email — BE uses /magic-login (shadow) or /approve-link (existing parent). */
  variant?: ParentLinkConfirmVariant;
};

type FlowState = "loading" | "needs-login" | "error";

export function MagicLoginPageClient({
  email,
  token,
  variant = "magic-login",
}: MagicLoginPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, isAuthenticated, isHydrated, isLoading, refresh } =
    useCurrentUser();
  const [flowState, setFlowState] = useState<FlowState>(() =>
    variant === "approve-link" ? "needs-login" : "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [useApproveLinkPaths, setUseApproveLinkPaths] = useState(
    variant === "approve-link",
  );
  const lastRunKeyRef = useRef<string | null>(null);

  const effectiveVariant: ParentLinkConfirmVariant = pathname.includes(
    PARENT_LINK_PATHS["approve-link"],
  )
    ? "approve-link"
    : variant;
  const isApproveLinkFlow = effectiveVariant === "approve-link";

  const parsed = useMemo(() => {
    try {
      return parentMagicLoginLinkParamsSchema.parse({ email, token });
    } catch {
      return null;
    }
  }, [email, token]);

  const linkPath =
    effectiveVariant === "approve-link" || useApproveLinkPaths
      ? PARENT_LINK_PATHS["approve-link"]
      : PARENT_LINK_PATHS["magic-login"];

  const returnUrl = useMemo(() => {
    if (!parsed) return linkPath;
    return buildParentLinkUrl(linkPath, parsed.email, parsed.token);
  }, [parsed, linkPath]);

  const runFlow = useCallback(async () => {
    if (!parsed) return;

    setErrorMessage(null);

    if (!isAuthenticated) {
      if (isApproveLinkFlow) {
        setFlowState("needs-login");
        return;
      }

      setFlowState("loading");
    }

    try {
      if (isAuthenticated) {
        if (!isParentRole(profile?.role)) {
          setErrorMessage(
            "Vui lòng đăng nhập bằng tài khoản phụ huynh để xác nhận liên kết.",
          );
          setFlowState("error");
          return;
        }

        setFlowState("loading");
        const result = await approveParentLink({ token: parsed.token });
        showAppSuccess({
          title: "Liên kết thành công",
          description: result.message,
        });
        router.replace("/parent/children");
        return;
      }

      const result = await parentMagicLogin({
        email: parsed.email,
        token: parsed.token,
      });

      persistAuthSession(result.data, { email: parsed.email });
      setParentProfilePending();
      await refresh();

      showAppSuccess({
        title: "Xác nhận liên kết thành công",
        description: result.message,
      });
      router.replace("/parent/children");
    } catch (error) {
      if (isExistingParentAccountError(error)) {
        setUseApproveLinkPaths(true);
        setFlowState("needs-login");
        return;
      }

      if (error instanceof ApiResponseError) {
        setErrorMessage(error.message);
      } else {
        showAppErrorFromUnknown(error, "parent.magic-login");
      }
      setFlowState("error");
    }
  }, [
    parsed,
    isAuthenticated,
    profile,
    refresh,
    router,
    isApproveLinkFlow,
  ]);

  useEffect(() => {
    if (!parsed) {
      showAppError({
        title: "Liên kết không hợp lệ",
        reason: "Thiếu email hoặc token trong URL.",
        action: "Mở lại liên kết từ email hoặc yêu cầu học viên gửi lại.",
      });
      return;
    }

    if (!isHydrated) {
      if (isApproveLinkFlow) {
        setFlowState("needs-login");
      }
      return;
    }

    if (!isAuthenticated) {
      if (isApproveLinkFlow) {
        setFlowState("needs-login");
        return;
      }

      const runKey = `guest:${parsed.email}:${parsed.token}`;
      if (lastRunKeyRef.current === runKey) return;
      lastRunKeyRef.current = runKey;
      void runFlow();
      return;
    }

    if (isLoading || !profile) return;

    const runKey = `auth:${profile.role}:${parsed.email}:${parsed.token}`;
    if (lastRunKeyRef.current === runKey) return;
    lastRunKeyRef.current = runKey;
    void runFlow();
  }, [
    parsed,
    isHydrated,
    isAuthenticated,
    isLoading,
    profile,
    runFlow,
    isApproveLinkFlow,
  ]);

  if (!parsed) {
    return (
      <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center">
        <AuthFooterLink
          prompt="Quay lại"
          linkLabel="Đăng nhập"
          href="/login"
        />
      </div>
    );
  }

  if (flowState === "loading") {
    return (
      <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center">
        <AuthFormHeader
          title="Đang xác nhận liên kết"
          description="Vui lòng đợi trong giây lát…"
        />
        <AuthFormSkeleton />
      </div>
    );
  }

  if (flowState === "needs-login") {
    const loginHref = `/login?returnUrl=${encodeURIComponent(returnUrl)}&intent=login`;
    return (
      <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col">
        <AuthFormHeader
          title={
            effectiveVariant === "approve-link" || useApproveLinkPaths
              ? "Đăng nhập để xác nhận liên kết"
              : "Bạn đã có tài khoản phụ huynh"
          }
          description="Đăng nhập bằng tài khoản phụ huynh. Sau khi đăng nhập, hệ thống sẽ xác nhận liên kết và chuyển bạn tới trang Thông tin con."
        />
        <Button
          render={<Link href={loginHref} />}
          className="mt-4 h-11 w-full rounded-xl bg-[#2D2D2D] text-base font-semibold text-white hover:bg-[#1a1a1a]"
        >
          Đăng nhập phụ huynh
        </Button>
        <AuthFooterLink
          prompt={
            effectiveVariant === "approve-link"
              ? "Liên kết dành cho phụ huynh mới?"
              : "Liên kết dành cho phụ huynh đã có tài khoản?"
          }
          linkLabel="Thử lại"
          href={
            effectiveVariant === "approve-link"
              ? buildParentLinkUrl(
                  PARENT_LINK_PATHS["magic-login"],
                  parsed.email,
                  parsed.token,
                )
              : buildParentLinkUrl(
                  PARENT_LINK_PATHS["approve-link"],
                  parsed.email,
                  parsed.token,
                )
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center">
      <AuthFormHeader
        title="Không xác nhận được liên kết"
        description={errorMessage ?? "Liên kết không hợp lệ hoặc đã hết hạn."}
      />
      <Button
        type="button"
        variant="outline"
        className="mt-4 h-11 w-full rounded-xl"
        onClick={() => {
          lastRunKeyRef.current = null;
          void runFlow();
        }}
      >
        Thử lại
      </Button>
      <AuthFooterLink prompt="Quay lại" linkLabel="Đăng nhập" href="/login" />
    </div>
  );
}
