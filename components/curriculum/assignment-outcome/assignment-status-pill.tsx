"use client";

import { CheckCircle2, Hourglass, RotateCcw, XCircle, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type AssignmentStatusTone = "info" | "success" | "warn";

const TONE_STYLES: Record<AssignmentStatusTone, string> = {
  info: "bg-learn-accent/10 text-learn-accent",
  success: "bg-learn-success/15 text-learn-success",
  warn: "bg-learn-primary/10 text-learn-primary",
};

type AssignmentStatusPillProps = {
  tone: AssignmentStatusTone;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
};

export function AssignmentStatusPill({
  tone,
  icon: Icon,
  children,
  className,
}: AssignmentStatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
        TONE_STYLES[tone],
        className,
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {children}
    </span>
  );
}

export function getPassFailTone(passed: boolean): AssignmentStatusTone {
  return passed ? "success" : "warn";
}

export function getPassFailIcon(passed: boolean) {
  return passed ? CheckCircle2 : XCircle;
}

export function getPassFailPillLabel(passed: boolean): string {
  return passed ? "Đạt" : "Chưa đạt";
}

export function getPassFailTitle(passed: boolean): string {
  return passed ? "Đã đạt yêu cầu" : "Chưa đạt yêu cầu";
}

export { Hourglass, RotateCcw };
