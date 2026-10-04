"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Beaker,
  BookOpenText,
  ClipboardPen,
  Download,
  Eye,
  ExternalLink,
  FileText,
  GraduationCap,
  ListChecks,
  Sparkles,
} from "lucide-react";

import { AssignmentResultCard } from "@/components/curriculum/assignment-outcome";
import { MentorAssignmentScheduleCard } from "@/components/mentors/mentor-assignment-schedule-card";
import {
  ManagerDataTable,
  type ColumnDef,
} from "@/components/manager/shared/data-table";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogScrollFooter,
  DialogScrollHeader,
  DialogScrollPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useSubmissionTurnedInSync } from "@/hooks/use-class-live-sync";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  getAssignmentById,
  getAssignmentSubmissionById,
  getAssignmentSubmissions,
  getAssignments,
  getQuizResult,
  getResearchMilestonesByModule,
  getResearchSubmissionById,
  getRetrospectiveSubmission,
  gradeAssignmentSubmission,
  gradeResearchSubmission,
  type AssignmentDetail,
  type AssignmentListItem,
  type AssignmentSubmissionListItem,
  type AssignmentSubmissionStatus,
  type AssignmentType,
  type QuizResult,
} from "@/lib/api";
import { buildQuizResultOutcome } from "@/lib/curriculum/build-assignment-outcome";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { fileNameFromUrl } from "@/lib/curriculum/research-staging-storage";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

type GradingMode = "research" | "manual" | "quiz";

const ASSIGNMENT_TYPE_LABELS: Record<AssignmentType, string> = {
  Quiz: "Quiz",
  FileUpload: "Nộp file",
  Retrospective: "Retrospective",
};

const STATUS_LABELS: Record<AssignmentSubmissionStatus, string> = {
  Pending: "Chưa nộp",
  TurnedIn: "Đã nộp",
  Graded: "Đã chấm",
  ReturnedForRevision: "Trả sửa",
};

const STATUS_STYLES: Record<AssignmentSubmissionStatus, string> = {
  Pending: "border-border bg-muted/40 text-muted-foreground",
  TurnedIn: "border-[#4FC3F7]/30 bg-[#4FC3F7]/12 text-[#0d6e9c]",
  Graded: "border-[#7CB342]/30 bg-[#7CB342]/15 text-[#3d5c22]",
  ReturnedForRevision: "border-[#E94B3C]/25 bg-[#E94B3C]/10 text-[#E94B3C]",
};

const MODE_COPY: Record<
  GradingMode,
  { subtitle: string; emptySelect: string; chooseSelect: string }
> = {
  research: {
    subtitle:
      "Research milestone / Capstone — xem file & evidence, chấm qua ResearchSubmission.",
    emptySelect: "Chưa có deliverable research trong chương trình",
    chooseSelect: "Chọn mốc research để chấm…",
  },
  manual: {
    subtitle:
      "Nộp file & Retrospective (không gắn milestone) — mentor chấm điểm và nhận xét.",
    emptySelect: "Chưa có bài nộp file / retrospective thường",
    chooseSelect: "Chọn bài cần chấm…",
  },
  quiz: {
    subtitle: "Quiz tự chấm — mentor chỉ xem điểm / tỉ lệ đúng và đề bài.",
    emptySelect: "Chưa có quiz trong chương trình",
    chooseSelect: "Chọn quiz để xem điểm…",
  },
};

function isRegularManualType(type: AssignmentType): boolean {
  return type === "FileUpload" || type === "Retrospective";
}

function isQuizAssignmentType(type: AssignmentType): boolean {
  return type === "Quiz";
}

function parseGradingMode(value: string | null): GradingMode {
  if (value === "research" || value === "quiz") return value;
  return "manual";
}

type SubmissionArtifactSource = "assignment" | "research" | "retrospective";

type SubmissionArtifact = {
  submissionId: string;
  source: SubmissionArtifactSource;
  code: string | null;
  fileUrl: string | null;
  contentText: string | null;
  evidenceUrls: string[];
  mentorFeedback: string | null;
  assignedGrade: number | null;
  maxPoints: number | null;
  passScore: number | null;
  submittedAt: string | null;
  lastSavedAt: string | null;
};

type ResearchAssignmentMeta = {
  assignmentIds: Set<string>;
  capstoneAssignmentIds: Set<string>;
};

async function loadResearchArtifact(
  submissionId: string,
): Promise<SubmissionArtifact> {
  const result = await getResearchSubmissionById(submissionId);
  const data = result?.data;
  return {
    submissionId,
    source: "research",
    code: data?.code ?? null,
    fileUrl: data?.fileUrl ?? null,
    contentText: data?.contentText ?? null,
    evidenceUrls: (data?.evidenceUrls ?? []).filter(
      (url): url is string => Boolean(url?.trim()),
    ),
    mentorFeedback: data?.mentorFeedback ?? null,
    assignedGrade: data?.assignedGrade ?? null,
    maxPoints: data?.maxPoints ?? null,
    passScore: data?.passScore ?? null,
    submittedAt: data?.submittedAt ?? null,
    lastSavedAt: null,
  };
}

async function loadFileUploadArtifact(
  submissionId: string,
): Promise<SubmissionArtifact> {
  const result = await getAssignmentSubmissionById(submissionId);
  const data = result?.data;
  return {
    submissionId,
    source: "assignment",
    code: data?.code ?? null,
    fileUrl: data?.fileUrl ?? null,
    contentText: data?.contentText ?? null,
    evidenceUrls: [],
    mentorFeedback: data?.mentorFeedback ?? null,
    assignedGrade: data?.assignedGrade ?? null,
    maxPoints: data?.maxPoints ?? null,
    passScore: data?.passScore ?? null,
    submittedAt: data?.submittedAt ?? null,
    lastSavedAt: null,
  };
}

