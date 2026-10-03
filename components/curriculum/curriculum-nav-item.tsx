"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, Circle, Lock } from "lucide-react";

import { ExpertAvatarGroup } from "@/components/experts/expert-avatar-group";
import type { ActivityNavStatus } from "@/lib/api";
import {
  ACTIVITY_TITLE_PREFIX,
  ACTIVITY_TYPE_LABELS,
} from "@/lib/curriculum/constants";
import type { CoTeachExpertFace } from "@/lib/curriculum/coteach-experts";
import { cn } from "@/lib/utils";

type CurriculumNavItemProps = {
  activityId: string;
  activityName: string;
  activityType: keyof typeof ACTIVITY_TYPE_LABELS;
  status: ActivityNavStatus;
  isSelected: boolean;
  onSelect: (activityId: string) => void;
  /** When nested under a course/milestone tree branch */
  inTree?: boolean;
  coTeachExperts?: CoTeachExpertFace[];
  onOpenExpert?: (expert: CoTeachExpertFace) => void;
};

function StatusIcon({ status }: { status: ActivityNavStatus }) {
  if (status === "completed") {
    return (
      <CheckCircle2
        className="size-4 shrink-0 text-learn-success"
        aria-hidden
      />
    );
  }
  if (status === "locked") {
    return (
      <Lock className="size-4 shrink-0 text-learn-faint/70" aria-hidden />
    );
  }
  if (status === "current") {
    return (
      <span
        className="size-2.5 shrink-0 rounded-full bg-learn-accent"
        aria-hidden
      />
    );
  }
  return <Circle className="size-4 shrink-0 text-learn-faint" aria-hidden />;
}

export function CurriculumNavItem({
  activityId,
  activityName,
  activityType,
  status,
  isSelected,
  onSelect,
  inTree = false,
  coTeachExperts = [],
  onOpenExpert,
}: CurriculumNavItemProps) {
  const rowRef = useRef<HTMLButtonElement>(null);
  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  const prefix = ACTIVITY_TITLE_PREFIX[activityType];

  useEffect(() => {
    if (isSelected) {
      rowRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isSelected]);

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-lg",
        isSelected && "bg-learn-surface",
      )}
    >
      <button
        ref={rowRef}
        type="button"
        disabled={isLocked}
        onClick={() => onSelect(activityId)}
        className={cn(
          "flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-lg text-left text-sm transition-colors",
          inTree ? "px-2 py-2" : "px-3 py-2.5",
          isLocked && "cursor-not-allowed opacity-50",
          isSelected && "font-medium text-learn-text-strong",
          isCompleted && !isSelected && "text-learn-muted",
        )}
        aria-current={isSelected ? "page" : undefined}
      >
        <StatusIcon status={status} />
        <span className="min-w-0 leading-snug">
          <span className="text-learn-faint">{prefix}: </span>
          {activityName}
        </span>
      </button>
      {coTeachExperts.length > 0 ? (
        <ExpertAvatarGroup
          people={coTeachExperts.map((expert) => ({
            id: expert.expertId,
            name: expert.fullName,
            avatarUrl: expert.avatarUrl,
          }))}
          ringClassName="ring-learn-surface"
          className="mr-1 shrink-0"
          onPersonClick={(expertId) => {
            const expert = coTeachExperts.find((item) => item.expertId === expertId);
            if (expert) onOpenExpert?.(expert);
          }}
        />
      ) : null}
    </div>
  );
}
