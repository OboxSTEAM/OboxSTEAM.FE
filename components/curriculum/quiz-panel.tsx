"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  getAssignmentQuizResult,
  getInProgressQuiz,
  getQuizResult,
  saveQuizDraftAnswers,
  startQuizAttempt,
  submitQuiz,
  type AssignmentDetail,
  type EnrollmentCurriculum,
  type QuizAttempt,
  type QuizResult,
} from "@/lib/api";
import { ApiRequestError } from "@/lib/api/errors";
import {
  getAssignmentBreadcrumb,
  isAssignmentSelectable,
  type FlatCurriculumAssignment,
} from "@/lib/curriculum/assignment-helpers";
import { QUIZ_ANSWER_SAVE_DEBOUNCE_MS, ASSIGNMENT_TYPE_LABELS } from "@/lib/curriculum/constants";
import { getQuizMarks, toggleQuizMark } from "@/lib/curriculum/quiz-marks";
import {
  clearStoredQuizSubmissionId,
  getStoredQuizSubmissionId,
  setStoredQuizSubmissionId,
} from "@/lib/curriculum/quiz-storage";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

import { QuizAttemptView } from "./quiz/quiz-attempt-view";
import { QuizIntro } from "./quiz/quiz-intro";
import { QuizResultView } from "./quiz/quiz-result-view";

type QuizPanelProps = {
  curriculum: EnrollmentCurriculum;
  assignmentId: string;
  flatAssignment: FlatCurriculumAssignment;
  onCurriculumRefresh: () => Promise<void>;
};

type QuizPhase = "intro" | "attempt" | "result";

type HydratedQuizState =
  | { phase: "attempt"; attempt: QuizAttempt }
  | { phase: "result"; result: QuizResult };

function answersFromAttempt(attempt: QuizAttempt): Record<string, string[]> {
  return Object.fromEntries(
    attempt.savedAnswers.map((answer) => [answer.questionId, answer.selectedOptionIds]),
  );
}

function isCompletedAssignmentStatus(status: FlatCurriculumAssignment["status"]): boolean {
  return status === "completed" || status === "submitted";
}

function isMissingQuizResultError(error: unknown): boolean {
  return error instanceof ApiRequestError && (error.status === 404 || error.status === 405);
}

async function loadHydratedQuizState(
  assignmentId: string,
  flatStatus: FlatCurriculumAssignment["status"],
): Promise<HydratedQuizState | null> {
  if (isCompletedAssignmentStatus(flatStatus)) {
    try {
      const assignmentResult = await getAssignmentQuizResult(assignmentId);
      const graded = assignmentResult?.data;
      if (graded) {
        setStoredQuizSubmissionId(assignmentId, graded.submissionId);
        return { phase: "result", result: graded };
      }
    } catch (error) {
      if (!isMissingQuizResultError(error)) {
        throw error;
      }
    }
  }

  const storedSubmissionId = getStoredQuizSubmissionId(assignmentId);
  if (!storedSubmissionId) {
    return null;
  }

  try {
    const gradedResult = await getQuizResult(storedSubmissionId);
    const graded = gradedResult?.data;
    if (graded) {
      return { phase: "result", result: graded };
    }
  } catch (error) {
    if (!isMissingQuizResultError(error)) {
      throw error;
    }
  }

  try {
    const inProgressResult = await getInProgressQuiz(storedSubmissionId);
    const attempt = inProgressResult?.data;
    if (attempt) {
      return { phase: "attempt", attempt };
    }
  } catch (error) {
    if (!isMissingQuizResultError(error)) {
      throw error;
    }
    clearStoredQuizSubmissionId(assignmentId);
  }

  return null;
}

function QuizPanelSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-learn-border bg-learn-surface p-5 shadow-[0_4px_20px_rgba(45,45,45,0.04)]">
      <Skeleton className="h-3 w-32 bg-learn-surface-2" />
      <Skeleton className="mt-3 h-6 w-2/3 bg-learn-surface-2" />
      <Skeleton className="mt-4 min-h-0 flex-1 rounded-xl bg-learn-surface-2" />
    </div>
  );
}

