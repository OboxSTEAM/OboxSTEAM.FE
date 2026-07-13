"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  getAssignmentById,
  getRetrospectiveSubmission,
  saveRetrospectiveDraft,
  startRetrospectiveAttempt,
  submitRetrospective,
  type AssignmentDetail,
  type EnrollmentCurriculum,
  type RetrospectiveAttempt,
  type RetrospectiveSubmissionStatus,
} from "@/lib/api";
import { ApiRequestError } from "@/lib/api/errors";
import {
  getAssignmentBreadcrumb,
  isAssignmentSelectable,
  type FlatCurriculumAssignment,
} from "@/lib/curriculum/assignment-helpers";
import {
  ASSIGNMENT_TYPE_LABELS,
  RETROSPECTIVE_DRAFT_SAVE_DEBOUNCE_MS,
} from "@/lib/curriculum/constants";
import {
  clearStoredRetrospectiveSubmissionId,
  getStoredRetrospectiveSubmissionId,
  setStoredRetrospectiveSubmissionId,
} from "@/lib/curriculum/retrospective-storage";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

type RetrospectivePanelProps = {
  curriculum: EnrollmentCurriculum;
  assignmentId: string;
  flatAssignment: FlatCurriculumAssignment;
  onCurriculumRefresh: () => Promise<void>;
};

function isEditableStatus(status: RetrospectiveSubmissionStatus): boolean {
  return status === "Pending" || status === "ReturnedForRevision";
}

function isMissingSubmissionError(error: unknown): boolean {
  return error instanceof ApiRequestError && error.status === 404;
}

function formatTimestamp(value: string | null): string | null {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return null;
  }
}

async function loadRetrospectiveAttempt(
  assignmentId: string,
): Promise<RetrospectiveAttempt> {
  const storedSubmissionId = getStoredRetrospectiveSubmissionId(assignmentId);

  if (storedSubmissionId) {
    try {
      const result = await getRetrospectiveSubmission(storedSubmissionId);
      if (result?.data) {
        return result.data;
      }
    } catch (error) {
      if (!isMissingSubmissionError(error)) {
        throw error;
      }
      clearStoredRetrospectiveSubmissionId(assignmentId);
    }
  }

  const startResult = await startRetrospectiveAttempt(assignmentId);
  const attempt = startResult?.data;
  if (!attempt) {
    throw new Error("Retrospective start response missing data.");
  }

  setStoredRetrospectiveSubmissionId(assignmentId, attempt.submissionId);
  return attempt;
}

function RetrospectivePanelSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-learn-border bg-learn-surface p-5 shadow-[0_4px_20px_rgba(45,45,45,0.04)]">
      <Skeleton className="h-3 w-32 bg-learn-surface-2" />
      <Skeleton className="mt-3 h-6 w-2/3 bg-learn-surface-2" />
      <Skeleton className="mt-4 min-h-0 flex-1 rounded-xl bg-learn-surface-2" />
    </div>
  );
}

function RetrospectiveGradeSummary({ attempt }: { attempt: RetrospectiveAttempt }) {
  const percent =
    attempt.maxPoints > 0 && attempt.assignedGrade != null
      ? Math.round((attempt.assignedGrade / attempt.maxPoints) * 100)
      : null;

  return (
    <div className="rounded-xl border border-learn-border bg-learn-surface-2 p-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-mono text-2xl font-semibold tabular-nums text-learn-text-strong">
          {attempt.assignedGrade ?? "—"}
        </span>
        <span className="text-sm text-learn-muted">/ {attempt.maxPoints}</span>
        {percent != null && attempt.passed != null ? (
          <span
            className={cn(
              "ml-auto rounded-full px-2 py-0.5 text-xs font-medium",
              attempt.passed
                ? "bg-learn-success/15 text-learn-success"
                : "bg-learn-primary/10 text-learn-primary",
            )}
          >
            {attempt.passed ? "Đạt" : "Chưa đạt"} · {percent}%
          </span>
        ) : null}
      </div>
      {attempt.mentorFeedback ? (
        <p className="mt-3 border-t border-learn-border pt-3 text-sm leading-relaxed text-learn-muted">
          <span className="font-medium text-learn-text-strong">Nhận xét: </span>
          {attempt.mentorFeedback}
        </p>
      ) : null}
    </div>
  );
}

