"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  approveProgramReview,
  getReviewDraft,
  saveReviewDraft,
  type ReviewCriterionScoreRequestInput,
} from "@/lib/api";
import { ApiRequestError } from "@/lib/api/errors";
import type { RubricSnapshotCriterion } from "@/lib/advisory/parse-snapshot";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { REVIEW_SUBMISSION_STATUS_LABELS } from "@/lib/expert/advisory-labels";

type ScoreDraft = {
  score: string;
  comment: string;
};

export type RequiredChangeSummary = {
  id: string;
  label: string;
};

type ReviewAssessmentPanelProps = {
  programId: string;
  programName: string;
  submissionId: string;
  submissionStatus: string;
  concurrencyVersion: string;
  criteria: RubricSnapshotCriterion[];
  canDecide: boolean;
  requiredChanges?: RequiredChangeSummary[];
  onSubmissionStale?: () => void;
  onDecisionComplete?: () => void;
};

const AUTOSAVE_MS = 1200;

export function ReviewAssessmentPanel({
  programId,
  programName,
  submissionId,
  submissionStatus,
  concurrencyVersion: initialConcurrencyVersion,
  criteria,
  canDecide,
  requiredChanges = [],
  onSubmissionStale,
  onDecisionComplete,
}: ReviewAssessmentPanelProps) {
  const [scores, setScores] = useState<Record<string, ScoreDraft>>({});
  const [overallComment, setOverallComment] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [submissionConcurrencyVersion, setSubmissionConcurrencyVersion] =
    useState(initialConcurrencyVersion);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"approve" | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);
  const dirtyRef = useRef(false);
  const draftVersionRef = useRef<string | null>(null);

  const { data: draftData, isLoading: isDraftLoading, retry: retryDraft } =
    useClientFetch({
      enabled: canDecide && submissionStatus === "Pending",
      fetcher: () => getReviewDraft(programId, submissionId),
      deps: [programId, submissionId],
      onError: (error) => showAppErrorFromUnknown(error, "expert.advisory.draft"),
    });

  useEffect(() => {
    setSubmissionConcurrencyVersion(initialConcurrencyVersion);
  }, [initialConcurrencyVersion]);

  useEffect(() => {
    if (hydratedRef.current || !draftData?.data) return;
    const draft = draftData.data;
    const nextScores: Record<string, ScoreDraft> = {};
    for (const item of draft.scores) {
      nextScores[item.criterionId] = {
        score: String(item.score),
        comment: item.comment ?? "",
      };
    }
    setScores(nextScores);
    setOverallComment(draft.overallComment ?? "");
    draftVersionRef.current = draft.concurrencyVersion;
    dirtyRef.current = false;
    hydratedRef.current = true;
    if (draft.overallComment?.trim() || draft.scores.some((item) => item.comment?.trim())) {
      setShowNotes(true);
    }
  }, [draftData]);

  const totalMaxScore = criteria.reduce((total, criterion) => total + criterion.maxScore, 0);
  const scoredCount = criteria.filter((criterion) => {
    const raw = scores[criterion.id]?.score?.trim() ?? "";
    return raw !== "" && Number.isInteger(Number(raw));
  }).length;
  const totalScore = criteria.reduce((total, criterion) => {
    const raw = scores[criterion.id]?.score?.trim() ?? "";
    const value = Number(raw);
    return Number.isFinite(value) && raw !== "" ? total + value : total;
  }, 0);

  function updateScore(criterionId: string, patch: Partial<ScoreDraft>) {
    dirtyRef.current = true;
    setScores((prev) => ({
      ...prev,
      [criterionId]: { ...(prev[criterionId] ?? { score: "", comment: "" }), ...patch },
    }));
  }

  const persistDraft = useCallback(async () => {
    const draftToken = draftVersionRef.current;
    if (!canDecide || !dirtyRef.current || !draftToken) return;
    const invalidCriterion = criteria.find((criterion) => {
      const raw = scores[criterion.id]?.score.trim() ?? "";
      if (raw === "") return false;
      const value = Number(raw);
      return !Number.isInteger(value) || value < 0 || value > criterion.maxScore;
    });
    if (invalidCriterion) {
      setFormError(
        `Điểm của “${invalidCriterion.name}” phải là số nguyên từ 0 đến ${invalidCriterion.maxScore}.`,
      );
      return;
    }
    setIsSaving(true);
    dirtyRef.current = false;
    try {
      const collected: ReviewCriterionScoreRequestInput[] = [];
      for (const criterion of criteria) {
        const draft = scores[criterion.id];
        const raw = draft?.score.trim() ?? "";
        if (raw === "") continue;
        collected.push({
          criterionId: criterion.id,
          score: Number(raw),
          comment: draft?.comment.trim() || null,
        });
      }

      const result = await saveReviewDraft(programId, submissionId, {
        scores: collected.length > 0 ? collected : null,
        overallComment: overallComment.trim() || null,
        concurrencyVersion: draftToken,
      });
      if (result?.data?.concurrencyVersion) {
        draftVersionRef.current = result.data.concurrencyVersion;
      }
      setFormError(null);
    } catch (error) {
      dirtyRef.current = true;
      if (error instanceof ApiRequestError && error.status === 409) {
        draftVersionRef.current = null;
        hydratedRef.current = false;
        showAppErrorFromUnknown(error, "expert.advisory.draft");
        retryDraft();
      } else {
        showAppErrorFromUnknown(error, "expert.advisory.draft");
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    canDecide,
    criteria,
    scores,
    overallComment,
    programId,
    submissionId,
    retryDraft,
  ]);

  useEffect(() => {
    if (!canDecide || !hydratedRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void persistDraft();
    }, AUTOSAVE_MS);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [scores, overallComment, canDecide, persistDraft]);

  function collectScores(requireAll: boolean): ReviewCriterionScoreRequestInput[] | null {
    const collected: ReviewCriterionScoreRequestInput[] = [];
    for (const criterion of criteria) {
      const draft = scores[criterion.id];
      const raw = draft?.score.trim() ?? "";
      if (raw === "") {
        if (requireAll) {
          setFormError(`Vui lòng chấm điểm tiêu chí “${criterion.name}”.`);
          return null;
        }
        continue;
      }
      const value = Number(raw);
      if (!Number.isInteger(value) || value < 0 || value > criterion.maxScore) {
        setFormError(
          `Điểm của “${criterion.name}” phải là số nguyên từ 0 đến ${criterion.maxScore}.`,
        );
        return null;
      }
      collected.push({
        criterionId: criterion.id,
        score: value,
        comment: draft?.comment.trim() || null,
      });
    }
    setFormError(null);
    return collected;
  }

  function handleDecisionConflict(error: unknown, context: "expert.review.approve" | "expert.review.requestChanges") {
    if (error instanceof ApiRequestError && error.status === 409) {
      showAppErrorFromUnknown(error, "expert.advisory.draft");
      onSubmissionStale?.();
      return;
    }
    showAppErrorFromUnknown(error, context);
  }

  async function handleApprove() {
    const collected = collectScores(criteria.length > 0);
    if (collected == null) return;

    setPendingAction("approve");
    try {
      await approveProgramReview(programId, {
        submissionId,
        concurrencyVersion: submissionConcurrencyVersion,
        comment: overallComment.trim() || null,
        scores: collected.length > 0 ? collected : null,
      });
      showAppSuccess({
        title: "Đã phê duyệt chương trình",
        description: `“${programName}” chuyển sang trạng thái Đã duyệt.`,
      });
      onDecisionComplete?.();
    } catch (error) {
      handleDecisionConflict(error, "expert.review.approve");
    } finally {
      setPendingAction(null);
    }
  }

  const isBusy = pendingAction !== null;
  const isPending = submissionStatus === "Pending";
  const rubricComplete = criteria.length === 0 || scoredCount === criteria.length;
  const belowHalf = criteria.filter((criterion) => {
    const raw = scores[criterion.id]?.score?.trim() ?? "";
    if (raw === "" || !Number.isInteger(Number(raw))) return false;
    return Number(raw) * 2 < criterion.maxScore;
  });
  const canApprove =
    canDecide &&
    isPending &&
    rubricComplete &&
    belowHalf.length === 0 &&
    requiredChanges.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="rounded-md text-[11px]">
          {REVIEW_SUBMISSION_STATUS_LABELS[
            submissionStatus as keyof typeof REVIEW_SUBMISSION_STATUS_LABELS
          ] ?? submissionStatus}
        </Badge>
        {isSaving ? (
          <span className="t-shimmer text-[11px]" data-text="Đang lưu nháp…">
            Đang lưu nháp…
          </span>
        ) : canDecide && isPending ? (
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
            Nháp được lưu tự động
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">Chế độ chỉ đọc</span>
        )}
        <span className="text-[11px] text-muted-foreground">
          {scoredCount}/{criteria.length} tiêu chí đã chấm
        </span>
      </div>

      {isDraftLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : criteria.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
          Khung chưa có tiêu chí rubric. Có thể phê duyệt bên dưới.
        </p>
      ) : (
        <div className="space-y-3">
          {criteria.map((criterion) => {
            const raw = scores[criterion.id]?.score?.trim() ?? "";
            const hasScore = raw !== "" && Number.isInteger(Number(raw));
            const isLow = hasScore && Number(raw) * 2 < criterion.maxScore;
            return (
              <div
                key={criterion.id}
                className="space-y-2 rounded-xl border border-border bg-background/60 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {criterion.name}
                    </p>
                    {criterion.description ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {criterion.description}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {hasScore ? `${raw}/${criterion.maxScore}` : `/${criterion.maxScore}`}
                  </span>
                </div>
                {isLow ? (
                  <p className="text-xs font-medium text-primary">
                    Dưới một nửa mức tối đa. Hãy gắn bắt buộc sửa rồi trả về manager.
                  </p>
                ) : null}
                <Input
                  value={scores[criterion.id]?.score ?? ""}
                  onChange={(event) => updateScore(criterion.id, { score: event.target.value })}
                  inputMode="numeric"
                  placeholder={`0 – ${criterion.maxScore}`}
                  aria-label={`Điểm cho tiêu chí ${criterion.name}`}
                  disabled={!canDecide || isBusy}
                  className="h-10 rounded-lg border-input bg-card text-sm"
                />
                {showNotes ? (
                  <Input
                    value={scores[criterion.id]?.comment ?? ""}
                    onChange={(event) =>
                      updateScore(criterion.id, { comment: event.target.value })
                    }
                    placeholder="Nhận xét cho tiêu chí (không bắt buộc)"
                    aria-label={`Nhận xét cho tiêu chí ${criterion.name}`}
                    disabled={!canDecide || isBusy}
                    className="h-10 rounded-lg border-input bg-card text-sm"
                  />
                ) : null}
              </div>
            );
          })}

          <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tổng điểm
            </span>
            <span className="font-mono text-sm font-bold text-foreground">
              {scoredCount > 0 ? `${totalScore}/${totalMaxScore}` : "Chưa đánh giá"}
            </span>
          </div>
        </div>
      )}

      {canDecide && isPending ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowNotes((open) => !open)}
          className="h-9 px-2 text-xs font-semibold text-muted-foreground"
        >
          {showNotes ? "Ẩn nhận xét" : "Thêm nhận xét"}
        </Button>
      ) : null}

      {showNotes ? (
        <div className="space-y-2">
          <Label htmlFor="assessment-overall">Nhận xét tổng quan</Label>
          <Textarea
            id="assessment-overall"
            rows={3}
            value={overallComment}
            onChange={(event) => {
              dirtyRef.current = true;
              setOverallComment(event.target.value);
            }}
            disabled={!canDecide || isBusy}
            placeholder="Ghi chú kèm quyết định phê duyệt (không bắt buộc)."
            className="rounded-xl border-input bg-card"
          />
        </div>
      ) : null}

      {canDecide && isPending ? (
        <>
          {requiredChanges.length > 0 ? (
            <p className="text-xs leading-5 text-muted-foreground">
              Còn mục bắt buộc sửa chưa chấp nhận. Phê duyệt chỉ mở khi mọi mục đã được chấp nhận.
            </p>
          ) : null}

          {formError ? (
            <p className="flex items-start gap-1.5 text-xs font-medium text-primary">
              <AlertCircle className="mt-px size-3.5 shrink-0" />
              {formError}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              onClick={() => {
                if (collectScores(criteria.length > 0) == null) return;
                setPendingAction("approve");
              }}
              disabled={isBusy || !canApprove}
              className="h-11 flex-1 gap-2 rounded-xl bg-[#7CB342] font-semibold text-white hover:bg-[#7CB342]/90"
            >
              <CheckCircle2 className="size-4" />
              Phê duyệt
            </Button>
          </div>

          {!rubricComplete ? (
            <p className="text-xs leading-5 text-muted-foreground">
              Phê duyệt mở khi mọi tiêu chí rubric đã được chấm.
            </p>
          ) : belowHalf.length > 0 ? (
            <p className="text-xs leading-5 text-muted-foreground">
              Điểm còn thấp nên chưa phê duyệt được. Quay lại nhận xét, gắn bắt buộc sửa, rồi trả về manager.
            </p>
          ) : null}

          <ConfirmDialog
            isOpen={pendingAction === "approve"}
            onOpenChange={(open) => {
              if (!open) setPendingAction(null);
            }}
            title="Phê duyệt chương trình?"
            description={`Xác nhận phê duyệt “${programName}” với điểm rubric hiện tại.`}
            confirmLabel="Phê duyệt"
            onConfirm={handleApprove}
          />
        </>
      ) : !canDecide ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
          Quyết định chính thức không khả dụng trong ngữ cảnh này. Chỉ chuyên gia
          chịu trách nhiệm mới có thể quyết định trên lần nộp mới nhất đang chờ.
        </p>
      ) : !isPending ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
          Lần nộp này đã kết thúc. Nội dung và kết quả được giữ ở chế độ chỉ đọc.
        </p>
      ) : null}
    </div>
  );
}
