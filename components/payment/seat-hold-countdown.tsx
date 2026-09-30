"use client";

import { Clock } from "lucide-react";

import { useHoldCountdown } from "@/hooks/use-hold-countdown";
import { cn } from "@/lib/utils";

const URGENT_THRESHOLD_MS = 60_000;

type SeatHoldCountdownProps = {
  holdExpiresAt: string | null | undefined;
  className?: string;
};

/** Live 5-minute seat/link hold countdown. */
export function SeatHoldCountdown({
  holdExpiresAt,
  className,
}: SeatHoldCountdownProps) {
  const { remainingMs, isExpired, label } = useHoldCountdown(holdExpiresAt);

  if (!holdExpiresAt) return null;

  const isUrgent = !isExpired && remainingMs <= URGENT_THRESHOLD_MS;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 rounded-xl border px-3.5 py-2",
        isExpired || isUrgent
          ? "border-[#E94B3C]/35 bg-[#FFF0EE] text-[#a82a1e]"
          : "border-[#4FC3F7]/40 bg-[#E8F7FD] text-[#0277BD]",
        className,
      )}
      role="timer"
      // Per-second updates would flood screen readers; announce only expiry.
      aria-live={isExpired ? "polite" : "off"}
      aria-label={
        isExpired ? undefined : `Ghế được giữ thêm ${label} phút`
      }
    >
      <Clock className="size-5 shrink-0" aria-hidden />
      {isExpired ? (
        <span className="text-sm font-semibold">
          Ghế/link đã hết hạn — chọn lớp và thử lại.
        </span>
      ) : (
        <>
          <span className="text-sm font-medium">Giữ ghế còn</span>
          <span className="font-mono text-2xl font-bold leading-none tabular-nums">
            {label}
          </span>
        </>
      )}
    </div>
  );
}