export function RetrospectivePanel({
  curriculum,
  assignmentId,
  flatAssignment,
  onCurriculumRefresh,
}: RetrospectivePanelProps) {
  const [attempt, setAttempt] = useState<RetrospectiveAttempt | null>(null);
  const [contentText, setContentText] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingContentRef = useRef<string | null>(null);

  const breadcrumb = useMemo(
    () => getAssignmentBreadcrumb(curriculum, assignmentId),
    [assignmentId, curriculum],
  );

  const resetState = useCallback(() => {
    setAttempt(null);
    setContentText("");
    setLastSavedAt(null);
    setIsSaving(false);
    setIsSubmitting(false);
    setIsConfirmOpen(false);
    pendingContentRef.current = null;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    resetState();
  }, [assignmentId, resetState]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const {
    data: assignmentResult,
    isLoading: isAssignmentLoading,
    hasError: assignmentError,
    retry: retryAssignment,
  } = useClientFetch({
    enabled: isAssignmentSelectable(flatAssignment.status),
    fetcher: async () => getAssignmentById(assignmentId),
    deps: [assignmentId],
    onError: (error) => {
      showAppErrorFromUnknown(error, "generic");
    },
  });

  const assignment: AssignmentDetail | null = assignmentResult?.data ?? null;

  const {
    data: hydratedAttempt,
    isLoading: isAttemptLoading,
    hasError: attemptError,
    retry: retryAttempt,
  } = useClientFetch({
    enabled: isAssignmentSelectable(flatAssignment.status),
    fetcher: async () => loadRetrospectiveAttempt(assignmentId),
    deps: [assignmentId],
    onError: (error) => {
      showAppErrorFromUnknown(error, "generic");
    },
  });

  useEffect(() => {
    if (!hydratedAttempt) return;
    setAttempt(hydratedAttempt);
    setContentText(hydratedAttempt.contentText ?? "");
    setLastSavedAt(hydratedAttempt.lastSavedAt);
  }, [hydratedAttempt]);

  const isEditable = attempt ? isEditableStatus(attempt.status) : false;

  const flushSave = useCallback(async (submissionId: string, text: string) => {
    setIsSaving(true);
    try {
      const result = await saveRetrospectiveDraft(submissionId, { contentText: text });
      setLastSavedAt(result?.data?.lastSavedAt ?? new Date().toISOString());
    } catch (error) {
      showAppErrorFromUnknown(error, "generic");
    } finally {
      setIsSaving(false);
    }
  }, []);

  const scheduleSave = useCallback(
    (submissionId: string, text: string) => {
      pendingContentRef.current = text;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        const pending = pendingContentRef.current;
        if (pending == null) return;
        void flushSave(submissionId, pending);
      }, RETROSPECTIVE_DRAFT_SAVE_DEBOUNCE_MS);
    },
    [flushSave],
  );

  const handleContentChange = useCallback(
    (value: string) => {
      setContentText(value);
      if (!attempt || !isEditable) return;
      scheduleSave(attempt.submissionId, value);
    },
    [attempt, isEditable, scheduleSave],
  );

  const performSubmit = useCallback(async () => {
    if (!attempt) return;

    setIsConfirmOpen(false);

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const trimmed = contentText.trim();
    if (!trimmed) {
      showAppErrorFromUnknown(new Error("Nội dung không được để trống."), "generic");
      return;
    }

    setIsSubmitting(true);
    try {
      if (pendingContentRef.current != null) {
        await flushSave(attempt.submissionId, pendingContentRef.current);
        pendingContentRef.current = null;
      }

      const submitResult = await submitRetrospective(attempt.submissionId, {
        contentText: trimmed,
      });
      const submitted = submitResult?.data;
      if (!submitted) {
        throw new Error("Retrospective submit response missing data.");
      }

      setAttempt(submitted);
      setContentText(submitted.contentText ?? trimmed);
      setStoredRetrospectiveSubmissionId(assignmentId, submitted.submissionId);
      showAppSuccess({
        title: "Đã nộp bài đánh giá",
        description: "Mentor sẽ chấm điểm và phản hồi sớm.",
      });
      await onCurriculumRefresh();
    } catch (error) {
      showAppErrorFromUnknown(error, "generic");
    } finally {
      setIsSubmitting(false);
    }
  }, [assignmentId, attempt, contentText, flushSave, onCurriculumRefresh]);

  if (!isAssignmentSelectable(flatAssignment.status)) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-learn-border bg-learn-surface p-8 text-center shadow-[0_4px_20px_rgba(45,45,45,0.04)]">
        <p className="text-sm text-learn-muted">
          Bài đánh giá này chưa mở khóa. Hoàn thành các bài trước để tiếp tục.
        </p>
      </div>
    );
  }

  if ((isAssignmentLoading && !assignment) || (isAttemptLoading && !attempt)) {
    return <RetrospectivePanelSkeleton />;
  }

  if ((assignmentError && !assignment) || (attemptError && !attempt)) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-learn-border bg-learn-surface p-8 text-center shadow-[0_4px_20px_rgba(45,45,45,0.04)]">
        <p className="text-sm text-learn-muted">Không tải được bài đánh giá.</p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 border-learn-border"
          onClick={() => {
            if (assignmentError) retryAssignment();
            if (attemptError) retryAttempt();
          }}
        >
          Thử lại
        </Button>
      </div>
    );
  }

  if (!assignment || !attempt) {
    return <RetrospectivePanelSkeleton />;
  }

  const savedLabel = formatTimestamp(lastSavedAt);
  const submittedLabel = formatTimestamp(attempt.submittedAt);
  const description =
    assignment.description ||
    attempt.description ||
    "Chia sẻ suy nghĩ, bài học rút ra và cảm nhận của bạn về hoạt động vừa qua.";

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
            {assignment.title}
          </h1>
          <Badge variant="secondary" className="bg-learn-surface-2 text-learn-muted">
            {ASSIGNMENT_TYPE_LABELS.Retrospective}
          </Badge>
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-learn-muted">
          {description}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-3 sm:px-5">
        {attempt.status === "ReturnedForRevision" && attempt.mentorFeedback ? (
          <div className="mb-3 rounded-lg border border-learn-primary/20 bg-learn-primary/5 px-3 py-2.5 text-sm text-learn-muted">
            <span className="font-medium text-learn-text-strong">Cần chỉnh sửa: </span>
            {attempt.mentorFeedback}
          </div>
        ) : null}

        {attempt.status === "Graded" ? (
          <div className="mb-3">
            <RetrospectiveGradeSummary attempt={attempt} />
          </div>
        ) : null}

        {attempt.status === "TurnedIn" ? (
          <p className="mb-2 text-xs font-medium text-learn-muted">
            Đã nộp{submittedLabel ? ` · ${submittedLabel}` : ""} — chờ mentor chấm điểm
          </p>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col">
          <label htmlFor="retrospective-content" className="sr-only">
            Nội dung đánh giá
          </label>
          <textarea
            id="retrospective-content"
            value={contentText}
            onChange={(event) => handleContentChange(event.target.value)}
            readOnly={!isEditable}
            placeholder="Viết suy nghĩ của bạn tại đây..."
            className={cn(
              "min-h-[12rem] w-full flex-1 resize-none rounded-xl border border-learn-border bg-learn-surface-2/40 px-3.5 py-3 text-sm leading-relaxed text-learn-text-strong outline-none transition-colors",
              "placeholder:text-learn-faint focus-visible:border-learn-accent focus-visible:ring-2 focus-visible:ring-learn-accent/20",
              !isEditable && "cursor-default opacity-90",
            )}
          />
          <p className="mt-2 text-xs text-learn-faint">
            {isEditable
              ? isSaving
                ? "Đang lưu nháp..."
                : savedLabel
                  ? `Lưu nháp lúc ${savedLabel}`
                  : "Nội dung được tự động lưu nháp"
              : submittedLabel
                ? `Nộp lúc ${submittedLabel}`
                : "Bài đã nộp"}
          </p>
        </div>
      </div>

      {isEditable ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-learn-border px-4 py-2.5 sm:px-5">
          <p className="text-xs text-learn-faint">
            Điểm đạt: {attempt.passScore}/{attempt.maxPoints}
          </p>
          <Button
            type="button"
            className="ml-auto bg-learn-primary text-white hover:bg-learn-primary/90"
            disabled={isSubmitting || !contentText.trim()}
            onClick={() => setIsConfirmOpen(true)}
          >
            {isSubmitting ? "Đang nộp..." : "Nộp bài đánh giá"}
          </Button>
        </div>
      ) : null}

      <Dialog
        open={isConfirmOpen}
        onOpenChange={(open) => {
          if (!isSubmitting) setIsConfirmOpen(open);
        }}
      >
        <DialogPopup className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nộp bài đánh giá?</DialogTitle>
            <DialogDescription>
              Sau khi nộp, bạn không thể chỉnh sửa cho đến khi mentor yêu cầu chỉnh sửa lại.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setIsConfirmOpen(false)}
            >
              Tiếp tục viết
            </Button>
            <Button
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isSubmitting}
              onClick={() => void performSubmit()}
            >
              {isSubmitting ? "Đang nộp..." : "Nộp bài"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
