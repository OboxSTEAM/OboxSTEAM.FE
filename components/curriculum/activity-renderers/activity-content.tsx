"use client";

import type { Activity, ResumeState, SessionAttendanceStatus } from "@/lib/api";
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
  myAttendanceStatus?: SessionAttendanceStatus | null;
  onCanCompleteChange?: (canComplete: boolean) => void;
  compact?: boolean;
};

export function ActivityContent({
  activity,
  enrollmentId,
  resumeState,
  isAlreadyComplete,
  nextSession = null,
  myAttendanceStatus = null,
  onCanCompleteChange,
  compact = false,
}: ActivityContentProps) {
  // Only SelfPaced activities can be marked done by the student.
  // LiveOnline / Offline completion is mentor-owned via điểm danh.
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
      isAlreadyComplete={isAlreadyComplete}
      myAttendanceStatus={myAttendanceStatus}
      className={cn(compact && "pb-1")}
    />
  );
}
