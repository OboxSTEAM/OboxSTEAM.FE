"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Receipt } from "lucide-react";

import { InvoiceReceiptDialog } from "@/components/payment/invoice-receipt-dialog";
import type { Invoice } from "@/lib/api/entities/invoice";
import { formatProgramPrice } from "@/lib/programs/constants";
import { formatPaymentDateTime } from "@/lib/payment/format";
import { cn } from "@/lib/utils";

type EnrollmentInvoicesSectionProps = {
  invoices: Invoice[];
  className?: string;
};

function formatInvoiceAmount(invoice: Invoice): string {
  if (invoice.currency === "VND" || !invoice.currency) {
    return formatProgramPrice(invoice.totalAmount);
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: invoice.currency,
  }).format(invoice.totalAmount);
}

function invoiceTitle(invoice: Invoice): string {
  if (invoice.itemDescription?.trim()) return invoice.itemDescription.trim();
  if (invoice.moduleId) return "Học lại module";
  return "Đăng ký chương trình";
}

export function EnrollmentInvoicesSection({
  invoices,
  className,
}: EnrollmentInvoicesSectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { programInvoices, retakeInvoices } = useMemo(() => {
    const sorted = [...invoices].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return {
      programInvoices: sorted.filter((invoice) => invoice.moduleId == null),
      retakeInvoices: sorted.filter((invoice) => invoice.moduleId != null),
    };
  }, [invoices]);

  if (invoices.length === 0) return null;

  return (
    <>
      <div
        className={cn(
          "border-t border-[#E5E5E0] bg-[#FAFAF5] px-4 py-3 sm:px-5",
          className,
        )}
      >
        <div className="mb-2 flex items-center gap-2">
          <Receipt className="size-3.5 text-[#6B6B6B]" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6B6B]">
            Hóa đơn ({invoices.length})
          </p>
        </div>

        <div className="space-y-3">
          {programInvoices.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-[#8a8a8a]">
                Đăng ký chương trình
              </p>
              <ul className="space-y-1">
                {programInvoices.map((invoice) => (
                  <InvoiceRowButton
                    key={invoice.id}
                    invoice={invoice}
                    onOpen={() => setSelectedId(invoice.id)}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          {retakeInvoices.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-[#8a8a8a]">
                Học lại module
              </p>
              <ul className="space-y-1">
                {retakeInvoices.map((invoice) => (
                  <InvoiceRowButton
                    key={invoice.id}
                    invoice={invoice}
                    onOpen={() => setSelectedId(invoice.id)}
                  />
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <InvoiceReceiptDialog
        invoiceId={selectedId}
        open={selectedId != null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </>
  );
}

function InvoiceRowButton({
  invoice,
  onOpen,
}: {
  invoice: Invoice;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-2 rounded-lg border border-[#E5E5E0] bg-white px-2.5 py-2 text-left transition hover:border-[#C9C9C2] hover:bg-white"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold text-[#2D2D2D]">
          {invoiceTitle(invoice)}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-[#6B6B6B]">
          {invoice.invoiceNumber ?? invoice.id.slice(0, 8)}
          {" · "}
          {formatPaymentDateTime(invoice.createdAt)}
        </span>
      </span>
      <span className="shrink-0 text-xs font-semibold tabular-nums text-[#E94B3C]">
        {formatInvoiceAmount(invoice)}
      </span>
      <ChevronRight
        className="size-3.5 shrink-0 text-[#6B6B6B] group-hover:text-[#2D2D2D]"
        aria-hidden
      />
    </button>
  );
}
