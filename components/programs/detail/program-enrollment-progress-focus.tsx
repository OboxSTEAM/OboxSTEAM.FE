"use client";

import type { ProgramEnrollment } from "@/lib/api/program-enrollments";
import { PROGRAM_ENROLLMENT_STATUS_LABELS } from "@/lib/programs/enrollments";
import { cn } from "@/lib/utils";

import { useProgramEnrollmentLookup } from "./program-enrollment-lookup";

type ProgramEnrollmentProgressFocusProps = {
  variant?: "sidebar" | "hero";
  className?: string;
};

function ProgressBar({
  percent,
  completed,
  className,
}: {
  percent: number;
  completed: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-2.5 overflow-hidden rounded-full bg-[#E5E5E0]",
        className,
      )}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Tiến độ học"
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none",
          completed ? "bg-[#7CB342]" : "bg-[#4FC3F7]",
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function SidebarProgressSkeleton() {
  return (
    <div className="animate-pulse space-y-3 text-center" aria-hidden>
      <div className="mx-auto h-3 w-24 rounded bg-[#E5E5E0]" />
      <div className="mx-auto h-9 w-20 rounded-lg bg-[#E5E5E0]" />
      <div className="h-2.5 rounded-full bg-[#E5E5E0]" />
      <div className="mx-auto h-4 w-16 rounded bg-[#E5E5E0]" />
    </div>
  );
}

function HeroProgressSkeleton() {
  return (
    <div className="animate-pulse space-y-2 rounded-xl border border-[#E5E5E0] bg-white/80 p-4" aria-hidden>
      <div className="flex items-center justify-between gap-3">
        <div className="h-3 w-24 rounded bg-[#E5E5E0]" />
        <div className="h-6 w-12 rounded bg-[#E5E5E0]" />
      </div>
      <div className="h-2 rounded-full bg-[#E5E5E0]" />
    </div>
  );
}

function SidebarProgressContent({ enrollment }: { enrollment: ProgramEnrollment }) {
  const isCompleted = enrollment.status === "Completed";
  const percent = Math.min(100, Math.max(0, enrollment.progressPercent));

  return (
    <div className="text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-[#6B6B6B]">
        Tiến độ học tập
      </p>
      <p className="mt-1 font-heading text-3xl font-extrabold tabular-nums leading-none text-[#2D2D2D]">
        {percent}
        <span className="text-lg font-bold text-[#6B6B6B]">%</span>
      </p>
      <ProgressBar
        percent={percent}
        completed={isCompleted}
        className="mt-4"
      />
      <p
        className={cn(
          "mt-3 text-sm font-semibold",
          isCompleted ? "text-[#7CB342]" : "text-[#4FC3F7]",
        )}
      >
        {PROGRAM_ENROLLMENT_STATUS_LABELS[enrollment.status]}
      </p>
    </div>
  );
}

function HeroProgressContent({ enrollment }: { enrollment: ProgramEnrollment }) {
  const isCompleted = enrollment.status === "Completed";
  const percent = Math.min(100, Math.max(0, enrollment.progressPercent));

  return (
    <div className="rounded-xl border border-[#E5E5E0] bg-white/90 p-4 shadow-sm">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6B6B6B]">
            Tiến độ của bạn
          </p>
          <p
            className={cn(
              "mt-1 text-sm font-semibold",
              isCompleted ? "text-[#7CB342]" : "text-[#4FC3F7]",
            )}
          >
            {PROGRAM_ENROLLMENT_STATUS_LABELS[enrollment.status]}
          </p>
        </div>
        <p className="shrink-0 font-heading text-2xl font-extrabold tabular-nums leading-none text-[#2D2D2D]">
          {percent}
          <span className="text-sm font-bold text-[#6B6B6B]">%</span>
        </p>
      </div>
      <ProgressBar
        percent={percent}
        completed={isCompleted}
        className="mt-3 h-2"
      />
    </div>
  );
}

export function ProgramEnrollmentProgressFocus({
  variant = "sidebar",
  className,
}: ProgramEnrollmentProgressFocusProps) {
  const { enrollment, isLoading } = useProgramEnrollmentLookup();

  if (isLoading) {
    return (
      <div className={className}>
        {variant === "sidebar" ? <SidebarProgressSkeleton /> : <HeroProgressSkeleton />}
      </div>
    );
  }

  if (
    !enrollment ||
    (enrollment.status !== "Active" && enrollment.status !== "Completed")
  ) {
    return null;
  }

  return (
    <div className={className}>
      {variant === "sidebar" ? (
        <SidebarProgressContent enrollment={enrollment} />
      ) : (
        <HeroProgressContent enrollment={enrollment} />
      )}
    </div>
  );
}
