"use client";

import { useEffect } from "react";

import type { Activity, ResumeState } from "@/lib/api";

import { MaterialActivity } from "./material-activity";
import { SessionActivity } from "./session-activity";

type ActivityContentProps = {
  activity: Activity;
  enrollmentId: string;
  resumeState: ResumeState | null;
  isAlreadyComplete: boolean;
  onCanCompleteChange?: (canComplete: boolean) => void;
};

export function ActivityContent({
  activity,
  enrollmentId,
  resumeState,
  isAlreadyComplete,
  onCanCompleteChange,
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
      />
    );
  }

  return <SessionActivity activity={activity} />;
}
