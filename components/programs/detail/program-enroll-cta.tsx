"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProgramOpenClasses } from "@/hooks/use-program-open-classes";
import { checkoutPayment } from "@/lib/api/payments";
import { isParentRole, isStudentRole } from "@/lib/auth/roles";
import {
  showAppErrorFromUnknown,
  showAppSuccess,
} from "@/lib/errors";
import {
  getProgramEnrollmentClosedMessage,
  getProgramPriceParts,
  isProgramOpenForEnrollment,
} from "@/lib/programs/constants";
import {
  getProgramLearnHref,
  resolveProgramDetailEnrollmentCta,
} from "@/lib/programs/enrollments";
import { cn } from "@/lib/utils";

import { useProgramEnrollmentLookup } from "./program-enrollment-lookup";
import { ProgramEnrollPaymentDialog } from "./program-enroll-payment-dialog";

type ProgramEnrollCtaProps = {
  programId: string;
  price: number;
  /** Program lifecycle status (`Active` | `Draft` | `Inactive`). */
  programStatus?: string | null;
  variant?: "hero" | "sidebar";
  className?: string;
};

export function ProgramEnrollCta({
  programId,
  price,
  programStatus,
  variant = "sidebar",
  className,
}: ProgramEnrollCtaProps) {
  const router = useRouter();
  const { isAuthenticated, isHydrated, isLoading, profile } = useCurrentUser();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEnrollingFree, setIsEnrollingFree] = useState(false);

  const priceParts = getProgramPriceParts(price);
  const isHero = variant === "hero";
  const isFree = priceParts.isFree;
  const isParent = profile ? isParentRole(profile.role) : false;
  const isStudent = profile ? isStudentRole(profile.role) : false;
  const isOpenForEnrollment = isProgramOpenForEnrollment(programStatus);

  const { enrollment, isLoading: isEnrollmentLoading } =
    useProgramEnrollmentLookup();

  const enrollmentCta = useMemo(
    () => resolveProgramDetailEnrollmentCta(enrollment),
    [enrollment],
  );

  const needsOpenClassGate =
    enrollmentCta.kind === "enroll" ||
    enrollmentCta.kind === "complete-payment" ||
    !isAuthenticated;

  const {
    hasOpenSeats,
    isLoading: isOpenClassesLoading,
  } = useProgramOpenClasses(programId, {
    enabled: needsOpenClassGate && isOpenForEnrollment,
  });

  const blocksNewEnrollment =
    !isOpenForEnrollment &&
    (enrollmentCta.kind === "enroll" ||
      enrollmentCta.kind === "complete-payment");

  const blocksForNoOpenClass =
    needsOpenClassGate &&
    isOpenForEnrollment &&
    !isOpenClassesLoading &&
    !hasOpenSeats;

  const handleFreeEnroll = async () => {
    if (!isOpenForEnrollment || blocksForNoOpenClass) return;

    setIsEnrollingFree(true);
    try {
      const result = await checkoutPayment({
        programId,
        gateway: "Stripe",
      });
      const checkoutUrl = result?.data?.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      showAppSuccess({
        title: "Đăng ký thành công",
        description: "Chương trình miễn phí đã được thêm vào khóa học của bạn.",
      });
      router.push(getProgramLearnHref(programId));
      router.refresh();
    } catch (error) {
      showAppErrorFromUnknown(error, "payments.checkout");
      setIsEnrollingFree(false);
    }
  };

  const handleEnrollClick = () => {
    if (
      !isHydrated ||
      isEnrollingFree ||
      !isOpenForEnrollment ||
      blocksForNoOpenClass
    ) {
      return;
    }

    if (!isAuthenticated) {
      router.push(
        `/login?returnUrl=${encodeURIComponent(`/programs/${programId}`)}`,
      );
      return;
    }

    if (!isStudent) return;

    if (isFree) {
      void handleFreeEnroll();
      return;
    }

    setDialogOpen(true);
  };

  const getEnrollSubtext = (): string => {
    if (blocksNewEnrollment) {
      return getProgramEnrollmentClosedMessage(programStatus);
    }
    if (blocksForNoOpenClass) {
      return "Chưa có lớp đang tuyển còn ghế — tạm khóa thanh toán.";
    }
    if (isAuthenticated && isParent) {
      return "Chỉ học viên mới có thể đăng ký trực tiếp";
    }
    if (isAuthenticated && !isStudent) {
      return "Tài khoản này không thể đăng ký chương trình";
    }
    if (isFree) {
      if (!isAuthenticated) return "Đăng nhập để đăng ký miễn phí";
      return "Không cần thanh toán · bắt đầu học ngay";
    }
    if (!isAuthenticated) return "Đăng nhập để đăng ký và thanh toán";
    return "Thanh toán trực tiếp hoặc nhờ phụ huynh";
  };

  const isEnrollDisabled =
    isEnrollingFree ||
    blocksNewEnrollment ||
    blocksForNoOpenClass ||
    isOpenClassesLoading ||
    (isAuthenticated && !isStudent);
  const canFetchEnrollment =
    isHydrated && !isLoading && isAuthenticated && isStudent;
  const isCheckingEnrollment = canFetchEnrollment && isEnrollmentLoading;
  const showEnrollFlow =
    !canFetchEnrollment ||
    isCheckingEnrollment ||
    enrollmentCta.kind === "enroll";

  const buttonClassName = cn(
    "font-semibold",
    isHero ? "h-11 px-6 text-sm" : "h-11 w-full text-sm",
  );

  const subtextClassName = cn(
    "text-xs leading-relaxed text-[#6B6B6B]",
    isHero ? "" : "text-center",
  );

  const renderPrimaryAction = () => {
    if (isCheckingEnrollment || (needsOpenClassGate && isOpenClassesLoading)) {
      return (
        <Button
          type="button"
          className={buttonClassName}
          disabled
          aria-busy="true"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Đang kiểm tra…
        </Button>
      );
    }

    if (enrollmentCta.kind === "continue" || enrollmentCta.kind === "review") {
      return (
        <Link
          href={enrollmentCta.href}
          className={cn(buttonVariants(), buttonClassName)}
        >
          {enrollmentCta.label}
        </Link>
      );
    }

    if (enrollmentCta.kind === "complete-payment") {
      if (blocksNewEnrollment || blocksForNoOpenClass) {
        return (
          <Button type="button" className={buttonClassName} disabled>
            Không thể thanh toán
          </Button>
        );
      }

      return (
        <Button
          type="button"
          className={buttonClassName}
          onClick={() => setDialogOpen(true)}
        >
          {enrollmentCta.label}
        </Button>
      );
    }

    if (enrollmentCta.kind === "deferred") {
      return (
        <Button type="button" className={buttonClassName} disabled>
          {enrollmentCta.label}
        </Button>
      );
    }

    if (blocksNewEnrollment) {
      return (
        <Button type="button" className={buttonClassName} disabled>
          Không mở đăng ký
        </Button>
      );
    }

    if (blocksForNoOpenClass) {
      return (
        <Button type="button" className={buttonClassName} disabled>
          Chưa có lớp tuyển sinh
        </Button>
      );
    }

    return (
      <Button
        type="button"
        className={buttonClassName}
        aria-label={isFree ? "Đăng ký miễn phí" : "Đăng ký chương trình"}
        disabled={isEnrollDisabled}
        aria-busy={isEnrollingFree}
        onClick={handleEnrollClick}
      >
        {isEnrollingFree ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Đang đăng ký…
          </>
        ) : isFree ? (
          "Đăng ký miễn phí"
        ) : (
          "Đăng ký chương trình"
        )}
      </Button>
    );
  };

  const getSubtext = (): string => {
    if (showEnrollFlow || blocksForNoOpenClass) return getEnrollSubtext();
    return enrollmentCta.subtext;
  };

  return (
    <>
      <div className={cn("space-y-2", className)}>
        {renderPrimaryAction()}
        <p className={subtextClassName}>{getSubtext()}</p>
      </div>

      <ProgramEnrollPaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        programId={programId}
        price={price}
        payBlocked={!hasOpenSeats}
      />
    </>
  );
}
