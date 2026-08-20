import { cn } from "@/lib/utils";

import { clampProgressPercent } from "@/lib/parent/progression";

type ParentProgressBarProps = {
  percent: number;
  completed?: boolean;
  className?: string;
  trackClassName?: string;
  "aria-label"?: string;
};

export function ParentProgressBar({
  percent,
  completed = false,
  className,
  trackClassName,
  "aria-label": ariaLabel = "Tiến độ học",
}: ParentProgressBarProps) {
  const value = clampProgressPercent(percent);

  return (
    <div
      className={cn("h-2.5 overflow-hidden rounded-full bg-[#E5E5E0]", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none",
          completed ? "bg-[#7CB342]" : "bg-[#4FC3F7]",
          trackClassName,
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