export function QuizPanel({
  curriculum,
  assignmentId,
  flatAssignment,
  onCurriculumRefresh,
}: QuizPanelProps) {
  const [phase, setPhase] = useState<QuizPhase>("intro");
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [markedIds, setMarkedIds] = useState<Set<string>>(() => new Set());
  const [isStarting, setIsStarting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<{ questionId: string; selectedOptionIds: string[] } | null>(
    null,
  );

  const breadcrumb = useMemo(
    () => getAssignmentBreadcrumb(curriculum, assignmentId),
    [assignmentId, curriculum],
  );

  const resetAttemptState = useCallback(() => {
    setPhase("intro");
    setAttempt(null);
    setResult(null);
    setCurrentIndex(0);
    setAnswers({});
    setMarkedIds(new Set());
    setIsSaving(false);
    setIsSubmitting(false);
    setIsConfirmOpen(false);
    pendingSaveRef.current = null;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    resetAttemptState();
  }, [assignmentId, resetAttemptState]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const {
    data: assignmentResult,
    isLoading,
    hasError,
    retry,
  } = useClientFetch({
    enabled: isAssignmentSelectable(flatAssignment.status),
    fetcher: async () => getAssignmentById(assignmentId),
    deps: [assignmentId],
    onError: (error) => {
      showAppErrorFromUnknown(error, "generic");
    },
  });

  const assignment: AssignmentDetail | null = assignmentResult?.data ?? null;
  const hasCompletedAttempt = isCompletedAssignmentStatus(flatAssignment.status);

  const {
    data: hydratedState,
    isLoading: isHydrating,
    hasError: hydrationError,
    retry: retryHydration,
  } = useClientFetch({
    enabled:
      isAssignmentSelectable(flatAssignment.status) &&
      flatAssignment.assignmentType === "Quiz",
    fetcher: async () => loadHydratedQuizState(assignmentId, flatAssignment.status),
    deps: [assignmentId, flatAssignment.status],
    onError: (error) => {
      showAppErrorFromUnknown(error, "generic");
    },
  });

  useEffect(() => {
    if (!hydratedState) return;

    if (hydratedState.phase === "result") {
      setResult(hydratedState.result);
      setAttempt(null);
      setCurrentIndex(0);
      setAnswers({});
      setMarkedIds(new Set());
      setPhase("result");
      return;
    }

    setAttempt(hydratedState.attempt);
    setResult(null);
    setAnswers(answersFromAttempt(hydratedState.attempt));
    setMarkedIds(getQuizMarks(hydratedState.attempt.submissionId));
    setCurrentIndex(0);
    setPhase("attempt");
  }, [hydratedState]);

  const flushSave = useCallback(
    async (submissionId: string, payload: { questionId: string; selectedOptionIds: string[] }) => {
      setIsSaving(true);
      try {
        await saveQuizDraftAnswers(submissionId, {
          answers: [payload],
        });
      } catch (error) {
        showAppErrorFromUnknown(error, "generic");
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const scheduleSave = useCallback(
    (submissionId: string, questionId: string, selectedOptionIds: string[]) => {
      pendingSaveRef.current = { questionId, selectedOptionIds };
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        const pending = pendingSaveRef.current;
        if (!pending) return;
        void flushSave(submissionId, pending);
      }, QUIZ_ANSWER_SAVE_DEBOUNCE_MS);
    },
    [flushSave],
  );

  const handleStart = useCallback(async () => {
    setIsStarting(true);
    try {
      const startResult = await startQuizAttempt(assignmentId);
      const nextAttempt = startResult?.data;
      if (!nextAttempt) {
        throw new Error("Quiz start response missing data.");
      }

      setAttempt(nextAttempt);
      setAnswers(answersFromAttempt(nextAttempt));
      setMarkedIds(getQuizMarks(nextAttempt.submissionId));
      setStoredQuizSubmissionId(assignmentId, nextAttempt.submissionId);
      setCurrentIndex(0);
      setPhase("attempt");
    } catch (error) {
      showAppErrorFromUnknown(error, "generic");
    } finally {
      setIsStarting(false);
    }
  }, [assignmentId]);

  const handleSelectOption = useCallback(
    (questionId: string, optionId: string) => {
      if (!attempt) return;

      const question = attempt.questions.find((item) => item.id === questionId);
      if (!question) return;

      setAnswers((current) => {
        const previous = current[questionId] ?? [];
        let nextIds: string[];

        if (question.questionType === "MultipleChoice") {
          nextIds = previous.includes(optionId)
            ? previous.filter((id) => id !== optionId)
            : [...previous, optionId];
        } else {
          nextIds = [optionId];
        }

        scheduleSave(attempt.submissionId, questionId, nextIds);
        return { ...current, [questionId]: nextIds };
      });
    },
    [attempt, scheduleSave],
  );

  const handleToggleMark = useCallback(() => {
    if (!attempt) return;
    const question = attempt.questions[currentIndex];
    if (!question) return;

    toggleQuizMark(attempt.submissionId, question.id);
    setMarkedIds(getQuizMarks(attempt.submissionId));
  }, [attempt, currentIndex]);

  const unansweredCount = useMemo(() => {
    if (!attempt) return 0;
    return attempt.questions.filter(
      (question) => (answers[question.id]?.length ?? 0) === 0,
    ).length;
  }, [answers, attempt]);

  const performSubmit = useCallback(async () => {
    if (!attempt) return;

    setIsConfirmOpen(false);

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    setIsSubmitting(true);
    try {
      if (pendingSaveRef.current) {
        await flushSave(attempt.submissionId, pendingSaveRef.current);
        pendingSaveRef.current = null;
      }

      const submitAnswers = attempt.questions
        .map((question) => ({
          questionId: question.id,
          selectedOptionIds: answers[question.id] ?? [],
        }))
        .filter((answer) => answer.selectedOptionIds.length > 0);

      const submitResult = await submitQuiz(attempt.submissionId, {
        answers: submitAnswers,
      });

      const graded = submitResult?.data;
      if (!graded) {
        throw new Error("Quiz submit response missing data.");
      }

      setResult(graded);
      setStoredQuizSubmissionId(assignmentId, graded.submissionId);
      setPhase("result");
      showAppSuccess({
        title: graded.passed ? "Đã nộp bài — Đạt yêu cầu" : "Đã nộp bài",
        description: `Điểm: ${graded.assignedGrade}/${graded.maxPoints}`,
      });
      await onCurriculumRefresh();
    } catch (error) {
      showAppErrorFromUnknown(error, "generic");
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, assignmentId, attempt, flushSave, onCurriculumRefresh]);

  const handleSubmit = useCallback(() => {
    if (!attempt || isSubmitting) return;
    setIsConfirmOpen(true);
  }, [attempt, isSubmitting]);

  const handleExpire = useCallback(() => {
    if (!isSubmitting && phase === "attempt") {
      void performSubmit();
    }
  }, [performSubmit, isSubmitting, phase]);

  if (!isAssignmentSelectable(flatAssignment.status)) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-learn-border bg-learn-surface p-8 text-center shadow-[0_4px_20px_rgba(45,45,45,0.04)]">
        <p className="text-sm text-learn-muted">
          Bài kiểm tra này chưa mở khóa. Hoàn thành các bài trước để tiếp tục.
        </p>
      </div>
    );
  }

  if (flatAssignment.assignmentType !== "Quiz") {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-learn-border bg-learn-surface p-8 text-center shadow-[0_4px_20px_rgba(45,45,45,0.04)]">
        <p className="text-sm text-learn-muted">
          Loại bài tập này sẽ được hỗ trợ sớm.
        </p>
      </div>
    );
  }

  if (isLoading && !assignment) {
    return <QuizPanelSkeleton />;
  }

  if (hasError && !assignment) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-learn-border bg-learn-surface p-8 text-center shadow-[0_4px_20px_rgba(45,45,45,0.04)]">
        <p className="text-sm text-learn-muted">Không tải được bài kiểm tra.</p>
        <Button type="button" variant="outline" className="mt-4 border-learn-border" onClick={retry}>
          Thử lại
        </Button>
      </div>
    );
  }

  if (!assignment) {
    return <QuizPanelSkeleton />;
  }

  const isRestoringSession =
    isHydrating && phase === "intro" && (hasCompletedAttempt || Boolean(getStoredQuizSubmissionId(assignmentId)));

  if (isRestoringSession) {
    return <QuizPanelSkeleton />;
  }

  if (hydrationError && hasCompletedAttempt && phase === "intro" && !result) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-learn-border bg-learn-surface p-8 text-center shadow-[0_4px_20px_rgba(45,45,45,0.04)]">
        <p className="text-sm text-learn-muted">Không tải được kết quả bài kiểm tra.</p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 border-learn-border"
          onClick={retryHydration}
        >
          Thử lại
        </Button>
      </div>
    );
  }

  const canRetry =
    assignment.maxAttempts > 1 &&
    (result?.attemptNumber ?? 0) < assignment.maxAttempts;

  const isRetake = hasCompletedAttempt;
  const startLabel = isRetake ? "Làm lại bài kiểm tra" : "Bắt đầu làm bài";
  const showIntroStart = phase === "intro";
  const showResultRetry = phase === "result" && canRetry;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-learn-border bg-learn-surface shadow-[0_4px_20px_rgba(45,45,45,0.04)]">
      {phase !== "attempt" ? (
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
              {ASSIGNMENT_TYPE_LABELS.Quiz}
            </Badge>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "min-h-0 flex-1",
          phase !== "attempt" && "overflow-y-auto px-4 pb-3 sm:px-5",
        )}
      >
        {phase === "intro" ? <QuizIntro assignment={assignment} /> : null}

        {phase === "attempt" && attempt ? (
          <QuizAttemptView
            questions={attempt.questions}
            currentIndex={currentIndex}
            answers={answers}
            markedIds={markedIds}
            expiresAt={attempt.expiresAt}
            isSaving={isSaving}
            isSubmitting={isSubmitting}
            onSelectQuestion={setCurrentIndex}
            onToggleMark={handleToggleMark}
            onSelectOption={handleSelectOption}
            onPrevious={() => setCurrentIndex((index) => Math.max(0, index - 1))}
            onNext={() =>
              setCurrentIndex((index) => Math.min(attempt.questions.length - 1, index + 1))
            }
            onSubmit={() => void handleSubmit()}
            onExpire={handleExpire}
          />
        ) : null}

        {phase === "result" && result ? <QuizResultView result={result} /> : null}
      </div>

      {showIntroStart ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-learn-border px-4 py-2.5 sm:px-5">
          <Button
            type="button"
            className="ml-auto bg-learn-primary text-white hover:bg-learn-primary/90"
            disabled={isStarting}
            onClick={() => void handleStart()}
          >
            {isStarting ? "Đang mở bài..." : startLabel}
          </Button>
        </div>
      ) : null}

      {showResultRetry ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-learn-border px-4 py-2.5 sm:px-5">
          <Button
            type="button"
            variant="outline"
            className="ml-auto border-learn-border"
            disabled={isStarting}
            onClick={() => {
              resetAttemptState();
              void handleStart();
            }}
          >
            {isStarting ? "Đang mở bài..." : "Làm lại"}
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
            <DialogTitle>Nộp bài kiểm tra?</DialogTitle>
            <DialogDescription>
              {unansweredCount > 0
                ? `Bạn còn ${unansweredCount} câu chưa trả lời. Sau khi nộp, bạn sẽ không thể chỉnh sửa câu trả lời.`
                : "Sau khi nộp, bạn sẽ không thể chỉnh sửa câu trả lời."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setIsConfirmOpen(false)}
            >
              Tiếp tục làm bài
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
