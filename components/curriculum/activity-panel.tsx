"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  completeActivity,
  getActivityById,
  type EnrollmentCurriculum,
} from "@/lib/api";
import type { CompleteActivitySource } from "@/lib/validations/program-enrollments";
import { ACTIVITY_TYPE_LABELS } from "@/lib/curriculum/constants";
import {
  findFlatActivity,
  getActivityBreadcrumb,
  getAdjacentActivityIds,
  isActivitySelectable,
} from "@/lib/curriculum/helpers";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";

import { cn } from "@/lib/utils";

import { ActivityContent } from "./activity-renderers/activity-content";

type ActivityPanelProps = {
  curriculum: EnrollmentCurriculum;
  selectedActivityId: string | null;
  onSelectActivity: (activityId: string) => void;
  onCurriculumRefresh: () => Promise<void>;
};

function resolveCompleteSource(
  activityType: string,
  materialType: string | null | undefined,
): CompleteActivitySource {
  if (activityType !== "SelfPaced") return "manual";
  if (materialType?.toLowerCase() === "video") return "video";
  if (materialType) return "reading";
  return "manual";
}

function ActivityPanelSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-learn-border bg-learn-surface p-5 shadow-[0_4px_20px_rgba(45,45,45,0.04)]">
      <Skeleton className="h-3 w-32 bg-learn-surface-2" />
      <Skeleton className="mt-3 h-6 w-2/3 bg-learn-surface-2" />
      <Skeleton className="mt-4 min-h-0 flex-1 rounded-xl bg-learn-surface-2" />
    </div>
  );
}

function isMediaFocusedActivity(activity: {
  activityType: string;
  material?: { materialType: string } | null;
}): boolean {
  if (activity.activityType !== "SelfPaced") return false;
  const materialType = activity.material?.materialType?.toLowerCase();
  return materialType === "video" || materialType === "pdf" || Boolean(materialType);
}

