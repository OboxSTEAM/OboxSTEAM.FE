"use client";

import { Clock } from "lucide-react";

import { useHoldCountdown } from "@/hooks/use-hold-countdown";
import { cn } from "@/lib/utils";

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

  return (
    <p
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium tabular-nums",
        isExpired ? "text-[#a82a1e]" : "text-[#6B6B6B]",
        className,
      )}
      role="timer"
      aria-live="polite"
    >
      <Clock className="size-3.5 shrink-0" aria-hidden />
      {isExpired
        ? "Ghế/link đã hết hạn — chọn lớp và thử lại."
        : `Ghế/link hết hạn sau ${label}`}
    </p>
  );
}
