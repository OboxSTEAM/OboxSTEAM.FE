"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, Circle, Lock } from "lucide-react";

import type { ActivityNavStatus } from "@/lib/api";
import {
  ACTIVITY_TITLE_PREFIX,
  ACTIVITY_TYPE_LABELS,
} from "@/lib/curriculum/constants";
import { cn } from "@/lib/utils";

type CurriculumNavItemProps = {
  activityId: string;
  activityName: string;
  activityType: keyof typeof ACTIVITY_TYPE_LABELS;
  status: ActivityNavStatus;
  isSelected: boolean;
  onSelect: (activityId: string) => void;
};

function StatusIcon({ status }: { status: ActivityNavStatus }) {
  if (status === "completed") {
    return <CheckCircle2 className="size-4 shrink-0 text-[#7CB342]" aria-hidden />;
  }
  if (status === "locked") {
    return <Lock className="size-4 shrink-0 text-[#6B6B6B]/60" aria-hidden />;
  }
  if (status === "current") {
    return (
      <span
        className="size-2.5 shrink-0 rounded-full bg-[#4FC3F7]"
        aria-hidden
      />
    );
  }
  return <Circle className="size-4 shrink-0 text-[#6B6B6B]" aria-hidden />;
}

export function CurriculumNavItem({
  activityId,
  activityName,
  activityType,
  status,
  isSelected,
  onSelect,
}: CurriculumNavItemProps) {
  const rowRef = useRef<HTMLButtonElement>(null);
  const isLocked = status === "locked";
  const prefix = ACTIVITY_TITLE_PREFIX[activityType];

  useEffect(() => {
    if (isSelected) {
      rowRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isSelected]);

  return (
    <button
      ref={rowRef}
      type="button"
      disabled={isLocked}
      onClick={() => onSelect(activityId)}
      className={cn(
        "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
        isLocked && "cursor-not-allowed opacity-60",
        isSelected && "border-l-2 border-[#4FC3F7] bg-[#F5F5F0] font-medium text-[#2D2D2D]",
        !isSelected && !isLocked && "hover:bg-[#FAFAF5]",
      )}
      aria-current={isSelected ? "page" : undefined}
    >
      <StatusIcon status={status} />
      <span className="min-w-0 leading-snug">
        <span className="text-[#6B6B6B]">{prefix}: </span>
        {activityName}
      </span>
    </button>
  );
}
