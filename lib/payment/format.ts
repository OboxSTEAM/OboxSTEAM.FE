import type { Payment } from "@/lib/api/entities/payment";
import { formatProgramPrice } from "@/lib/programs/constants";

export function formatPaymentDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";

  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatPaymentAmount(payment: Pick<Payment, "amount" | "currency">): string {
  if (payment.currency === "VND") {
    return formatProgramPrice(payment.amount);
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: payment.currency,
  }).format(payment.amount);
}

export function shortenPaymentId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}