export function ActivityPanel({
  curriculum,
  selectedActivityId,
  onSelectActivity,
  onCurriculumRefresh,
}: ActivityPanelProps) {
  const [canComplete, setCanComplete] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    setCanComplete(false);
  }, [selectedActivityId]);

  const flatActivity = useMemo(
    () => (selectedActivityId ? findFlatActivity(curriculum, selectedActivityId) : null),
    [curriculum, selectedActivityId],
  );

  const breadcrumb = useMemo(
    () =>
      selectedActivityId ? getActivityBreadcrumb(curriculum, selectedActivityId) : null,
    [curriculum, selectedActivityId],
  );

  const { previousId, nextId } = useMemo(
    () =>
      selectedActivityId
        ? getAdjacentActivityIds(curriculum, selectedActivityId)
        : { previousId: null, nextId: null },
    [curriculum, selectedActivityId],
  );

  const {
    data: activityResult,
    isLoading,
    hasError,
    markLoading,
    retry,
  } = useClientFetch({
    enabled: Boolean(selectedActivityId && flatActivity && isActivitySelectable(flatActivity.status)),
    fetcher: async () => {
      if (!selectedActivityId) return null;
      return getActivityById(selectedActivityId, {
        programEnrollmentId: curriculum.enrollmentId,
      });
    },
    deps: [selectedActivityId, curriculum.enrollmentId],
    onError: (error) => {
      showAppErrorFromUnknown(error, "generic");
    },
  });

  const activity = activityResult?.data ?? null;

  const isAlreadyComplete =
    flatActivity?.status === "completed" ||
    activity?.learningProgress?.activityStatus === "Done";

  const handleComplete = useCallback(async () => {
    if (!selectedActivityId || !activity || !canComplete || isAlreadyComplete) return;

    setIsCompleting(true);
    try {
      const result = await completeActivity(curriculum.enrollmentId, selectedActivityId, {
        source: resolveCompleteSource(
          activity.activityType,
          activity.material?.materialType,
        ),
      });

      showAppSuccess({
        title: "Đã hoàn thành hoạt động",
        description: "Tiến độ học tập đã được cập nhật.",
      });

      await onCurriculumRefresh();

      const nextActivityId = result?.data.nextActivityId ?? null;
      if (nextActivityId) {
        onSelectActivity(nextActivityId);
      }
    } catch (error) {
      showAppErrorFromUnknown(error, "generic");
    } finally {
      setIsCompleting(false);
    }
  }, [
    activity,
    canComplete,
    curriculum.enrollmentId,
    isAlreadyComplete,
    onCurriculumRefresh,
    onSelectActivity,
    selectedActivityId,
  ]);

  if (!selectedActivityId) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-learn-border bg-learn-surface p-8 text-center shadow-[0_4px_20px_rgba(45,45,45,0.04)]">
        <p className="text-sm text-learn-muted">Chọn một hoạt động từ danh sách bên trái.</p>
      </div>
    );
  }

  if (flatActivity && !isActivitySelectable(flatActivity.status)) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-learn-border bg-learn-surface p-8 text-center shadow-[0_4px_20px_rgba(45,45,45,0.04)]">
        <p className="text-sm text-learn-muted">
          Hoạt động này chưa mở khóa. Hoàn thành các bài trước để tiếp tục.
        </p>
      </div>
    );
  }

  if (isLoading && !activity) {
    return <ActivityPanelSkeleton />;
  }

  if (hasError && !activity) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-learn-border bg-learn-surface p-8 text-center shadow-[0_4px_20px_rgba(45,45,45,0.04)]">
        <p className="text-sm text-learn-muted">Không tải được nội dung hoạt động.</p>
        <Button type="button" variant="outline" className="mt-4 border-learn-border" onClick={retry}>
          Thử lại
        </Button>
      </div>
    );
  }

  if (!activity) {
    return <ActivityPanelSkeleton />;
  }

  const resumeState =
    activity.learningProgress?.resumeState ?? flatActivity?.resumeState ?? null;

  const mediaFocused = isMediaFocusedActivity(activity);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-learn-border bg-learn-surface shadow-[0_4px_20px_rgba(45,45,45,0.04)]">
      <div className="shrink-0 px-4 py-3 sm:px-5">
        {breadcrumb ? (
          <p className="text-xs text-learn-muted">
            {breadcrumb.moduleName}
            {breadcrumb.groupLabel ? ` · ${breadcrumb.groupLabel}` : null}
          </p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="font-heading min-w-0 flex-1 text-lg font-semibold text-learn-text-strong sm:text-xl">
            {activity.name}
          </h1>
          <Badge variant="secondary" className="bg-learn-surface-2 text-learn-muted">
            {ACTIVITY_TYPE_LABELS[activity.activityType]}
          </Badge>
        </div>
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col px-4 pb-3 sm:px-5",
          mediaFocused ? "overflow-hidden" : "overflow-y-auto",
        )}
      >
        <ActivityContent
          key={`${activity.id}-${activityResult?.code ?? "loaded"}`}
          activity={activity}
          enrollmentId={curriculum.enrollmentId}
          resumeState={resumeState}
          isAlreadyComplete={isAlreadyComplete}
          onCanCompleteChange={setCanComplete}
          compact
        />
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-learn-border px-4 py-2.5 sm:px-5">
        <Button
          type="button"
          variant="ghost"
          disabled={!previousId}
          onClick={() => {
            if (previousId) {
              markLoading();
              onSelectActivity(previousId);
            }
          }}
        >
          Bài trước
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {isAlreadyComplete ? (
            <span className="text-sm font-medium text-learn-success">Đã hoàn thành</span>
          ) : (
            <Button
              type="button"
              className="bg-learn-primary text-white hover:bg-learn-primary/90"
              disabled={!canComplete || isCompleting}
              onClick={() => void handleComplete()}
            >
              {isCompleting ? "Đang lưu..." : "Hoàn thành & Tiếp tục"}
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            className="border-learn-border"
            disabled={!nextId}
            onClick={() => {
              if (nextId) {
                markLoading();
                onSelectActivity(nextId);
              }
            }}
          >
            Bài tiếp theo
          </Button>
        </div>
      </div>
    </div>
  );
}
