"use client";

import { useEffect, useState } from "react";

import { PaymentInvoiceCard } from "@/components/payment/payment-invoice-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getInvoiceById, getPaymentById, type Invoice, type Payment } from "@/lib/api";
import { formatProgramPrice } from "@/lib/programs/constants";
import { formatPaymentDateTime } from "@/lib/payment/format";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { SITE } from "@/lib/landing/content";
import Image from "next/image";
import { cn } from "@/lib/utils";

type InvoiceReceiptDialogProps = {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function InvoiceFallbackCard({ invoice }: { invoice: Invoice }) {
  const amountLabel =
    invoice.currency === "VND" || !invoice.currency
      ? formatProgramPrice(invoice.totalAmount)
      : new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: invoice.currency,
        }).format(invoice.totalAmount);

  return (
    <article className="overflow-hidden rounded-2xl border border-[#E5E5E0] bg-white shadow-[0_8px_32px_rgba(45,45,45,0.06)]">
      <header className="border-b border-[#E5E5E0] bg-[#FAFAF5] px-6 py-5 sm:px-8">
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
      <div className="space-y-3 px-6 py-5 sm:px-8">
        <p className="text-sm text-[#2D2D2D]">
          <span className="text-xs uppercase text-[#6B6B6B]">Mã hóa đơn · </span>
          <span className="font-mono">
            {invoice.invoiceNumber ?? invoice.id.slice(0, 8)}
          </span>
        </p>
        {invoice.itemDescription ? (
          <p className="text-sm text-[#6B6B6B]">{invoice.itemDescription}</p>
        ) : null}
        <p className="text-xs text-[#6B6B6B]">
          Ngày tạo {formatPaymentDateTime(invoice.createdAt)}
        </p>
      </div>
      <div className="border-t border-[#E5E5E0] bg-[#FAFAF5] px-6 py-5 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-wide text-[#6B6B6B]">
          Tổng thanh toán
        </p>
        <p className="font-heading mt-1 text-3xl font-extrabold tabular-nums text-[#E94B3C]">
          {amountLabel}
        </p>
      </div>
    </article>
  );
}

export function InvoiceReceiptDialog({
  invoiceId,
  open,
  onOpenChange,
}: InvoiceReceiptDialogProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );

  useEffect(() => {
    if (!open || !invoiceId) {
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
  }, [invoiceId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className={cn("max-w-lg gap-0 overflow-hidden p-0")}>
        <div className="border-b border-[#E5E5E0] px-6 py-4">
          <DialogHeader>
            <DialogTitle>Chi tiết hóa đơn</DialogTitle>
            <DialogDescription>
              Biên lai thanh toán chương trình / học lại module.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="max-h-[min(80dvh,40rem)] overflow-y-auto px-4 py-4 sm:px-6">
          {loadState === "loading" || loadState === "idle" ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          ) : loadState === "error" || !invoice ? (
            <div className="rounded-2xl border border-[#E5E5E0] px-4 py-8 text-center">
              <p className="text-sm text-[#6B6B6B]">Không tải được hóa đơn.</p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => onOpenChange(false)}
              >
                Đóng
              </Button>
            </div>
          ) : payment ? (
            <PaymentInvoiceCard payment={payment} />
          ) : (
            <InvoiceFallbackCard invoice={invoice} />
          )}
        </div>
      </DialogPopup>
    </Dialog>
  );
}
