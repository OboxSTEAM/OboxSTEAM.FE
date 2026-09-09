"use client";

import { useEffect, useRef, type InputHTMLAttributes, type ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  generateEntityCode,
  isShortEntityName,
  type EntityCodePrefix,
} from "@/lib/curriculum/entity-code";

/* ─── Shared field chrome (curriculum detail panels) ───────────────────────── */

export const CURRICULUM_IN =
  "h-9 rounded-lg border text-sm font-normal outline-none px-3 w-full transition-colors focus:ring-1 focus:ring-ring/50 bg-card";

export const CURRICULUM_IN_COMPACT =
  "h-8 w-[4.75rem] rounded-md border text-xs font-mono tabular-nums outline-none px-2 transition-colors focus:ring-1 focus:ring-ring/50 bg-card";

export const CURRICULUM_TEXTAREA =
  "w-full text-sm p-3 rounded-lg border outline-none resize-none bg-card focus:ring-1 focus:ring-ring/50";

const W = {
  border: "var(--border)",
  textStrong: "var(--foreground)",
  muted: "var(--muted-foreground)",
  faint: "var(--muted-foreground)",
  primary: "var(--primary)",
} as const;

function FieldError({ msg }: { msg?: string }) {
  return msg ? (
    <p className="mt-1 text-xs font-semibold" style={{ color: W.primary }}>
      {msg}
    </p>
  ) : null;
}

type NameWithAutoCodeProps = {
  nameLabel: string;
  codeLabel: string;
  codePrefix: EntityCodePrefix;
  name: string;
  code: string;
  /** When true, mã stays frozen (edit mode). */
  lockCode: boolean;
  onNameChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  nameError?: string;
  disabled?: boolean;
  namePlaceholder?: string;
  nameInputProps?: Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "disabled" | "placeholder"
  >;
};

/**
 * Primary name + auto-generated mã.
 * Short names: mã sits beside the name on one aligned row.
 * Longer names: mã stacks below.
 */
