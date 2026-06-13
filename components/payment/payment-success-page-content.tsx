"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { getPaymentById } from "@/lib/api";
import type { Payment } from "@/lib/api/entities/payment";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { PAYMENT_SUCCESS_ILLUSTRATION_URL } from "@/lib/payment/constants";
import { cn } from "@/lib/utils";

import { PaymentInvoiceCard } from "./payment-invoice-card";
import { PaymentInvoiceSkeleton } from "./payment-invoice-skeleton";
import { PaymentPageShell } from "./payment-page-shell";

type LoadState = "loading" | "ready" | "error";

export function PaymentSuccessPageContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [payment, setPayment] = useState<Payment | null>(null);

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
        description="Liên kết không hợp lệ hoặc giao dịch chưa sẵn sàng. Kiểm tra email xác nhận hoặc vào Khóa học của tôi."
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
            <Link href="/courses" className={cn(buttonVariants(), "font-semibold")}>
              Khóa học của tôi
            </Link>
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
      title="Cảm ơn bạn đã đăng ký!"
      description="Giao dịch đã được ghi nhận. Bạn có thể bắt đầu học ngay trong mục Khóa học của tôi."
      illustrationSrc={PAYMENT_SUCCESS_ILLUSTRATION_URL}
      illustrationAlt="Minh họa thanh toán thành công"
    >
      <PaymentInvoiceCard
        payment={payment}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/courses" className={cn(buttonVariants(), "font-semibold")}>
              Vào Khóa học của tôi
            </Link>
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
        }
      />
    </PaymentPageShell>
  );
}
