"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import { PaymentInvoiceCard } from "@/components/payment/payment-invoice-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getInvoiceById,
  getPaymentById,
  type Invoice,
  type Payment,
} from "@/lib/api";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { SITE } from "@/lib/landing/content";
import {
  formatPaymentDateTime,
  shortenPaymentId,
} from "@/lib/payment/format";
import { formatProgramPrice } from "@/lib/programs/constants";
import { getProgramThumbnailUrl } from "@/lib/programs/format";
import { cn } from "@/lib/utils";

type InvoiceBrowserDialogProps = {
  invoices: Invoice[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programName?: string | null;
  programThumbnailUrl?: string | null;
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

function invoiceNumberLabel(invoice: Invoice): string {
  return invoice.invoiceNumber ?? invoice.id.slice(0, 8);
}

function invoiceTransactionLabel(invoice: Invoice): string {
  return shortenPaymentId(invoice.paymentId);
}

function FallbackInvoiceRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
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

function InvoiceFallbackCard({
  invoice,
  programName,
  programThumbnailUrl,
}: {
  invoice: Invoice;
  programName?: string | null;
  programThumbnailUrl?: string | null;
}) {
  const resolvedName =
    programName?.trim() || invoice.itemDescription?.trim() || null;
  const thumbnailUrl = getProgramThumbnailUrl(programThumbnailUrl);
  const createdAtLabel = formatPaymentDateTime(invoice.createdAt);

  return (
    <article className="overflow-hidden rounded-2xl border border-[#E5E5E0] bg-white shadow-[0_8px_32px_rgba(45,45,45,0.06)]">
      <header className="border-b border-[#E5E5E0] bg-[#FAFAF5] px-5 py-4 sm:px-6">
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
            <p className="text-xs text-[#6B6B6B]">Hóa đơn thanh toán</p>
          </div>
        </div>
      </header>
      {resolvedName ? (
        <div className="border-b border-[#E5E5E0] px-5 py-4 sm:px-6">
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
      <div className="px-5 py-2 sm:px-6">
        <dl>
          <FallbackInvoiceRow
            label="Mã hóa đơn"
            value={invoiceNumberLabel(invoice)}
            mono
          />
          <FallbackInvoiceRow
            label="Mã giao dịch"
            value={invoiceTransactionLabel(invoice)}
            mono
          />
          <FallbackInvoiceRow label="Ngày tạo" value={createdAtLabel} />
          <FallbackInvoiceRow label="Ngày thanh toán" value={createdAtLabel} />
        </dl>
      </div>
      <div className="border-t border-[#E5E5E0] bg-[#FAFAF5] px-5 py-4 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-wide text-[#6B6B6B]">
          Tổng thanh toán
        </p>
        <p className="font-heading mt-1 text-3xl font-extrabold tabular-nums text-[#E94B3C]">
          {formatInvoiceAmount(invoice)}
        </p>
      </div>
    </article>
  );
}

function InvoiceListPanel({
  invoices,
  selectedId,
  onSelect,
  programThumbnailUrl,
}: {
  invoices: Invoice[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  programThumbnailUrl?: string | null;
}) {
  const thumbnailUrl = getProgramThumbnailUrl(programThumbnailUrl);
  const { programInvoices, retakeInvoices } = useMemo(() => {
    return {
      programInvoices: invoices.filter((invoice) => invoice.moduleId == null),
      retakeInvoices: invoices.filter((invoice) => invoice.moduleId != null),
    };
  }, [invoices]);

  function renderGroup(title: string, items: Invoice[]) {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1.5">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
          {title}
        </p>
        <ul className="space-y-1">
          {items.map((invoice) => {
            const isSelected = invoice.id === selectedId;
            return (
              <li key={invoice.id}>
                <button
                  type="button"
                  onClick={() => onSelect(invoice.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                    isSelected
                      ? "border-[#4FC3F7] bg-[#E8F7FD] shadow-sm"
                      : "border-[#E5E5E0] bg-white hover:border-[#C9C9C2] hover:bg-[#FAFAF5]",
                  )}
                >
                  <div className="relative aspect-[4/3] w-14 shrink-0 overflow-hidden rounded-lg border border-[#E5E5E0] bg-[#F5F5F0]">
                    <Image
                      src={thumbnailUrl}
                      alt=""
                      fill
                      sizes="3.5rem"
                      className="object-cover"
                    />
                  </div>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="line-clamp-2 text-xs font-semibold text-[#2D2D2D]">
                      {invoiceTitle(invoice)}
                    </span>
                    <span className="truncate text-[11px] text-[#6B6B6B]">
                      {invoiceNumberLabel(invoice)}
                      {" · "}
                      {invoiceTransactionLabel(invoice)}
                    </span>
                    <span className="truncate text-[11px] text-[#6B6B6B]">
                      Thanh toán {formatPaymentDateTime(invoice.createdAt)}
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-[#E94B3C]">
                      {formatInvoiceAmount(invoice)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderGroup("Đăng ký chương trình", programInvoices)}
      {renderGroup("Học lại module", retakeInvoices)}
    </div>
  );
}

function InvoiceDetailPanel({
  invoiceId,
  programName,
  programThumbnailUrl,
}: {
  invoiceId: string | null;
  programName?: string | null;
  programThumbnailUrl?: string | null;
}) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loadState, setLoadState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");

  useEffect(() => {
    if (!invoiceId) {
      setInvoice(null);
      setPayment(null);
      setLoadState("idle");
      return;
    }

    let cancelled = false;
    setLoadState("loading");

    (async () => {
      try {
        const invoiceResult = await getInvoiceById(invoiceId);
        const nextInvoice = invoiceResult?.data ?? null;
        if (!nextInvoice) {
          throw new Error("Invoice missing data.");
        }

        let nextPayment: Payment | null = null;
        try {
          const paymentResult = await getPaymentById(nextInvoice.paymentId);
          nextPayment = paymentResult?.data ?? null;
        } catch {
          nextPayment = null;
        }

        if (!cancelled) {
          setInvoice(nextInvoice);
          setPayment(nextPayment);
          setLoadState("ready");
        }
      } catch (error) {
        if (!cancelled) {
          showAppErrorFromUnknown(error, "invoices.detail");
          setLoadState("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [invoiceId]);

  if (!invoiceId || loadState === "idle") {
    return (
      <div className="flex h-full min-h-64 items-center justify-center rounded-2xl border border-dashed border-[#E5E5E0] bg-[#FAFAF5] px-4 text-center">
        <p className="text-sm text-[#6B6B6B]">Chọn một hóa đơn để xem chi tiết.</p>
      </div>
    );
  }

  if (loadState === "loading") {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (loadState === "error" || !invoice) {
    return (
      <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-2xl border border-[#E5E5E0] bg-white px-4 text-center">
        <p className="text-sm text-[#6B6B6B]">Không tải được hóa đơn.</p>
      </div>
    );
  }

  if (payment) {
    return (
      <PaymentInvoiceCard
        payment={payment}
        programName={programName ?? invoice.itemDescription}
        programThumbnailUrl={programThumbnailUrl}
      />
    );
  }

  return (
    <InvoiceFallbackCard
      invoice={invoice}
      programName={programName}
      programThumbnailUrl={programThumbnailUrl}
    />
  );
}

/** Split dialog: left invoice list, right receipt detail. */
export function InvoiceBrowserDialog({
  invoices,
  open,
  onOpenChange,
  programName,
  programThumbnailUrl,
}: InvoiceBrowserDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedId(null);
      return;
    }
    setSelectedId(invoices[0]?.id ?? null);
  }, [open, invoices]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="flex max-h-[min(90dvh,44rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <div className="relative shrink-0 border-b border-[#E5E5E0] px-5 py-4 sm:px-6">
          <DialogClose className="top-4 right-4" />
          <DialogHeader className="pr-8">
            <DialogTitle>Hóa đơn thanh toán</DialogTitle>
            <DialogDescription>
              Chọn hóa đơn bên trái để xem biên lai chi tiết.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(16rem,0.9fr)_minmax(0,1.2fr)]">
          <aside className="min-h-0 overflow-y-auto border-b border-[#E5E5E0] bg-[#FAFAF5] p-4 md:border-r md:border-b-0 sm:p-5">
            <InvoiceListPanel
              invoices={invoices}
              selectedId={selectedId}
              onSelect={setSelectedId}
              programThumbnailUrl={programThumbnailUrl}
            />
          </aside>

          <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
            <InvoiceDetailPanel
              invoiceId={selectedId}
              programName={programName}
              programThumbnailUrl={programThumbnailUrl}
            />
          </div>
        </div>

        <div className="flex shrink-0 justify-end border-t border-[#E5E5E0] px-5 py-3 sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="border-[#E5E5E0]"
            onClick={() => onOpenChange(false)}
          >
            Đóng
          </Button>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