export function NameWithAutoCode({
  nameLabel,
  codeLabel,
  codePrefix,
  name,
  code,
  lockCode,
  onNameChange,
  onCodeChange,
  nameError,
  disabled = false,
  namePlaceholder,
  nameInputProps,
}: NameWithAutoCodeProps) {
  const onCodeChangeRef = useRef(onCodeChange);
  onCodeChangeRef.current = onCodeChange;

  useEffect(() => {
    if (lockCode || disabled) return;
    onCodeChangeRef.current(generateEntityCode(codePrefix, name));
  }, [name, lockCode, disabled, codePrefix]);

  const sideBySide = isShortEntityName(name);
  const displayCode = code || generateEntityCode(codePrefix, name);
  const hint = lockCode ? "Mã đã lưu — không đổi khi sửa tên" : "Tự tạo từ tên";

  const nameField = (
    <>
      <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
        {nameLabel} <span style={{ color: W.primary }}>*</span>
      </Label>
      <input
        type="text"
        value={name}
        placeholder={namePlaceholder}
        disabled={disabled}
        onChange={(e) => onNameChange(e.target.value)}
        className={cn(CURRICULUM_IN, disabled && "opacity-70")}
        style={{ borderColor: nameError ? W.primary : W.border }}
        {...nameInputProps}
      />
      <FieldError msg={nameError} />
    </>
  );

  const codeField = (
    <>
      <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
        {codeLabel}
      </Label>
      <div
        className={cn(
          "flex h-9 min-w-0 items-center truncate rounded-lg border border-dashed px-3 font-mono text-sm tabular-nums",
          disabled && "opacity-70",
        )}
        style={{ borderColor: W.border, color: W.muted, background: "var(--muted)" }}
        title={displayCode}
      >
        {displayCode}
      </div>
      <p className="text-[11px] leading-snug" style={{ color: W.faint }}>
        {hint}
      </p>
    </>
  );

  if (sideBySide) {
    return (
      <div className="grid grid-cols-1 items-start gap-x-3 gap-y-1.5 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)]">
        <Label className="text-sm font-semibold sm:col-start-1 sm:row-start-1" style={{ color: W.textStrong }}>
          {nameLabel} <span style={{ color: W.primary }}>*</span>
        </Label>
        <Label className="text-sm font-semibold sm:col-start-2 sm:row-start-1" style={{ color: W.textStrong }}>
          {codeLabel}
        </Label>
        <input
          type="text"
          value={name}
          placeholder={namePlaceholder}
          disabled={disabled}
          onChange={(e) => onNameChange(e.target.value)}
          className={cn(CURRICULUM_IN, "sm:col-start-1 sm:row-start-2", disabled && "opacity-70")}
          style={{ borderColor: nameError ? W.primary : W.border }}
          {...nameInputProps}
        />
        <div
          className={cn(
            "flex h-9 min-w-0 items-center truncate rounded-lg border border-dashed px-3 font-mono text-sm tabular-nums sm:col-start-2 sm:row-start-2",
            disabled && "opacity-70",
          )}
          style={{ borderColor: W.border, color: W.muted, background: "var(--muted)" }}
          title={displayCode}
        >
          {displayCode}
        </div>
        <div className="min-h-[1rem] sm:col-start-1 sm:row-start-3">
          <FieldError msg={nameError} />
        </div>
        <p className="text-[11px] leading-snug sm:col-start-2 sm:row-start-3" style={{ color: W.faint }}>
          {hint}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-1.5">{nameField}</div>
      <div className="space-y-1.5">{codeField}</div>
    </div>
  );
}

type CompactNumberFieldProps = {
  label: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  /** Stretch input to the parent column (metric grids). */
  fill?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type">;

/** Narrow mono number control for points, attempts, duration, counts. */
export function CompactNumberField({
  label,
  error,
  required,
  className,
  disabled,
  fill = false,
  ...inputProps
}: CompactNumberFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
        {label}
        {required ? <span style={{ color: W.primary }}> *</span> : null}
      </Label>
      <input
        type="number"
        disabled={disabled}
        className={cn(
          CURRICULUM_IN_COMPACT,
          fill && "w-full max-w-none",
          disabled && "opacity-70",
          error && "border-primary",
        )}
        style={{ borderColor: error ? W.primary : W.border }}
        {...inputProps}
      />
      <FieldError msg={error} />
    </div>
  );
}

export type DifficultySplit = {
  easyPercent: number;
  mediumPercent: number;
  hardPercent: number;
};

const DIFFICULTY_PRESETS: {
  id: string;
  label: string;
  split: DifficultySplit;
}[] = [
  {
    id: "balanced",
    label: "Cân bằng",
    split: { easyPercent: 40, mediumPercent: 40, hardPercent: 20 },
  },
  {
    id: "easy",
    label: "Thiên dễ",
    split: { easyPercent: 60, mediumPercent: 30, hardPercent: 10 },
  },
  {
    id: "hard",
    label: "Thiên khó",
    split: { easyPercent: 20, mediumPercent: 30, hardPercent: 50 },
  },
];

export const DEFAULT_QUIZ_DIFFICULTY: DifficultySplit = DIFFICULTY_PRESETS[0]!.split;

function clampPct(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Keep total 100 when one bucket changes — redistribute the rest proportionally. */
export function redistributeDifficulty(
  current: DifficultySplit,
  key: keyof DifficultySplit,
  nextValue: number,
): DifficultySplit {
  const v = clampPct(nextValue);
  const others = (["easyPercent", "mediumPercent", "hardPercent"] as const).filter(
    (k) => k !== key,
  );
  const remain = 100 - v;
  const a = others[0]!;
  const b = others[1]!;
  const sum = current[a] + current[b] || 1;
  const nextA = Math.round((current[a] / sum) * remain);
  const nextB = remain - nextA;
  return { ...current, [key]: v, [a]: nextA, [b]: nextB };
}

type QuizDifficultyControlProps = {
  value: DifficultySplit;
  onChange: (next: DifficultySplit) => void;
  disabled?: boolean;
  error?: string;
};

/** Presets + full-width stacked bar + % fields centered under the bar. */
export function QuizDifficultyControl({
  value,
  onChange,
  disabled = false,
  error,
}: QuizDifficultyControlProps) {
  const total = value.easyPercent + value.mediumPercent + value.hardPercent;
  const activePreset = DIFFICULTY_PRESETS.find(
    (p) =>
      p.split.easyPercent === value.easyPercent &&
      p.split.mediumPercent === value.mediumPercent &&
      p.split.hardPercent === value.hardPercent,
  );

  const buckets = [
    { key: "easyPercent" as const, label: "Dễ", color: "#7cb342" },
    { key: "mediumPercent" as const, label: "TB", color: "#f59e0b" },
    { key: "hardPercent" as const, label: "Khó", color: "#E94B3C" },
  ] as const;

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
        Tỉ lệ độ khó
      </Label>

      <div className="flex justify-center">
        <div className="inline-flex w-full max-w-lg flex-wrap justify-center gap-2.5">
          {DIFFICULTY_PRESETS.map((preset) => {
            const active = activePreset?.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange(preset.split)}
                className={cn(
                  "min-w-[7.5rem] flex-1 rounded-lg border px-3.5 py-2.5 text-center text-sm font-semibold transition-colors sm:flex-none",
                  disabled && "opacity-70",
                  active
                    ? "border-[color:color-mix(in_srgb,#4fc3f7_45%,transparent)] bg-[color:color-mix(in_srgb,#4fc3f7_14%,transparent)] text-[#0d6e9c]"
                    : "border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {preset.label}
                <span className="mt-1 block font-mono text-xs font-normal tabular-nums opacity-80">
                  {preset.split.easyPercent}/{preset.split.mediumPercent}/
                  {preset.split.hardPercent}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div
          className="flex h-5 w-full overflow-hidden rounded-full border"
          style={{ borderColor: W.border }}
          aria-hidden
        >
          {buckets.map((item) => (
            <span
              key={item.key}
              className="h-full transition-[width] duration-150"
              style={{ width: `${value[item.key]}%`, background: item.color }}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {buckets.map((item) => (
            <div key={item.key} className="flex flex-col items-center gap-2 text-center">
              <p className="text-sm font-semibold" style={{ color: item.color }}>
                {item.label}
              </p>
              <div className="flex items-center justify-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  disabled={disabled}
                  value={value[item.key]}
                  onChange={(e) =>
                    onChange(
                      redistributeDifficulty(value, item.key, Number(e.target.value)),
                    )
                  }
                  className={cn(
                    CURRICULUM_IN,
                    "w-[4.75rem] px-2 text-center font-mono tabular-nums",
                    disabled && "opacity-70",
                  )}
                  style={{
                    borderColor: total === 100 ? W.border : W.primary,
                    color: item.color,
                  }}
                  aria-label={`Phần trăm ${item.label}`}
                />
                <span className="text-sm font-semibold" style={{ color: item.color }}>
                  %
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <FieldError msg={error} />
    </div>
  );
}
