"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Receipt } from "lucide-react";

import { InvoiceBrowserDialog } from "@/components/payment/invoice-browser-dialog";
import type { Invoice } from "@/lib/api/entities/invoice";
import { cn } from "@/lib/utils";

type EnrollmentInvoicesSectionProps = {
  invoices: Invoice[];
  programName?: string | null;
  programThumbnailUrl?: string | null;
  className?: string;
};

/**
 * Certificate-style foot strip under an enrollment card.
 * Opens a split dialog: invoice list (left) + detail (right).
 */
export function EnrollmentInvoicesSection({
  invoices,
  programName,
  programThumbnailUrl,
  className,
}: EnrollmentInvoicesSectionProps) {
  const [open, setOpen] = useState(false);

  const sortedInvoices = useMemo(
    () =>
      [...invoices].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [invoices],
  );

  if (sortedInvoices.length === 0) return null;

  const count = sortedInvoices.length;
  const label =
    count === 1 ? "Xem hóa đơn thanh toán" : `Xem ${count} hóa đơn thanh toán`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group relative flex w-full items-center gap-2.5 overflow-hidden border-t border-[#D8E8F0] px-4 py-2.5 text-left",
          "bg-gradient-to-r from-[#F3FAFD] via-[#EAF6FB] to-[#E0F2FA]",
          "motion-safe:transition-colors motion-safe:duration-200",
          "hover:from-[#EAF6FB] hover:via-[#E0F2FA] hover:to-[#D4ECF7]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4FC3F7]",
          className,
        )}
      >
        <span className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#4FC3F7] to-[#29B6F6] text-white shadow-sm ring-1 ring-[#29B6F6]/35">
          <Receipt className="size-4" strokeWidth={2.25} aria-hidden />
        </span>

        <span className="relative min-w-0 flex-1">
          <span className="font-heading block truncate text-xs font-bold text-[#2D2D2D] sm:text-[13px]">
            {label}
          </span>
        </span>

        <span className="relative inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-[#1565c0] group-hover:text-[#2D2D2D]">
          Xem
          <ChevronRight className="size-3.5" aria-hidden />
        </span>
      </button>

      <InvoiceBrowserDialog
        invoices={sortedInvoices}
        open={open}
        onOpenChange={setOpen}
        programName={programName}
        programThumbnailUrl={programThumbnailUrl}
      />
    </>
  );
}
