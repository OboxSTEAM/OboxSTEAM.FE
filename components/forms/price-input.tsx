"use client";

import { useEffect, useId, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DEFAULT_QUICK_ADD_AMOUNTS = [
  10_000, 50_000, 100_000, 500_000, 1_000_000,
] as const;

function formatVndGrouped(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  return new Intl.NumberFormat("vi-VN").format(Math.trunc(value));
}

function parseVndDigits(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return 0;
  const next = Number(digits);
  return Number.isFinite(next) ? next : 0;
}

function formatQuickAddLabel(amount: number): string {
  return `+${new Intl.NumberFormat("vi-VN").format(amount)}`;
}

export type PriceInputProps = {
  id?: string;
  name?: string;
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  /** Extra amounts for one-tap add chips. */
  quickAddAmounts?: readonly number[];
};

/**
 * Plaque-style VND price field: grouped digits, trailing “đ”, quick-add chips.
 */
export function PriceInput({
  id: idProp,
  name,
  value,
  onChange,
  onBlur,
  disabled,
  invalid,
  className,
  quickAddAmounts = DEFAULT_QUICK_ADD_AMOUNTS,
}: PriceInputProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [text, setText] = useState(() => formatVndGrouped(value));

  useEffect(() => {
    setText(formatVndGrouped(value));
  }, [value]);

  const commit = (next: number) => {
    const safe = next < 0 ? 0 : Math.trunc(next);
    onChange(safe);
    setText(formatVndGrouped(safe));
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-muted/40 p-3 space-y-2.5",
        invalid && "border-primary",
        disabled && "opacity-70",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-muted-foreground">
          Nhập số tiền
        </span>
        <span className="rounded-md bg-background px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground ring-1 ring-border">
          VND
        </span>
      </div>

      <div className="relative">
        <Input
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          placeholder="0"
          value={text}
          aria-invalid={invalid}
          onChange={(event) => {
            const next = parseVndDigits(event.target.value);
            setText(formatVndGrouped(next));
            onChange(next);
          }}
          onBlur={onBlur}
          className={cn(
            "h-11 rounded-xl border-input bg-card pr-8 text-right font-mono text-base font-semibold tabular-nums tracking-tight text-foreground md:text-base",
            "placeholder:font-sans placeholder:font-normal placeholder:text-muted-foreground",
            "focus-visible:ring-ring/50",
            invalid && "border-primary",
          )}
        />
        <span
          className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-muted-foreground"
          aria-hidden
        >
          đ
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Cộng nhanh học phí">
        {quickAddAmounts.map((amount) => (
          <button
            key={amount}
            type="button"
            disabled={disabled}
            onClick={() => commit((Number.isFinite(value) ? value : 0) + amount)}
            className={cn(
              "h-7 rounded-lg border border-border bg-card px-2 text-[11px] font-semibold tabular-nums text-foreground",
              "transition-colors hover:border-ring hover:bg-background",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              "disabled:pointer-events-none disabled:opacity-50",
              "active:scale-[0.98]",
            )}
          >
            {formatQuickAddLabel(amount)}
          </button>
        ))}
      </div>
    </div>
  );
}
