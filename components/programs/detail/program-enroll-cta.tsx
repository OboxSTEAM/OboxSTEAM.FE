"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isParentRole, isStudentRole } from "@/lib/auth/roles";
import { getProgramPriceParts } from "@/lib/programs/constants";
import { resolveProgramDetailEnrollmentCta } from "@/lib/programs/enrollments";
import { cn } from "@/lib/utils";

import { useProgramEnrollmentLookup } from "./program-enrollment-lookup";
import { ProgramEnrollPaymentDialog } from "./program-enroll-payment-dialog";

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
  const { isAuthenticated, isHydrated, isLoading, profile } = useCurrentUser();
  const [dialogOpen, setDialogOpen] = useState(false);

  const priceParts = getProgramPriceParts(price);
  const isHero = variant === "hero";
  const isFree = priceParts.isFree;
  const isParent = profile ? isParentRole(profile.role) : false;
  const isStudent = profile ? isStudentRole(profile.role) : false;

  const { enrollment, isLoading: isEnrollmentLoading } =
    useProgramEnrollmentLookup();

  const enrollmentCta = useMemo(
    () => resolveProgramDetailEnrollmentCta(enrollment),
    [enrollment],
  );

  const handleEnrollClick = () => {
    if (isFree) return;
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push(
        `/login?returnUrl=${encodeURIComponent(`/programs/${programId}`)}`,
      );
      return;
    }

    if (!isStudent) return;

    setDialogOpen(true);
  };

  const getEnrollSubtext = (): string => {
    if (isFree) return "Tính năng đăng ký miễn phí sẽ sớm ra mắt";
    if (isAuthenticated && isParent) {
      return "Chỉ học viên mới có thể đăng ký trực tiếp";
    }
    if (isAuthenticated && !isStudent) {
      return "Tài khoản này không thể đăng ký chương trình";
    }
    if (!isAuthenticated) return "Đăng nhập để đăng ký và thanh toán";
    return "Thanh toán trực tiếp hoặc nhờ phụ huynh";
  };

  const isEnrollDisabled = isFree || (isAuthenticated && !isStudent);
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
    if (isCheckingEnrollment) {
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

    return (
      <Button
        type="button"
        className={buttonClassName}
        aria-label="Đăng ký chương trình"
        disabled={isEnrollDisabled}
        onClick={handleEnrollClick}
      >
        {priceParts.isFree ? "Đăng ký miễn phí" : "Đăng ký chương trình"}
      </Button>
    );
  };

  const getSubtext = (): string => {
    if (showEnrollFlow) return getEnrollSubtext();
    if (enrollmentCta.kind === "enroll") return getEnrollSubtext();
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
      />
    </>
  );
}
