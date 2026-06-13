"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { checkoutPayment } from "@/lib/api";
import { isParentRole, isStudentRole } from "@/lib/auth/roles";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { getProgramPriceParts } from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

type ProgramEnrollCtaProps = {
  programId: string;
  price: number;
  variant?: "hero" | "sidebar";
  className?: string;
};

export function ProgramEnrollCta({
  programId,
  price,
  variant = "sidebar",
  className,
}: ProgramEnrollCtaProps) {
  const router = useRouter();
  const { isAuthenticated, isHydrated, profile } = useCurrentUser();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const priceParts = getProgramPriceParts(price);
  const isHero = variant === "hero";
  const isFree = priceParts.isFree;
  const isParent = profile ? isParentRole(profile.role) : false;
  const isStudent = profile ? isStudentRole(profile.role) : false;

  const handleEnroll = async () => {
    if (isFree || isCheckingOut) return;

    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push(
        `/login?returnUrl=${encodeURIComponent(`/programs/${programId}`)}`,
      );
      return;
    }

    if (!isStudent) return;

    setIsCheckingOut(true);
    try {
      const result = await checkoutPayment({
        programId,
        gateway: "Stripe",
      });
      const checkoutUrl = result?.data?.checkoutUrl;
      if (!checkoutUrl) {
        throw new Error("Không nhận được liên kết thanh toán.");
      }
      window.location.href = checkoutUrl;
    } catch (error) {
      setIsCheckingOut(false);
      showAppErrorFromUnknown(error, "payments.checkout");
    }
  };

  const getSubtext = (): string => {
    if (isFree) return "Tính năng đăng ký miễn phí sẽ sớm ra mắt";
    if (isAuthenticated && isParent) {
      return "Chỉ học viên mới có thể đăng ký trực tiếp";
    }
    if (isAuthenticated && !isStudent) {
      return "Tài khoản này không thể đăng ký chương trình";
    }
    if (!isAuthenticated) return "Đăng nhập để đăng ký và thanh toán";
    return "Thanh toán an toàn qua Stripe";
  };

  const isDisabled =
    isCheckingOut || isFree || (isAuthenticated && !isStudent);

  return (
    <div className={cn("space-y-2", className)}>
      {isHero && !priceParts.isFree ? (
        <p className="text-sm text-[#6B6B6B]">
          Học phí{" "}
          <span className="font-semibold text-[#2D2D2D]">
            {priceParts.amount} {priceParts.unit}
          </span>
        </p>
      ) : null}

      <Button
        type="button"
        className={cn(
          "font-semibold",
          isHero ? "h-11 px-6 text-sm" : "h-11 w-full text-sm",
        )}
        aria-label="Đăng ký chương trình"
        disabled={isDisabled}
        onClick={() => void handleEnroll()}
      >
        {isCheckingOut ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Đang chuyển đến thanh toán…
          </>
        ) : priceParts.isFree ? (
          "Đăng ký miễn phí"
        ) : (
          "Đăng ký chương trình"
        )}
      </Button>

      <p
        className={cn(
          "text-xs leading-relaxed text-[#6B6B6B]",
          isHero ? "" : "text-center",
        )}
      >
        {getSubtext()}
      </p>
    </div>
  );
}
