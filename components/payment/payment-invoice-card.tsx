import type { ReactNode } from "react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import type { Payment } from "@/lib/api/entities/payment";
import { SITE } from "@/lib/landing/content";
import { PAYMENT_STATUS_LABELS } from "@/lib/payment/constants";
import {
  formatPaymentAmount,
  formatPaymentDateTime,
  shortenPaymentId,
} from "@/lib/payment/format";
import { getProgramThumbnailUrl } from "@/lib/programs/format";
import { cn } from "@/lib/utils";

type PaymentInvoiceCardProps = {
  payment: Payment;
  programName?: string | null;
  programThumbnailUrl?: string | null;
  footer?: ReactNode;
  className?: string;
};

function getStatusBadgeClass(status: Payment["status"]): string {
  switch (status) {
    case "Success":
      return "bg-[#7CB342]/15 text-[#3d5c22] hover:bg-[#7CB342]/15";
    case "Cancelled":
      return "bg-[#E5E5E0] text-[#6B6B6B] hover:bg-[#E5E5E0]";
    case "Failed":
      return "bg-[#E94B3C]/12 text-[#B71C1C] hover:bg-[#E94B3C]/12";
    default:
      return "bg-[#FDD835]/20 text-[#6b5a00] hover:bg-[#FDD835]/20";
  }
}

function InvoiceRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 border-b border-[#E5E5E0] py-3.5 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-[#6B6B6B]">
        {label}
      </dt>
      <dd
        className={cn(
          "text-sm font-medium text-[#2D2D2D] break-all",
          mono && "font-mono text-xs sm:text-sm",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function PaymentInvoiceCard({
  payment,
  programName,
  programThumbnailUrl,
  footer,
  className,
}: PaymentInvoiceCardProps) {
  const resolvedName = programName?.trim() || null;
  const thumbnailUrl = getProgramThumbnailUrl(programThumbnailUrl);

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-[#E5E5E0] bg-white shadow-[0_8px_32px_rgba(45,45,45,0.06)]",
        className,
      )}
    >
      <header className="border-b border-[#E5E5E0] bg-[#FAFAF5] px-6 py-5 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative size-10 shrink-0">
              <Image
                src={SITE.logoUrl}
                alt=""
                fill
                sizes="2.5rem"
                className="object-contain"
              />
            </div>
            <div>
              <p className="font-heading text-lg font-bold text-[#2D2D2D]">
                {SITE.name}
              </p>
              <p className="text-xs text-[#6B6B6B]">Biên lai thanh toán</p>
            </div>
          </div>
          <Badge className={getStatusBadgeClass(payment.status)}>
            {PAYMENT_STATUS_LABELS[payment.status]}
          </Badge>
        </div>
      </header>

      {resolvedName ? (
        <div className="border-b border-[#E5E5E0] px-6 py-5 sm:px-8">
          <div className="flex items-center gap-4">
            <div className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl border border-[#E5E5E0] bg-[#F5F5F0] sm:w-28">
              <Image
                src={thumbnailUrl}
                alt=""
                fill
                sizes="7rem"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B6B6B]">
                Chương trình
              </p>
              <h3 className="font-heading mt-1 text-base font-bold leading-snug text-[#2D2D2D] sm:text-lg">
                {resolvedName}
              </h3>
            </div>
          </div>
        </div>
      ) : null}

      <div className="px-6 py-2 sm:px-8">
        <dl>
          <InvoiceRow label="Mã hóa đơn" value={payment.code} mono />
          <InvoiceRow
            label="Mã giao dịch"
            value={shortenPaymentId(payment.id)}
            mono
          />
          <InvoiceRow
            label="Ngày tạo"
            value={formatPaymentDateTime(payment.createdAt)}
          />
          <InvoiceRow
            label="Ngày thanh toán"
            value={formatPaymentDateTime(payment.paidAt)}
          />
        </dl>
      </div>

      <div className="border-t border-[#E5E5E0] bg-[#FAFAF5] px-6 py-5 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-wide text-[#6B6B6B]">
          Tổng thanh toán
        </p>
        <p className="font-heading mt-1 text-3xl font-extrabold tabular-nums text-[#E94B3C]">
          {formatPaymentAmount(payment)}
        </p>
      </div>

      {footer ? (
        <footer className="border-t border-[#E5E5E0] px-6 py-5 sm:px-8">
          {footer}
        </footer>
      ) : null}
    </article>
  );
}
