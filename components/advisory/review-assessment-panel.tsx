"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  MessageSquareWarning,
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
  requestProgramChanges,
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

type ReviewAssessmentPanelProps = {
  programId: string;
  programName: string;
  submissionId: string;
  submissionStatus: string;
  concurrencyVersion: string;
  criteria: RubricSnapshotCriterion[];
  canDecide: boolean;
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
  onDecisionComplete,
}: ReviewAssessmentPanelProps) {
  const [scores, setScores] = useState<Record<string, ScoreDraft>>({});
  const [overallComment, setOverallComment] = useState("");
  const [changesComment, setChangesComment] = useState("");
  const [concurrencyVersion, setConcurrencyVersion] = useState(
    initialConcurrencyVersion,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "approve" | "request-changes" | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);

  const { data: draftData, isLoading: isDraftLoading, retry: retryDraft } =
    useClientFetch({
      fetcher: () => getReviewDraft(programId, submissionId),
      deps: [programId, submissionId],
      onError: (error) => showAppErrorFromUnknown(error, "expert.advisory.draft"),
    });

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
    setConcurrencyVersion(draft.concurrencyVersion);
    hydratedRef.current = true;
  }, [draftData]);

  const totalMaxScore = criteria.reduce((t, c) => t + c.maxScore, 0);
  const scoredCount = criteria.filter((c) => {
    const raw = scores[c.id]?.score?.trim() ?? "";
    return raw !== "" && Number.isInteger(Number(raw));
  }).length;
  const totalScore = criteria.reduce((total, criterion) => {
    const raw = scores[criterion.id]?.score?.trim() ?? "";
    const value = Number(raw);
    return Number.isFinite(value) && raw !== "" ? total + value : total;
  }, 0);

  function updateScore(criterionId: string, patch: Partial<ScoreDraft>) {
    setScores((prev) => ({
      ...prev,
      [criterionId]: { ...(prev[criterionId] ?? { score: "", comment: "" }), ...patch },
    }));
  }

  const persistDraft = useCallback(async () => {
    if (!canDecide) return;
    setIsSaving(true);
    try {
      const collected: ReviewCriterionScoreRequestInput[] = [];
      for (const criterion of criteria) {
        const draft = scores[criterion.id];
        const raw = draft?.score.trim() ?? "";
        if (raw === "") continue;
        const value = Number(raw);
        if (!Number.isInteger(value) || value < 0 || value > criterion.maxScore) {
          continue;
        }
        collected.push({
          criterionId: criterion.id,
          score: value,
          comment: draft?.comment.trim() || null,
        });
      }

      const result = await saveReviewDraft(programId, submissionId, {
        scores: collected.length > 0 ? collected : null,
        overallComment: overallComment.trim() || null,
        concurrencyVersion,
      });
      if (result?.data?.concurrencyVersion) {
        setConcurrencyVersion(result.data.concurrencyVersion);
      }
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) {
        showAppErrorFromUnknown(error, "expert.advisory.draft");
        retryDraft();
        hydratedRef.current = false;
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    canDecide,
    criteria,
    scores,
    overallComment,
    concurrencyVersion,
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

  async function handleApprove() {
    const collected = collectScores(criteria.length > 0);
    if (collected == null) return;

    setPendingAction("approve");
    try {
      await approveProgramReview(programId, {
        submissionId,
        concurrencyVersion,
        comment: overallComment.trim() || null,
        scores: collected.length > 0 ? collected : null,
      });
      showAppSuccess({
        title: "Đã phê duyệt chương trình",
        description: `“${programName}” chuyển sang trạng thái Đã duyệt.`,
      });
      onDecisionComplete?.();
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) {
        showAppErrorFromUnknown(error, "expert.advisory.draft");
        retryDraft();
        hydratedRef.current = false;
      } else {
        showAppErrorFromUnknown(error, "expert.review.approve");
      }
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRequestChanges() {
    const comment = changesComment.trim();
    if (!comment) {
      setFormError("Vui lòng nhập lý do cần chỉnh sửa.");
      return;
    }
    const collected = collectScores(false);

    setFormError(null);
    setPendingAction("request-changes");
    try {
      await requestProgramChanges(programId, {
        submissionId,
        concurrencyVersion,
        comment,
        scores: collected && collected.length > 0 ? collected : null,
      });
      showAppSuccess({
        title: "Đã gửi yêu cầu chỉnh sửa",
        description: `“${programName}” được trả về cho Manager để chỉnh sửa.`,
      });
      setChangesComment("");
      onDecisionComplete?.();
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) {
        showAppErrorFromUnknown(error, "expert.advisory.draft");
        retryDraft();
        hydratedRef.current = false;
      } else {
        showAppErrorFromUnknown(error, "expert.review.requestChanges");
      }
    } finally {
      setPendingAction(null);
    }
  }

  const isBusy = pendingAction !== null;
  const isPending = submissionStatus === "Pending";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="rounded-md text-[11px]">
          {REVIEW_SUBMISSION_STATUS_LABELS[
            submissionStatus as keyof typeof REVIEW_SUBMISSION_STATUS_LABELS
          ] ?? submissionStatus}
        </Badge>
        {isSaving ? (
          <span className="text-[11px] text-muted-foreground">Đang lưu nháp…</span>
        ) : null}
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
          Khung chưa có tiêu chí rubric. Ghi nhận xét tổng quan bên dưới.
        </p>
      ) : (
        <div className="space-y-3">
          {criteria.map((criterion) => {
            const raw = scores[criterion.id]?.score?.trim() ?? "";
            const hasScore = raw !== "" && Number.isInteger(Number(raw));
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
                    {criterion.evidenceGuidance ? (
                      <p className="mt-1 text-xs italic text-muted-foreground">
                        Gợi ý minh chứng: {criterion.evidenceGuidance}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {hasScore ? `${raw}/${criterion.maxScore}` : `Chưa đánh giá /${criterion.maxScore}`}
                  </span>
                </div>
                <Input
                  value={scores[criterion.id]?.score ?? ""}
                  onChange={(e) => updateScore(criterion.id, { score: e.target.value })}
                  inputMode="numeric"
                  placeholder={`0 – ${criterion.maxScore}`}
                  aria-label={`Điểm cho tiêu chí ${criterion.name}`}
                  disabled={!canDecide || isBusy}
                  className="h-10 rounded-lg border-input bg-card text-sm"
                />
                <Input
                  value={scores[criterion.id]?.comment ?? ""}
                  onChange={(e) => updateScore(criterion.id, { comment: e.target.value })}
                  placeholder="Nhận xét cho tiêu chí (không bắt buộc)"
                  disabled={!canDecide || isBusy}
                  className="h-10 rounded-lg border-input bg-card text-xs"
                />
              </div>
            );
          })}

          {criteria.length > 0 ? (
            <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tổng điểm
              </span>
              <span className="font-mono text-sm font-bold text-foreground">
                {scoredCount > 0 ? `${totalScore}/${totalMaxScore}` : "Chưa đánh giá"}
              </span>
            </div>
          ) : null}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="assessment-overall">Nhận xét tổng quan</Label>
        <Textarea
          id="assessment-overall"
          rows={3}
          value={overallComment}
          onChange={(e) => setOverallComment(e.target.value)}
          disabled={!canDecide || isBusy}
          className="rounded-xl border-input bg-card"
        />
      </div>

      {canDecide && isPending ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="assessment-changes">
              Lý do cần chỉnh sửa
              <span className="ml-1 text-primary">*</span>
            </Label>
            <Textarea
              id="assessment-changes"
              rows={3}
              value={changesComment}
              onChange={(e) => setChangesComment(e.target.value)}
              disabled={isBusy}
              className="rounded-xl border-input bg-card"
            />
          </div>

          {formError ? (
            <p className="flex items-start gap-1.5 text-xs font-medium text-primary">
              <AlertCircle className="mt-px size-3.5 shrink-0" />
              {formError}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              onClick={() => setPendingAction("approve")}
              disabled={isBusy}
              className="h-11 flex-1 gap-2 rounded-xl bg-[#7CB342] font-semibold text-white hover:bg-[#7CB342]/90"
            >
              <CheckCircle2 className="size-4" />
              Phê duyệt
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingAction("request-changes")}
              disabled={isBusy}
              className="h-11 flex-1 gap-2 rounded-xl border-primary/40 font-semibold text-primary"
            >
              <MessageSquareWarning className="size-4" />
              Yêu cầu chỉnh sửa
            </Button>
          </div>

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
          <ConfirmDialog
            isOpen={pendingAction === "request-changes"}
            onOpenChange={(open) => {
              if (!open) setPendingAction(null);
            }}
            title="Yêu cầu chỉnh sửa?"
            description="Chương trình sẽ trả về Manager để chỉnh sửa curriculum."
            confirmLabel="Gửi yêu cầu"
            onConfirm={handleRequestChanges}
          />
        </>
      ) : !canDecide ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
          Bạn không có quyền quyết định thẩm định cho lần nộp này.
        </p>
      ) : null}
    </div>
  );
}
