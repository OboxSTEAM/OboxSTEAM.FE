"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ExpertWorkbenchHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function ExpertWorkbenchHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
  children,
  className,
}: ExpertWorkbenchHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-border bg-card px-4 py-5 sm:px-6 lg:py-6",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_80%_15%,color-mix(in_srgb,var(--primary)_14%,transparent),transparent_62%)]"
      />
      <div className="relative mx-auto flex max-w-[1500px] flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 gap-3.5">
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/8 text-primary shadow-sm">
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                {eyebrow}
              </p>
              <h1 className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-[1.75rem]">
                {title}
              </h1>
              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
              {actions}
            </div>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}

export type ExpertWorkflowStep = {
  label: string;
  /** Shown on hover — keep the rail itself label-only. */
  detail?: string;
  state?: "done" | "current" | "next";
  badge?: ReactNode;
};

type ExpertWorkflowRailProps = {
  steps: ExpertWorkflowStep[];
  /** Animate progress fill toward the current step (workspace entry / tab change). */
  animate?: boolean;
  /** When set, steps act as navigation controls (e.g. workspace tabs). */
  onStepSelect?: (index: number) => void;
  className?: string;
};

function resolveCurrentIndex(steps: ExpertWorkflowStep[]): number {
  const current = steps.findIndex((step) => step.state === "current");
  if (current >= 0) return current;
  let lastDone = -1;
  for (let i = 0; i < steps.length; i += 1) {
    if (steps[i]?.state === "done") lastDone = i;
  }
  return Math.max(0, lastDone);
}

function WorkflowStepContent({
  index,
  label,
  state,
  badge,
}: {
  index: number;
  label: string;
  state: "done" | "current" | "next";
  badge?: ReactNode;
}) {
  return (
    <>
      <span
        className={cn(
          "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold motion-safe:transition-[transform,background-color,border-color,color,box-shadow] motion-safe:duration-300 motion-reduce:transition-none",
          state === "current" &&
            "scale-110 border-primary bg-primary text-primary-foreground shadow-[0_0_0_4px_color-mix(in_srgb,var(--primary)_18%,transparent)]",
          state === "done" && "border-emerald-600 bg-emerald-600 text-white",
          state === "next" && "border-border bg-card text-muted-foreground",
        )}
      >
        {index + 1}
      </span>
      <span className="min-w-0 text-center">
        <span
          className={cn(
            "block text-xs font-bold sm:text-sm",
            state === "current" ? "text-primary" : "text-foreground",
          )}
        >
          {label}
        </span>
        {badge ? (
          <span className="mt-1 inline-flex justify-center">{badge}</span>
        ) : null}
      </span>
    </>
  );
}

export function ExpertWorkflowRail({
  steps,
  animate = false,
  onStepSelect,
  className,
}: ExpertWorkflowRailProps) {
  const currentIndex = resolveCurrentIndex(steps);
  const segmentCount = Math.max(1, steps.length - 1);
  const targetProgress = currentIndex / segmentCount;
  const [progress, setProgress] = useState(animate ? 0 : targetProgress);
  const isInteractive = typeof onStepSelect === "function";

  useEffect(() => {
    if (!animate) {
      setProgress(targetProgress);
      return;
    }

    setProgress(0);
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setProgress(targetProgress));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [animate, targetProgress, currentIndex]);

  return (
    <nav aria-label="Tiến trình công việc" className={cn("w-full", className)}>
      <ol
        className={cn(
          "relative grid w-full gap-3",
          steps.length <= 2 && "grid-cols-2",
          steps.length === 3 && "grid-cols-3",
          steps.length >= 4 && "grid-cols-2 sm:grid-cols-4",
        )}
        role={isInteractive ? "tablist" : undefined}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-3.5 right-[12.5%] left-[12.5%] hidden h-0.5 overflow-hidden rounded-full bg-border sm:block"
        >
          <div
            className="h-full origin-left rounded-full bg-emerald-600 motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
            style={{ width: `${Math.min(1, Math.max(0, progress)) * 100}%` }}
          />
        </div>

        {steps.map((step, index) => {
          const state =
            step.state ??
            (index < currentIndex
              ? "done"
              : index === currentIndex
                ? "current"
                : "next");

          const stepBody = (
            <WorkflowStepContent
              index={index}
              label={step.label}
              state={state}
              badge={step.badge}
            />
          );

          const sharedClass = cn(
            "relative flex w-full flex-col items-center gap-2 rounded-xl px-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            isInteractive && "cursor-pointer",
            !isInteractive && step.detail && "cursor-help",
          );

          const control = isInteractive ? (
            <button
              type="button"
              role="tab"
              aria-selected={state === "current"}
              aria-current={state === "current" ? "step" : undefined}
              onClick={() => onStepSelect(index)}
              className={sharedClass}
            >
              {stepBody}
            </button>
          ) : (
            <div
              className={sharedClass}
              aria-current={state === "current" ? "step" : undefined}
            >
              {stepBody}
            </div>
          );

          return (
            <li key={`${index}-${step.label}`} className="min-w-0">
              {step.detail ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      isInteractive ? (
                        <button
                          type="button"
                          role="tab"
                          aria-selected={state === "current"}
                          aria-current={state === "current" ? "step" : undefined}
                          onClick={() => onStepSelect?.(index)}
                          className={sharedClass}
                        />
                      ) : (
                        <div
                          className={sharedClass}
                          aria-current={
                            state === "current" ? "step" : undefined
                          }
                        />
                      )
                    }
                  >
                    {stepBody}
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="max-w-56 text-left leading-5"
                  >
                    {step.detail}
                  </TooltipContent>
                </Tooltip>
              ) : (
                control
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
