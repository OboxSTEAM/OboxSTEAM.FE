"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  getInvoiceByPaymentId,
  getMyProgramEnrollments,
  getPaymentById,
  getProgramById,
  getProgramEnrollmentsByStudentId,
} from "@/lib/api";
import type { Payment } from "@/lib/api/entities/payment";
import { isParentRole } from "@/lib/auth/roles";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { clearProgramCheckoutHold } from "@/lib/payment/seat-hold";
import { getProgramLearnHref } from "@/lib/programs/enrollments";
import { PAYMENT_SUCCESS_ILLUSTRATION_URL } from "@/lib/payment/constants";
import { cn } from "@/lib/utils";

import { PaymentInvoiceCard } from "./payment-invoice-card";
import { PaymentInvoiceSkeleton } from "./payment-invoice-skeleton";
import { PaymentPageShell } from "./payment-page-shell";

type LoadState = "loading" | "ready" | "error";

type PaymentSuccessFooterProps = {
  isParent: boolean;
  programId?: string | null;
};

function PaymentSuccessFooter({
  isParent,
  programId,
}: PaymentSuccessFooterProps) {
  if (isParent) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href="/parent/children"
          className={cn(buttonVariants(), "font-semibold")}
        >
          Quản lý con
        </Link>
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "border-[#E5E5E0]",
          )}
        >
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {programId ? (
        <Link
          href={getProgramLearnHref(programId)}
          className={cn(buttonVariants(), "font-semibold")}
        >
          Vào học ngay
        </Link>
      ) : (
        <Link href="/courses" className={cn(buttonVariants(), "font-semibold")}>
          Vào Khóa học của tôi
        </Link>
      )}
      <Link
        href="/#programs"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "border-[#E5E5E0]",
        )}
      >
        Khám phá thêm chương trình
      </Link>
    </div>
  );
}

