"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cancelPayment, getPaymentById } from "@/lib/api";
import type { Payment } from "@/lib/api/entities/payment";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { PAYMENT_CANCEL_ILLUSTRATION_URL } from "@/lib/payment/constants";
import { cn } from "@/lib/utils";

import { PaymentInvoiceCard } from "./payment-invoice-card";
import { PaymentInvoiceSkeleton } from "./payment-invoice-skeleton";
import { PaymentPageShell } from "./payment-page-shell";

type CancelState = "cancelling" | "ready" | "error";

export function PaymentCancelPageContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const [cancelState, setCancelState] = useState<CancelState>(
    paymentId ? "cancelling" : "error",
  );
  const [payment, setPayment] = useState<Payment | null>(null);

  useEffect(() => {
    if (!paymentId) return;

    let cancelled = false;

    (async () => {
      try {
        await cancelPayment(paymentId);

        const result = await getPaymentById(paymentId);
        if (!cancelled) {
          setPayment(result?.data ?? null);
          setCancelState("ready");
        }
      } catch (error) {
        if (!cancelled) {
          showAppErrorFromUnknown(error, "payments.cancel");
          setCancelState("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  if (!paymentId) {
    return (
      <PaymentPageShell
        eyebrow="Thanh toán"
        title="Không hủy được giao dịch"
        description="Thiếu mã thanh toán trên URL. Quay lại trang chương trình để thử đăng ký lại."
        illustrationSrc={PAYMENT_CANCEL_ILLUSTRATION_URL}
        illustrationAlt="Minh họa thanh toán bị hủy"
      >
        <div className="rounded-2xl border border-[#E5E5E0] bg-white px-6 py-10 text-center shadow-sm sm:px-8">
          <Link
            href="/#programs"
            className={cn(buttonVariants(), "font-semibold")}
          >
            Quay lại chương trình
          </Link>
        </div>
      </PaymentPageShell>
    );
  }

  if (cancelState === "cancelling") {
    return (
      <PaymentPageShell
        eyebrow="Thanh toán"
        title="Đang hủy giao dịch…"
        description="Vui lòng đợi — chúng tôi đang cập nhật trạng thái thanh toán của bạn."
        illustrationSrc={PAYMENT_CANCEL_ILLUSTRATION_URL}
        illustrationAlt="Minh họa thanh toán bị hủy"
      >
        <PaymentInvoiceSkeleton />
      </PaymentPageShell>
    );
  }

  if (cancelState === "error") {
    return (
      <PaymentPageShell
        eyebrow="Thanh toán đã hủy"
        title="Không cập nhật được giao dịch"
        description="Thanh toán có thể đã bị hủy trước đó. Bạn vẫn có thể quay lại và đăng ký lại chương trình."
        illustrationSrc={PAYMENT_CANCEL_ILLUSTRATION_URL}
        illustrationAlt="Minh họa thanh toán bị hủy"
      >
        <div className="rounded-2xl border border-[#E5E5E0] bg-white px-6 py-10 text-center shadow-sm sm:px-8">
          <p className="text-sm text-[#6B6B6B]">
            Không thể xác nhận hủy thanh toán. Thử tải lại trang hoặc tiếp tục
            đăng ký chương trình.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/#programs"
              className={cn(buttonVariants(), "font-semibold")}
            >
              Quay lại chương trình
            </Link>
            <Link
              href="/courses"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-[#E5E5E0]",
              )}
            >
              Khóa học của tôi
            </Link>
          </div>
        </div>
      </PaymentPageShell>
    );
  }

  return (
    <PaymentPageShell
      eyebrow="Thanh toán đã hủy"
      title="Giao dịch chưa hoàn tất"
      description="Bạn đã rời khỏi trang thanh toán Stripe. Không có khoản phí nào được trừ — đăng ký lại bất cứ lúc nào."
      illustrationSrc={PAYMENT_CANCEL_ILLUSTRATION_URL}
      illustrationAlt="Minh họa thanh toán bị từ chối"
    >
      {payment ? (
        <PaymentInvoiceCard
          payment={payment}
          footer={
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/#programs"
                className={cn(buttonVariants(), "font-semibold")}
              >
                Quay lại chương trình
              </Link>
              <Link
                href="/courses"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "border-[#E5E5E0]",
                )}
              >
                Khóa học của tôi
              </Link>
            </div>
          }
        />
      ) : (
        <div className="rounded-2xl border border-[#E5E5E0] bg-white px-6 py-10 text-center shadow-sm sm:px-8">
          <p className="text-sm text-[#6B6B6B]">
            Thanh toán đã được hủy. Quay lại trang chương trình để thử lại.
          </p>
          <Link
            href="/#programs"
            className={cn(buttonVariants(), "mt-6 font-semibold")}
          >
            Quay lại chương trình
          </Link>
        </div>
      )}
    </PaymentPageShell>
  );
}