async function loadRetrospectiveArtifact(
  submissionId: string,
): Promise<SubmissionArtifact> {
  const result = await getRetrospectiveSubmission(submissionId);
  const data = result?.data;
  return {
    submissionId,
    source: "retrospective",
    code: null,
    fileUrl: null,
    contentText: data?.contentText ?? null,
    evidenceUrls: [],
    mentorFeedback: data?.mentorFeedback ?? null,
    assignedGrade: data?.assignedGrade ?? null,
    maxPoints: data?.maxPoints ?? null,
    passScore: data?.passScore ?? null,
    submittedAt: data?.submittedAt ?? null,
    lastSavedAt: data?.lastSavedAt ?? null,
  };
}

function SubmissionFileRow({
  url,
  label,
}: {
  url: string;
  label?: string;
}) {
  const fileName = fileNameFromUrl(url) || label || "Tệp đính kèm";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2">
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
        {fileName}
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        nativeButton={false}
        render={<a href={url} target="_blank" rel="noopener noreferrer" />}
        className="h-7 shrink-0 rounded-md px-2 text-xs"
      >
        <ExternalLink className="size-3.5" />
        Xem
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        nativeButton={false}
        render={
          <a
            href={url}
            download={fileName}
            target="_blank"
            rel="noopener noreferrer"
          />
        }
        className="h-7 shrink-0 rounded-md px-2 text-xs"
      >
        <Download className="size-3.5" />
        Tải về
      </Button>
    </div>
  );
}

function SubmissionWorkPanel({
  assignmentType,
  artifact,
  isLoading,
  hasError,
  onRetry,
}: {
  assignmentType: AssignmentType | undefined;
  artifact: SubmissionArtifact | null;
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <div className="space-y-2.5 rounded-xl border border-border bg-background px-5 py-5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[94%]" />
          <Skeleton className="h-4 w-[88%]" />
          <Skeleton className="h-4 w-[96%]" />
          <Skeleton className="h-4 w-[72%]" />
          <Skeleton className="mt-4 h-4 w-[90%]" />
          <Skeleton className="h-4 w-[84%]" />
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          Không tải được bài nộp của học viên.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-3 rounded-lg"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  const fileUrl = artifact?.fileUrl?.trim() || null;
  const contentText = artifact?.contentText?.trim() || null;
  const evidenceUrls = artifact?.evidenceUrls ?? [];
  const isRetrospective = assignmentType === "Retrospective";

  if (!fileUrl && !contentText && evidenceUrls.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          {isRetrospective
            ? "Học viên chưa có nội dung retrospective."
            : "Học viên chưa đính kèm file hoặc nội dung văn bản."}
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="grade-work-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3
          id="grade-work-heading"
          className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-foreground"
        >
          <FileText className="size-4 text-[#0d6e9c]" aria-hidden />
          {isRetrospective ? "Bài viết của học viên" : "Bài nộp của học viên"}
          {artifact?.code ? (
            <span className="font-mono text-xs font-normal text-muted-foreground">
              · {artifact.code}
            </span>
          ) : null}
          {artifact?.source === "research" ? (
            <Badge
              variant="outline"
              className="rounded-full border-[#7CB342]/30 bg-[#7CB342]/12 px-1.5 py-0 text-[10px] font-semibold text-[#3d5c22]"
            >
              Research
            </Badge>
          ) : null}
        </h3>
        {contentText ? (
          <p className="text-xs tabular-nums text-muted-foreground">
            {countWords(contentText)} từ · {contentText.length} ký tự
          </p>
        ) : null}
      </div>

      {fileUrl ? <SubmissionFileRow url={fileUrl} /> : null}

      {evidenceUrls.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Evidence
          </p>
          {evidenceUrls.map((url) => (
            <SubmissionFileRow key={url} url={url} label="Evidence" />
          ))}
        </div>
      ) : null}

      {contentText ? (
        <article className="rounded-xl border border-border bg-background px-5 py-4 sm:px-7 sm:py-6">
          <p className="max-w-[70ch] whitespace-pre-wrap break-words text-[15px] leading-7 text-foreground">
            {contentText}
          </p>
        </article>
      ) : null}
    </section>
  );
}

const PROMPT_COLLAPSE_THRESHOLD = 240;