export function PaymentSuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const { profile, isHydrated, session } = useCurrentUser();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [programId, setProgramId] = useState<string | null>(null);
  const [programName, setProgramName] = useState<string | null>(null);
  const [programThumbnailUrl, setProgramThumbnailUrl] = useState<string | null>(
    null,
  );

  const cachedRole = session?.user?.role;
  const isParent =
    isHydrated &&
    ((profile != null && isParentRole(profile.role)) ||
      (cachedRole != null && isParentRole(cachedRole)));

  useEffect(() => {
    if (!paymentId) {
      setLoadState("error");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const result = await getPaymentById(paymentId);
        if (!cancelled && result?.data) {
          setPayment(result.data);
          setLoadState("ready");
        } else if (!cancelled) {
          setLoadState("error");
        }
      } catch (error) {
        if (!cancelled) {
          showAppErrorFromUnknown(error, "payments.detail");
          setLoadState("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  useEffect(() => {
    if (loadState !== "ready" || !payment || !isHydrated) return;

    let cancelled = false;

    (async () => {
      try {
        if (isParent) {
          const [enrollmentsResult, invoiceResult] = await Promise.all([
            getProgramEnrollmentsByStudentId(payment.studentId, {
              page: 1,
              pageSize: 50,
            }),
            getInvoiceByPaymentId(payment.id),
          ]);

          if (cancelled) return;

          const enrollment = enrollmentsResult?.data?.items.find(
            (item) => item.id === payment.programEnrollmentId,
          );

          if (enrollment) {
            setProgramId(enrollment.programId);
            setProgramName(enrollment.name);
            setProgramThumbnailUrl(enrollment.thumbnailUrl);
            clearProgramCheckoutHold(enrollment.programId);
          } else {
            const invoiceProgramId = invoiceResult?.data?.programId;
            if (invoiceProgramId) {
              const programResult = await getProgramById(invoiceProgramId);
              if (cancelled) return;
              const program = programResult?.data;
              if (program) {
                setProgramId(program.id);
                setProgramName(program.name || invoiceResult?.data?.itemDescription);
                setProgramThumbnailUrl(program.thumbnailUrl);
                clearProgramCheckoutHold(program.id);
              } else if (invoiceResult?.data?.itemDescription) {
                setProgramId(invoiceProgramId);
                setProgramName(invoiceResult.data.itemDescription);
                clearProgramCheckoutHold(invoiceProgramId);
              }
            }
          }
          return;
        }

        const enrollmentsResult = await getMyProgramEnrollments({
          page: 1,
          pageSize: 50,
        });

        if (cancelled) return;

        const enrollment = enrollmentsResult?.data?.items.find(
          (item) => item.id === payment.programEnrollmentId,
        );

        if (enrollment) {
          setProgramId(enrollment.programId);
          setProgramName(enrollment.name);
          setProgramThumbnailUrl(enrollment.thumbnailUrl);
          clearProgramCheckoutHold(enrollment.programId);
        }
      } catch (error) {
        if (!cancelled) {
          showAppErrorFromUnknown(error, "generic");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, isParent, loadState, payment]);

  useEffect(() => {
    if (loadState !== "ready" || isParent || !programId) return;
    router.prefetch(getProgramLearnHref(programId));
  }, [isParent, loadState, programId, router]);

  if (loadState === "loading") {
    return (
      <PaymentPageShell
        eyebrow="Thanh toán"
        title="Đang xác nhận giao dịch…"
        description="Vui lòng đợi trong giây lát — chúng tôi đang tải biên lai thanh toán của bạn."
        illustrationSrc={PAYMENT_SUCCESS_ILLUSTRATION_URL}
        illustrationAlt="Minh họa thanh toán thành công"
      >
        <PaymentInvoiceSkeleton />
      </PaymentPageShell>
    );
  }

  if (loadState === "error" || !payment) {
    return (
      <PaymentPageShell
        eyebrow="Thanh toán"
        title="Không tải được biên lai"
        description="Liên kết không hợp lệ hoặc giao dịch chưa sẵn sàng. Kiểm tra email xác nhận hoặc thử lại sau."
        illustrationSrc={PAYMENT_SUCCESS_ILLUSTRATION_URL}
        illustrationAlt="Minh họa thanh toán"
      >
        <div className="rounded-2xl border border-[#E5E5E0] bg-white px-6 py-10 text-center shadow-sm sm:px-8">
          <p className="text-sm text-[#6B6B6B]">
            {paymentId
              ? "Không tìm thấy thông tin thanh toán cho mã này."
              : "Thiếu mã thanh toán trên URL."}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            {isParent ? (
              <Link
                href="/parent/children"
                className={cn(buttonVariants(), "font-semibold")}
              >
                Quản lý con
              </Link>
            ) : (
              <Link href="/courses" className={cn(buttonVariants(), "font-semibold")}>
                Khóa học của tôi
              </Link>
            )}
            <Link
              href="/#programs"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-[#E5E5E0]",
              )}
            >
              Xem chương trình
            </Link>
          </div>
        </div>
      </PaymentPageShell>
    );
  }

  return (
    <PaymentPageShell
      eyebrow="Thanh toán thành công"
      title={isParent ? "Thanh toán hoàn tất!" : "Cảm ơn bạn đã đăng ký!"}
      description={
        isParent
          ? "Giao dịch đã được ghi nhận. Học viên có thể bắt đầu học trong Khóa học của tôi."
          : "Giao dịch đã được ghi nhận. Bạn đã được xếp vào lớp — bắt đầu học ngay."
      }
      illustrationSrc={PAYMENT_SUCCESS_ILLUSTRATION_URL}
      illustrationAlt="Minh họa thanh toán thành công"
    >
      <PaymentInvoiceCard
        payment={payment}
        programName={programName}
        programThumbnailUrl={programThumbnailUrl}
        footer={
          <PaymentSuccessFooter isParent={isParent} programId={programId} />
        }
      />
    </PaymentPageShell>
  );
}
