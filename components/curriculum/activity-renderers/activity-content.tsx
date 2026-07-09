"use client";

import { useEffect } from "react";

import type { Activity, ResumeState } from "@/lib/api";
import type { ClassSession } from "@/lib/api/entities/class-session";
import { cn } from "@/lib/utils";

import { MaterialActivity } from "./material-activity";
import { SessionActivity } from "./session-activity";

type ActivityContentProps = {
  activity: Activity;
  enrollmentId: string;
  resumeState: ResumeState | null;
  isAlreadyComplete: boolean;
  nextSession?: ClassSession | null;
  onCanCompleteChange?: (canComplete: boolean) => void;
  compact?: boolean;
};

export function ActivityContent({
  activity,
  enrollmentId,
  resumeState,
  isAlreadyComplete,
  nextSession = null,
  onCanCompleteChange,
  compact = false,
}: ActivityContentProps) {
  const isSession =
    activity.activityType === "LiveOnline" || activity.activityType === "Offline";

  useEffect(() => {
    if (isSession) {
      onCanCompleteChange?.(!isAlreadyComplete);
    }
  }, [isAlreadyComplete, isSession, onCanCompleteChange]);

  if (activity.activityType === "SelfPaced") {
    return (
      <MaterialActivity
        activity={activity}
        enrollmentId={enrollmentId}
        resumeState={resumeState}
        isAlreadyComplete={isAlreadyComplete}
        onCanCompleteChange={onCanCompleteChange}
        compact={compact}
        className={compact ? "min-h-0 flex-1" : undefined}
      />
    );
  }

  return (
    <SessionActivity
      activity={activity}
      nextSession={nextSession}
      className={cn(compact && "pb-1")}
    />
  );
}