function GradingPromptBlock({
  assignment,
  isLoading,
}: {
  assignment: AssignmentDetail | null;
  isLoading: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading && !assignment) {
    return (
      <div className="space-y-2 rounded-xl bg-muted/40 px-4 py-3">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  const description = assignment?.description?.trim() || "";
  const isLong = description.length > PROMPT_COLLAPSE_THRESHOLD;

  return (
    <section
      aria-labelledby="grade-prompt-heading"
      className="rounded-xl bg-muted/40 px-4 py-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3
          id="grade-prompt-heading"
          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
        >
          <BookOpenText className="size-3.5 text-primary" aria-hidden />
          Đề bài
          {assignment?.title?.trim() ? (
            <span className="font-normal normal-case tracking-normal text-foreground">
              · {assignment.title.trim()}
            </span>
          ) : null}
        </h3>
        {assignment ? (
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            Đạt {assignment.passScore}/{assignment.maxPoints}
          </span>
        ) : null}
      </div>
      {description ? (
        <p
          className={cn(
            "mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85",
            isLong && !isExpanded && "line-clamp-3",
          )}
        >
          {description}
        </p>
      ) : (
        <p className="mt-1.5 text-sm text-muted-foreground">
          Bài này chưa có mô tả / hướng dẫn chi tiết.
        </p>
      )}
      {isLong ? (
        <button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          aria-expanded={isExpanded}
          className="mt-1 rounded text-xs font-medium text-[#0d6e9c] hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {isExpanded ? "Thu gọn" : "Xem toàn bộ đề"}
        </button>
      ) : null}
    </section>
  );
}

const FEEDBACK_MAX_LENGTH = 4000;

type GradeSubmissionDialogProps = {
  target: AssignmentSubmissionListItem | null;
  mode: GradingMode;
  assignmentType: AssignmentType | undefined;
  assignment: AssignmentDetail | null;
  isAssignmentLoading: boolean;
  artifact: SubmissionArtifact | null;
  isArtifactLoading: boolean;
  hasArtifactError: boolean;
  onRetryArtifact: () => void;
  gradeValue: string;
  onGradeValueChange: (value: string) => void;
  feedback: string;
  onFeedbackChange: (value: string) => void;
  returnForRevision: boolean;
  onReturnForRevisionChange: (value: boolean) => void;
  isGrading: boolean;
  onClose: () => void;
  onSave: () => void;
};

/**
 * Two-pane grading workspace: student work + prompt on the left,
 * score / feedback form on the right (stacked on small screens).
 */
function GradeSubmissionDialog({
  target,
  mode,
  assignmentType,
  assignment,
  isAssignmentLoading,
  artifact,
  isArtifactLoading,
  hasArtifactError,
  onRetryArtifact,
  gradeValue,
  onGradeValueChange,
  feedback,
  onFeedbackChange,
  returnForRevision,
  onReturnForRevisionChange,
  isGrading,
  onClose,
  onSave,
}: GradeSubmissionDialogProps) {
  const maxPoints = artifact?.maxPoints ?? assignment?.maxPoints ?? null;
  const passScore = artifact?.passScore ?? assignment?.passScore ?? null;
  const score = evaluateScore(gradeValue, maxPoints);
  const isPassing =
    score.value != null && passScore != null ? score.value >= passScore : null;

  const submittedAt = formatApiDateTimeDisplay(
    artifact?.submittedAt ?? target?.submittedAt ?? null,
  );
  const lastSavedAt = formatApiDateTimeDisplay(artifact?.lastSavedAt ?? null);
  const typeLabel =
    mode === "research"
      ? "Research"
      : assignmentType
        ? ASSIGNMENT_TYPE_LABELS[assignmentType]
        : null;

  return (
    <Dialog
      open={target != null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogScrollPopup className="max-h-[min(92dvh,56rem)] sm:max-w-5xl lg:h-[min(92dvh,56rem)]">
        <DialogScrollHeader>
          <DialogClose />
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {mode === "research" ? "Chấm Research" : "Chấm bài"}
            {typeLabel ? ` · ${typeLabel}` : ""}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <DialogTitle className="text-lg">
              {target?.studentName?.trim() || "Học viên"}
            </DialogTitle>
            {target ? (
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full px-2 py-0 text-[10px] font-semibold",
                  STATUS_STYLES[target.status],
                )}
              >
                {STATUS_LABELS[target.status]}
              </Badge>
            ) : null}
          </div>
          <DialogDescription className="mt-1 text-xs">
            Lần nộp #{target?.attemptNumber}
            {submittedAt ? ` · Nộp lúc ${submittedAt}` : ""}
            {lastSavedAt && lastSavedAt !== submittedAt
              ? ` · Lưu nháp cuối ${lastSavedAt}`
              : ""}
          </DialogDescription>
        </DialogScrollHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain lg:flex-row lg:overflow-hidden">
          <div className="min-w-0 flex-1 space-y-4 px-6 py-5 lg:overflow-y-auto lg:overscroll-contain lg:[scrollbar-gutter:stable]">
            <GradingPromptBlock
              key={target?.submissionId}
              assignment={assignment}
              isLoading={isAssignmentLoading}
            />
            <SubmissionWorkPanel
              assignmentType={assignmentType}
              artifact={artifact}
              isLoading={isArtifactLoading}
              hasError={hasArtifactError}
              onRetry={onRetryArtifact}
            />
          </div>

          <aside
            aria-label="Chấm điểm"
            className="flex shrink-0 flex-col gap-5 border-t border-border bg-muted/25 px-6 py-5 lg:w-[22rem] lg:overflow-y-auto lg:border-t-0 lg:border-l"
          >
            <div className="space-y-2">
              <Label htmlFor="grade-score">Điểm</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  id="grade-score"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={maxPoints ?? undefined}
                  step="0.1"
                  value={gradeValue}
                  onChange={(event) => onGradeValueChange(event.target.value)}
                  aria-invalid={score.error != null}
                  aria-describedby="grade-score-hint"
                  className="h-12 w-28 rounded-xl bg-background text-center font-mono text-lg font-semibold tabular-nums"
                />
                {maxPoints != null ? (
                  <span className="font-mono text-lg tabular-nums text-muted-foreground">
                    / {maxPoints}
                  </span>
                ) : null}
                {isPassing != null ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      isPassing
                        ? STATUS_STYLES.Graded
                        : STATUS_STYLES.ReturnedForRevision,
                    )}
                  >
                    {isPassing ? "Đạt" : "Chưa đạt"}
                  </Badge>
                ) : null}
              </div>
              <p
                id="grade-score-hint"
                className={cn(
                  "text-xs",
                  score.error ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {score.error ??
                  (passScore != null
                    ? `Cần từ ${passScore} điểm trở lên để đạt.`
                    : "Nhập điểm cho bài nộp.")}
              </p>
            </div>

            <div className="flex flex-col gap-2 lg:min-h-0 lg:flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor="grade-feedback">Nhận xét cho học viên</Label>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {feedback.length}/{FEEDBACK_MAX_LENGTH}
                </span>
              </div>
              <Textarea
                id="grade-feedback"
                value={feedback}
                maxLength={FEEDBACK_MAX_LENGTH}
                onChange={(event) => onFeedbackChange(event.target.value)}
                placeholder="Điểm mạnh, điều cần cải thiện, gợi ý cho lần sau…"
                className="min-h-44 resize-y bg-background text-sm leading-relaxed lg:min-h-56 lg:flex-1"
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
              <div className="space-y-0.5">
                <p className="text-xs font-medium">Trả lại để sửa</p>
                <p className="text-[11px] text-muted-foreground">
                  Học viên sẽ nộp lại thay vì kết thúc chấm.
                </p>
              </div>
              <Switch
                checked={returnForRevision}
                onCheckedChange={onReturnForRevisionChange}
                aria-label="Trả lại để sửa"
              />
            </div>
          </aside>
        </div>

        <DialogScrollFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isGrading}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={isGrading || score.value == null}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isGrading
              ? "Đang lưu…"
              : returnForRevision
                ? "Trả bài để sửa"
                : "Lưu điểm"}
          </Button>
        </DialogScrollFooter>
      </DialogScrollPopup>
    </Dialog>
  );
}

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

type ScoreCheck = { value: number | null; error: string | null };

function evaluateScore(raw: string, maxPoints: number | null): ScoreCheck {
  const trimmed = raw.trim();
  if (!trimmed) return { value: null, error: null };
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    return { value: null, error: "Điểm phải là số không âm." };
  }
  if (maxPoints != null && value > maxPoints) {
    return { value: null, error: `Điểm tối đa là ${maxPoints}.` };
  }
  return { value, error: null };
}

function AssignmentPromptDialog({
  assignment,
  open,
  onOpenChange,
  isLoading,
  hasError,
  onRetry,
}: {
  assignment: AssignmentDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
}) {
  const description = assignment?.description?.trim() || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-lg">
        <DialogClose />
        <DialogHeader>
          <DialogTitle>Đề bài</DialogTitle>
          <DialogDescription>
            Nội dung đề giống học viên nhìn thấy khi làm bài.
          </DialogDescription>
        </DialogHeader>

        {hasError ? (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground">Không tải được đề bài.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-3 rounded-lg"
            >
              Thử lại
            </Button>
          </div>
        ) : isLoading && !assignment ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ) : assignment ? (
          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-heading min-w-0 flex-1 text-lg font-bold text-foreground">
                  {assignment.title?.trim() || assignment.code || "Bài tập"}
                </h3>
                <Badge variant="outline" className="rounded-full text-[10px]">
                  {ASSIGNMENT_TYPE_LABELS[assignment.assignmentType]}
                </Badge>
              </div>
              {assignment.code ? (
                <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  {assignment.code}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2 rounded-xl border border-border bg-muted/30 p-3 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Điểm tối đa
                </p>
                <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
                  {assignment.maxPoints}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Điểm đạt
                </p>
                <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
                  {assignment.passScore}
                </p>
              </div>
              {assignment.assignmentType === "Quiz" ? (
                <>
                  {assignment.questionCount != null ? (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Số câu
                      </p>
                      <p className="font-mono text-sm tabular-nums text-foreground">
                        {assignment.questionCount}
                      </p>
                    </div>
                  ) : null}
                  {assignment.timeLimitMinutes != null ? (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Thời gian
                      </p>
                      <p className="font-mono text-sm tabular-nums text-foreground">
                        {assignment.timeLimitMinutes} phút
                      </p>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>

            <div className="rounded-xl border border-border bg-background px-3 py-3">
              <p className="mb-1.5 text-xs font-semibold text-foreground">
                Yêu cầu đề bài
              </p>
              {description ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Bài này chưa có mô tả / hướng dẫn chi tiết.
                </p>
              )}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

type MentorClassGradingPanelProps = {
  classId: string;
  programId: string;
  classEndDate?: string | null;
  initialAssignmentId?: string | null;
  /**
   * When true, hide mode tabs + assignment picker — used inside Chương trình
   * where the tree already selected the assignment.
   */
  embedded?: boolean;
};

export function MentorClassGradingPanel({
  classId,
  programId,
  classEndDate = null,
  initialAssignmentId = null,
  embedded = false,
}: MentorClassGradingPanelProps) {
  const [mode, setMode] = useState<GradingMode>("manual");
  const [assignmentId, setAssignmentId] = useState("");
  const [gradeTarget, setGradeTarget] =
    useState<AssignmentSubmissionListItem | null>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [feedback, setFeedback] = useState("");
  const [returnForRevision, setReturnForRevision] = useState(false);
  const [hydratedArtifact, setHydratedArtifact] =
    useState<SubmissionArtifact | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [quizPreview, setQuizPreview] = useState<{
    result: QuizResult;
    hideQuestionStats: boolean;
  } | null>(null);
  const [isQuizPreviewLoading, setIsQuizPreviewLoading] = useState(false);
  const [isPromptOpen, setIsPromptOpen] = useState(false);

  const { data: assignmentsData, isLoading: isAssignmentsLoading } =
    useClientFetch({
      fetcher: async () => {
        const result = await getAssignments({
          programId,
          page: 1,
          pageSize: 100,
          sortBy: "title",
          isDescending: false,
        });
        return result?.data?.items ?? [];
      },
      deps: [programId],
      onError: (error) =>
        showAppErrorFromUnknown(error, "assignments.submissions.list"),
    });

  const assignments = assignmentsData ?? [];

  const allModuleIdsKey = useMemo(() => {
    const ids = [
      ...new Set(
        assignments
          .map((item) => item.moduleId)
          .filter((id): id is string => Boolean(id)),
      ),
    ].sort();
    return ids.join(",");
  }, [assignments]);

  const { data: researchAssignmentMeta } = useClientFetch({
    enabled: Boolean(allModuleIdsKey),
    fetcher: async (): Promise<ResearchAssignmentMeta> => {
      try {
        const moduleIds = allModuleIdsKey.split(",").filter(Boolean);
        const results = await Promise.all(
          moduleIds.map((moduleId) => getResearchMilestonesByModule(moduleId)),
        );

        const assignmentIds = new Set<string>();
        const capstoneAssignmentIds = new Set<string>();

        for (const result of results) {
          for (const milestone of result?.data ?? []) {
            const linkedId =
              milestone.assignmentId ?? milestone.assignment?.id ?? null;
            if (!linkedId) continue;
            assignmentIds.add(linkedId);
            if (milestone.isCapstone) {
              capstoneAssignmentIds.add(linkedId);
            }
          }
        }

        return { assignmentIds, capstoneAssignmentIds };
      } catch {
        return {
          assignmentIds: new Set(),
          capstoneAssignmentIds: new Set(),
        };
      }
    },
    deps: [allModuleIdsKey],
  });

  const researchIdSet = researchAssignmentMeta?.assignmentIds;

  const researchAssignments = useMemo(() => {
    if (!researchIdSet) return [];
    return assignments.filter((item) => researchIdSet.has(item.id));
  }, [assignments, researchIdSet]);

  const manualAssignments = useMemo(() => {
    return assignments.filter((item) => {
      if (!isRegularManualType(item.assignmentType)) return false;
      // Until milestone map loads, keep FileUpload out of "Bài thường"
      // so Capstone never opens via assignment-submissions by mistake.
      if (!researchIdSet) return item.assignmentType === "Retrospective";
      return !researchIdSet.has(item.id);
    });
  }, [assignments, researchIdSet]);

  const quizAssignments = useMemo(
    () => assignments.filter((item) => isQuizAssignmentType(item.assignmentType)),
    [assignments],
  );

  const visibleAssignments =
    mode === "research"
      ? researchAssignments
      : mode === "manual"
        ? manualAssignments
        : quizAssignments;

  const selectedAssignment = visibleAssignments.find(
    (item) => item.id === assignmentId,
  );

  const canGradeInMode = mode === "research" || mode === "manual";

  const {
    data: assignmentDetail,
    isLoading: isAssignmentDetailLoading,
    hasError: hasAssignmentDetailError,
    retry: retryAssignmentDetail,
  } = useClientFetch({
    enabled: !!assignmentId,
    fetcher: async () => {
      const result = await getAssignmentById(assignmentId);
      return result?.data ?? null;
    },
    deps: [assignmentId],
    onError: (error) =>
      showAppErrorFromUnknown(error, "assignments.submissions.list"),
  });

  const {
    data: submissionsData,
    isLoading: isSubmissionsLoading,
    markLoading,
    retry,
    mutate: mutateSubmissions,
  } = useClientFetch({
    enabled: !!assignmentId,
    fetcher: async () => {
      const result = await getAssignmentSubmissions(assignmentId, classId);
      return result?.data ?? [];
    },
    deps: [assignmentId, classId],
    onError: (error) =>
      showAppErrorFromUnknown(error, "assignments.submissions.list"),
  });

  const appliedInitialRef = useRef<{ id: string; mode: GradingMode } | null>(
    null,
  );

  useEffect(() => {
    if (!initialAssignmentId || assignments.length === 0) return;
    const item = assignments.find((a) => a.id === initialAssignmentId);
    if (!item) return;

    let nextMode: GradingMode;
    if (isQuizAssignmentType(item.assignmentType)) {
      nextMode = "quiz";
    } else if (isRegularManualType(item.assignmentType)) {
      // FileUpload may be a research milestone — wait for the map before choosing mode.
      if (item.assignmentType === "FileUpload" && !researchIdSet) return;
      nextMode = researchIdSet?.has(item.id) ? "research" : "manual";
    } else {
      return;
    }

    // Re-runs (e.g. research map arriving late) must not markLoading() again:
    // assignmentId is unchanged, so no refetch would ever clear the skeleton.
    const applied = appliedInitialRef.current;
    if (applied?.id === initialAssignmentId) {
      if (applied.mode !== nextMode) {
        appliedInitialRef.current = { id: initialAssignmentId, mode: nextMode };
        setMode(nextMode);
      }
      return;
    }

    appliedInitialRef.current = { id: initialAssignmentId, mode: nextMode };
    markLoading();
    setMode(nextMode);
    setAssignmentId(initialAssignmentId);
    setGradeTarget(null);
    setQuizPreview(null);
  }, [initialAssignmentId, assignments, researchIdSet, markLoading]);

  const submissions = submissionsData ?? [];
  const isAssignmentDetailPending =
    Boolean(assignmentId) &&
    (isAssignmentDetailLoading ||
      (assignmentDetail != null && assignmentDetail.id !== assignmentId));
  const isSubmissionsPending =
    Boolean(assignmentId) &&
    (isSubmissionsLoading || isAssignmentDetailPending);

  const pendingGradeCount = useMemo(
    () => submissions.filter((row) => row.status === "TurnedIn").length,
    [submissions],
  );

  const {
    data: submissionArtifact,
    isLoading: isArtifactLoading,
    hasError: hasArtifactError,
    retry: retryArtifact,
    mutate: mutateArtifact,
  } = useClientFetch({
    enabled: gradeTarget != null && canGradeInMode,
    fetcher: async (): Promise<SubmissionArtifact | null> => {
      if (!gradeTarget || !selectedAssignment) return null;

      if (mode === "research") {
        return loadResearchArtifact(gradeTarget.submissionId);
      }

      if (selectedAssignment.assignmentType === "Retrospective") {
        return loadRetrospectiveArtifact(gradeTarget.submissionId);
      }

      return loadFileUploadArtifact(gradeTarget.submissionId);
    },
    deps: [
      gradeTarget?.submissionId,
      selectedAssignment?.assignmentType,
      mode,
    ],
    onError: (error) =>
      showAppErrorFromUnknown(error, "assignments.submissions.list"),
  });

  useSubmissionTurnedInSync(classId, async (event) => {
    if (!assignmentId) return;
    if (event && event.assignmentId !== assignmentId) return;

    try {
      const list = await getAssignmentSubmissions(assignmentId, classId);
      mutateSubmissions(list?.data ?? []);
    } catch {
      /* Sync hints are best-effort. */
    }

    const openSubmissionId = gradeTarget?.submissionId;
    if (!openSubmissionId) return;
    if (event && event.submissionId !== openSubmissionId) return;
    if (!canGradeInMode || !selectedAssignment) return;

    try {
      const artifact =
        mode === "research"
          ? await loadResearchArtifact(openSubmissionId)
          : selectedAssignment.assignmentType === "Retrospective"
            ? await loadRetrospectiveArtifact(openSubmissionId)
            : await loadFileUploadArtifact(openSubmissionId);
      mutateArtifact(artifact);
    } catch {
      /* Sync hints are best-effort. */
    }
  });

  // useClientFetch keeps the previous target's data while refetching.
  const activeArtifact =
    submissionArtifact &&
    submissionArtifact.submissionId === gradeTarget?.submissionId
      ? submissionArtifact
      : null;

  // Hydrate the form whenever detail for the open submission arrives.
  if (gradeTarget && activeArtifact && hydratedArtifact !== activeArtifact) {
    setHydratedArtifact(activeArtifact);
    if (activeArtifact.mentorFeedback?.trim()) {
      setFeedback(activeArtifact.mentorFeedback);
    }
    if (
      (gradeTarget.assignedGrade == null || gradeValue === "") &&
      activeArtifact.assignedGrade != null
    ) {
      setGradeValue(String(activeArtifact.assignedGrade));
    }
  }

  function handleModeChange(nextMode: string | null) {
    const value = parseGradingMode(nextMode);
    if (value === mode) return;
    setMode(value);
    setAssignmentId("");
    setGradeTarget(null);
    setQuizPreview(null);
    setIsPromptOpen(false);
  }

  async function handleViewQuiz(row: AssignmentSubmissionListItem) {
    const fallbackFromList = (): QuizResult | null => {
      if (!assignmentDetail || row.assignedGrade == null) return null;
      return {
        submissionId: row.submissionId,
        assignmentId: assignmentDetail.id,
        studentId: row.studentId,
        studentName: row.studentName,
        attemptNumber: row.attemptNumber,
        startedAt: null,
        assignedGrade: row.assignedGrade,
        maxPoints: assignmentDetail.maxPoints,
        passScore: assignmentDetail.passScore,
        passed: row.passed ?? false,
        correctCount: 0,
        totalQuestions: assignmentDetail.questionCount ?? 0,
        status: row.status,
        submittedAt: row.submittedAt,
      };
    };

    try {
      setIsQuizPreviewLoading(true);
      setQuizPreview(null);
      const result = await getQuizResult(row.submissionId);
      const data = result?.data;
      if (data) {
        setQuizPreview({ result: data, hideQuestionStats: false });
        return;
      }

      const fallback = fallbackFromList();
      if (fallback) {
        setQuizPreview({ result: fallback, hideQuestionStats: true });
        return;
      }

      throw new Error("Không có dữ liệu kết quả quiz");
    } catch (error) {
      const fallback = fallbackFromList();
      if (fallback) {
        setQuizPreview({ result: fallback, hideQuestionStats: true });
        return;
      }
      setQuizPreview(null);
      showAppErrorFromUnknown(error, "assignments.quiz.result");
    } finally {
      setIsQuizPreviewLoading(false);
    }
  }

  const manualColumns = useMemo<ColumnDef<AssignmentSubmissionListItem>[]>(
    () => [
      {
        header: "Học viên",
        render: (row) => (
          <span className="font-medium text-foreground">
            {row.studentName?.trim() || "Học viên"}
          </span>
        ),
      },
      {
        header: "Lần",
        render: (row) => (
          <span className="font-mono text-xs text-muted-foreground">
            #{row.attemptNumber}
          </span>
        ),
      },
      {
        header: "Trạng thái",
        render: (row) => (
          <Badge
            variant="outline"
            className={cn(
              "rounded-full px-2 py-0 text-[10px] font-semibold",
              STATUS_STYLES[row.status],
            )}
          >
            {STATUS_LABELS[row.status]}
          </Badge>
        ),
      },
      {
        header: "Điểm mentor",
        render: (row) => (
          <span className="font-mono text-sm">
            {row.assignedGrade != null ? row.assignedGrade : "—"}
            {row.passed == null ? null : row.passed ? (
              <span className="ml-1 text-[10px] text-[#7CB342]">Đạt</span>
            ) : (
              <span className="ml-1 text-[10px] text-[#E94B3C]">Chưa đạt</span>
            )}
          </span>
        ),
      },
      {
        header: "Nộp lúc",
        render: (row) => (
          <span className="text-xs text-muted-foreground">
            {formatApiDateTimeDisplay(row.submittedAt) || "—"}
          </span>
        ),
      },
      {
        header: "",
        sticky: "right",
        className: "w-36 text-center",
        render: (row) => {
          const canGrade =
            row.status === "TurnedIn" || row.status === "Graded";

          if (!canGrade) {
            return (
              <span className="inline-flex w-full justify-center text-[11px] text-muted-foreground">
                —
              </span>
            );
          }

          return (
            <div className="flex w-full justify-center">
              <Button
                type="button"
                size="sm"
                variant={row.status === "TurnedIn" ? "default" : "outline"}
                className={cn(
                  "h-7 rounded-md px-2.5 text-xs",
                  row.status === "TurnedIn" &&
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
                onClick={() => {
                  setGradeTarget(row);
                  setGradeValue(
                    row.assignedGrade != null ? String(row.assignedGrade) : "",
                  );
                  setFeedback("");
                  setReturnForRevision(false);
                  setHydratedArtifact(null);
                }}
              >
                <ClipboardPen className="size-3.5" />
                {row.status === "TurnedIn" ? "Chấm bài" : "Sửa điểm"}
              </Button>
            </div>
          );
        },
      },
    ],
    [],
  );

  const quizColumns = useMemo<ColumnDef<AssignmentSubmissionListItem>[]>(
    () => [
      {
        header: "Học viên",
        render: (row) => (
          <span className="font-medium text-foreground">
            {row.studentName?.trim() || "Học viên"}
          </span>
        ),
      },
      {
        header: "Lần",
        render: (row) => (
          <span className="font-mono text-xs text-muted-foreground">
            #{row.attemptNumber}
          </span>
        ),
      },
      {
        header: "Trạng thái",
        render: (row) => (
          <Badge
            variant="outline"
            className={cn(
              "rounded-full px-2 py-0 text-[10px] font-semibold",
              STATUS_STYLES[row.status],
            )}
          >
            {STATUS_LABELS[row.status]}
          </Badge>
        ),
      },
      {
        header: "Điểm tự chấm",
        render: (row) => (
          <span className="font-mono text-sm tabular-nums">
            {row.assignedGrade != null ? row.assignedGrade : "—"}
            {row.passed == null ? null : row.passed ? (
              <span className="ml-1 text-[10px] text-[#7CB342]">Đạt</span>
            ) : (
              <span className="ml-1 text-[10px] text-[#E94B3C]">Chưa đạt</span>
            )}
          </span>
        ),
      },
      {
        header: "Nộp lúc",
        render: (row) => (
          <span className="text-xs text-muted-foreground">
            {formatApiDateTimeDisplay(row.submittedAt) || "—"}
          </span>
        ),
      },
      {
        header: "",
        sticky: "right",
        className: "w-36 text-center",
        render: (row) => {
          if (row.status !== "Graded") {
            return (
              <span className="inline-flex w-full justify-center text-[11px] text-muted-foreground">
                {row.status === "Pending" ? "Chưa làm" : "Đang làm"}
              </span>
            );
          }

          return (
            <div className="flex w-full justify-center">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 rounded-md px-2.5 text-xs"
                onClick={() => void handleViewQuiz(row)}
              >
                <Eye className="size-3.5" />
                Xem kết quả
              </Button>
            </div>
          );
        },
      },
    ],
    [],
  );

  async function handleSaveGrade() {
    if (!gradeTarget) return;
    const score = evaluateScore(
      gradeValue,
      activeArtifact?.maxPoints ?? assignmentDetail?.maxPoints ?? null,
    );
    if (score.value == null) {
      showAppErrorFromUnknown(
        new Error(score.error ?? "Điểm không hợp lệ"),
        "assignments.submissions.grade",
      );
      return;
    }
    const assignedGrade = score.value;

    try {
      setIsGrading(true);
      const payload = {
        assignedGrade,
        mentorFeedback: feedback.trim() ? feedback.trim() : null,
        returnForRevision,
      };

      if (mode === "research") {
        await gradeResearchSubmission(gradeTarget.submissionId, payload);
      } else {
        await gradeAssignmentSubmission(gradeTarget.submissionId, payload);
      }

      showAppSuccess({
        title: returnForRevision ? "Đã trả bài để sửa" : "Đã chấm bài",
        description: gradeTarget.studentName?.trim() || "Học viên",
      });
      setGradeTarget(null);
      markLoading();
      retry();
    } catch (error) {
      showAppErrorFromUnknown(error, "assignments.submissions.grade");
    } finally {
      setIsGrading(false);
    }
  }

  return (
    <>
      <section
        className={cn(
          "overflow-hidden bg-card",
          embedded
            ? "border-0 shadow-none"
            : "rounded-2xl border border-border shadow-sm",
        )}
      >
        <Tabs value={mode} onValueChange={handleModeChange} className="gap-0">
          {!embedded ? (
            <div className="border-b border-border bg-muted/40 px-4 pt-4 sm:px-6">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ClipboardPen className="size-4 text-primary" />
                    Chấm bài
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {MODE_COPY[mode].subtitle}
                  </p>
                </div>
                {selectedAssignment && canGradeInMode && pendingGradeCount > 0 ? (
                  <Badge className="rounded-full bg-[#4FC3F7]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#0d6e9c] hover:bg-[#4FC3F7]/15">
                    {pendingGradeCount} chờ chấm
                  </Badge>
                ) : null}
              </div>

              <TabsList
                variant="line"
                className="h-auto w-full justify-center gap-0 rounded-none border-b-0 bg-transparent p-0"
              >
                <TabsTrigger
                  value="research"
                  className="flex-1 justify-center rounded-none px-3 py-2.5 text-sm data-active:text-primary"
                >
                  <Beaker className="size-4" />
                  Research
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {researchAssignments.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="manual"
                  className="flex-1 justify-center rounded-none px-3 py-2.5 text-sm data-active:text-primary"
                >
                  <ListChecks className="size-4" />
                  Bài thường
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {manualAssignments.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="quiz"
                  className="flex-1 justify-center rounded-none px-3 py-2.5 text-sm data-active:text-primary"
                >
                  <Sparkles className="size-4" />
                  Quiz · xem điểm
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {quizAssignments.length}
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>
          ) : null}

          <div
            className={cn(
              "flex flex-row items-stretch",
              embedded ? "min-h-[420px]" : "min-h-[480px]",
            )}
          >
            {/* Assignment picker — hidden when embedded in curriculum tree */}
            {!embedded ? (
            <aside className="flex w-[min(300px,34%)] min-w-[220px] shrink-0 flex-col border-r border-border bg-muted/25">
              <div className="shrink-0 border-b border-border px-3 py-2.5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {mode === "research"
                    ? "Mốc Research"
                    : mode === "quiz"
                      ? "Quiz"
                      : "Bài tập"}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {isAssignmentsLoading
                    ? "Đang tải…"
                    : `${visibleAssignments.length} mục`}
                </p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
                {isAssignmentsLoading ? (
                  <div className="space-y-2 p-1">
                    <Skeleton className="h-14 w-full rounded-lg" />
                    <Skeleton className="h-14 w-full rounded-lg" />
                    <Skeleton className="h-14 w-full rounded-lg" />
                  </div>
                ) : visibleAssignments.length === 0 ? (
                  <p className="px-2 py-6 text-center text-xs leading-relaxed text-muted-foreground">
                    {MODE_COPY[mode].emptySelect}
                  </p>
                ) : (
                  <ul className="space-y-1" role="listbox" aria-label="Chọn bài để chấm">
                    {visibleAssignments.map((item: AssignmentListItem) => {
                      const isSelected = item.id === assignmentId;
                      const isCapstone =
                        researchAssignmentMeta?.capstoneAssignmentIds.has(
                          item.id,
                        ) ?? false;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              if (item.id === assignmentId) return;
                              markLoading();
                              setAssignmentId(item.id);
                              setIsPromptOpen(false);
                            }}
                            className={cn(
                              "flex w-full flex-col gap-0.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
                              isSelected
                                ? "border-[#4FC3F7]/40 bg-[#4FC3F7]/12"
                                : "border-transparent hover:border-border hover:bg-muted/60",
                            )}
                          >
                            <span className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={cn(
                                  "line-clamp-2 text-[12.5px] leading-snug",
                                  isSelected
                                    ? "font-semibold text-[#0d6e9c]"
                                    : "font-medium text-foreground",
                                )}
                              >
                                {item.title || item.code || "Bài tập"}
                              </span>
                              {mode === "research" && isCapstone ? (
                                <Badge
                                  variant="outline"
                                  className="rounded-full border-[#7CB342]/30 bg-[#7CB342]/12 px-1.5 py-0 text-[10px] font-semibold text-[#3d5c22]"
                                >
                                  Capstone
                                </Badge>
                              ) : null}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {mode === "research"
                                ? "ResearchSubmission"
                                : ASSIGNMENT_TYPE_LABELS[item.assignmentType]}
                              {item.code ? ` · ${item.code}` : ""}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </aside>
            ) : null}

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              {assignmentId ? (
                <div className="flex shrink-0 flex-col gap-2 border-b border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <BookOpenText className="size-3.5 text-primary" />
                      Đề bài
                    </p>
                    {isAssignmentDetailPending ? (
                      <Skeleton className="h-4 w-3/4" />
                    ) : (
                      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {assignmentDetail?.description?.trim() ||
                          "Chưa có mô tả đề — bấm Xem đề để xem điểm tối đa / điểm đạt."}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsPromptOpen(true)}
                    className="h-8 shrink-0 rounded-lg text-xs"
                  >
                    <BookOpenText className="size-3.5" />
                    Xem đề đầy đủ
                  </Button>
                </div>
              ) : null}

              {assignmentId &&
              assignmentDetail &&
              assignmentDetail.id === assignmentId ? (
                <div className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
                  <MentorAssignmentScheduleCard
                    classId={classId}
                    assignment={assignmentDetail}
                    classEndDate={classEndDate}
                  />
                </div>
              ) : assignmentId && isAssignmentDetailPending ? (
                <div className="shrink-0 space-y-2 border-b border-border px-4 py-3 sm:px-5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
              ) : null}

              <div className="min-h-0 flex-1 overflow-x-auto p-4 sm:p-5">
                {!assignmentId ? (
                  <ManagerEmptyState
                    title={
                      mode === "research"
                        ? "Chọn mốc Research"
                        : mode === "quiz"
                          ? "Chọn quiz để xem điểm"
                          : "Chọn bài thường"
                    }
                    description={
                      mode === "research"
                        ? "Chọn mốc bên trái — xem file, evidence và chấm qua ResearchSubmission."
                        : mode === "quiz"
                          ? "Chọn quiz bên trái. Hệ thống tự chấm — bạn chỉ xem điểm và đề bài."
                          : "Chọn bài bên trái — FileUpload / Retrospective không gắn research milestone."
                    }
                    icon={
                      mode === "research"
                        ? Beaker
                        : mode === "quiz"
                          ? GraduationCap
                          : ClipboardPen
                    }
                  />
                ) : mode === "quiz" ? (
                  <ManagerDataTable
                    columns={quizColumns}
                    data={submissions}
                    isLoading={isSubmissionsPending}
                    emptyState={
                      <ManagerEmptyState
                        title="Chưa có kết quả quiz"
                        description="Học viên chưa hoàn thành quiz này."
                        icon={Sparkles}
                      />
                    }
                  />
                ) : (
                  <ManagerDataTable
                    columns={manualColumns}
                    data={submissions}
                    isLoading={isSubmissionsPending}
                    emptyState={
                      <ManagerEmptyState
                        title={
                          mode === "research"
                            ? "Chưa có bài nộp research"
                            : "Chưa có bài nộp"
                        }
                        description={
                          mode === "research"
                            ? "Học viên active trong lớp chưa có ResearchSubmission cho mốc này."
                            : "Học viên active trong lớp chưa nộp bài này."
                        }
                        icon={mode === "research" ? Beaker : ClipboardPen}
                      />
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </Tabs>
      </section>

      <GradeSubmissionDialog
        target={gradeTarget}
        mode={mode}
        assignmentType={selectedAssignment?.assignmentType}
        assignment={
          assignmentDetail && assignmentDetail.id === assignmentId
            ? assignmentDetail
            : null
        }
        isAssignmentLoading={isAssignmentDetailPending}
        artifact={activeArtifact}
        isArtifactLoading={
          !hasArtifactError && (isArtifactLoading || !activeArtifact)
        }
        hasArtifactError={hasArtifactError}
        onRetryArtifact={retryArtifact}
        gradeValue={gradeValue}
        onGradeValueChange={setGradeValue}
        feedback={feedback}
        onFeedbackChange={setFeedback}
        returnForRevision={returnForRevision}
        onReturnForRevisionChange={setReturnForRevision}
        isGrading={isGrading}
        onClose={() => setGradeTarget(null)}
        onSave={() => void handleSaveGrade()}
      />

      <Dialog
        open={quizPreview != null || isQuizPreviewLoading}
        onOpenChange={(open) => {
          if (!open) {
            setQuizPreview(null);
            setIsQuizPreviewLoading(false);
          }
        }}
      >
        <DialogPopup className="sm:max-w-md">
          <DialogClose />
          <DialogHeader>
            <DialogTitle>Kết quả quiz</DialogTitle>
            <DialogDescription>
              {quizPreview?.result.studentName?.trim() ||
                "Điểm do hệ thống tự chấm — mentor chỉ xem."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {isQuizPreviewLoading && !quizPreview ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : quizPreview ? (
              <AssignmentResultCard
                {...buildQuizResultOutcome(quizPreview.result, {
                  viewer: "mentor",
                  hideQuestionStats: quizPreview.hideQuestionStats,
                })}
                className="max-w-none"
              />
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                setQuizPreview(null);
                setIsQuizPreviewLoading(false);
              }}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
      <AssignmentPromptDialog
        assignment={assignmentDetail ?? null}
        open={isPromptOpen}
        onOpenChange={setIsPromptOpen}
        isLoading={isAssignmentDetailLoading}
        hasError={hasAssignmentDetailError}
        onRetry={retryAssignmentDetail}
      />
    </>
  );
}
