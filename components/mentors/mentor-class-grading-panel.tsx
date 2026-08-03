"use client";

import { useEffect, useMemo, useState } from "react";
import {
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

import { ClassDateRange } from "@/components/classes/class-date-range";
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
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/lib/api";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { fileNameFromUrl } from "@/lib/curriculum/research-staging-storage";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import {
  THEME_SELECT_CONTENT,
  THEME_SELECT_ITEM,
  THEME_SELECT_TRIGGER,
} from "@/lib/ui/select-styles";
import { cn } from "@/lib/utils";

type GradingMode = "manual" | "quiz";

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

function isManualAssignmentType(type: AssignmentType): boolean {
  return type === "FileUpload" || type === "Retrospective";
}

function isQuizAssignmentType(type: AssignmentType): boolean {
  return type === "Quiz";
}

type SubmissionArtifactSource = "assignment" | "research" | "retrospective";

type SubmissionArtifact = {
  source: SubmissionArtifactSource;
  code: string | null;
  fileUrl: string | null;
  contentText: string | null;
  evidenceUrls: string[];
  mentorFeedback: string | null;
  assignedGrade: number | null;
};

type ResearchAssignmentMeta = {
  assignmentIds: Set<string>;
  capstoneAssignmentIds: Set<string>;
};

async function loadSubmissionArtifact(
  submissionId: string,
  options: { isResearchDeliverable: boolean },
): Promise<SubmissionArtifact> {
  // Research milestone deliverables (Capstone, Design Brief, …) must use
  // /api/research-submissions — assignment-submissions returns 400 for these ids.
  if (options.isResearchDeliverable) {
    const result = await getResearchSubmissionById(submissionId);
    const data = result?.data;
    return {
      source: "research",
      code: data?.code ?? null,
      fileUrl: data?.fileUrl ?? null,
      contentText: data?.contentText ?? null,
      evidenceUrls: (data?.evidenceUrls ?? []).filter(
        (url): url is string => Boolean(url?.trim()),
      ),
      mentorFeedback: data?.mentorFeedback ?? null,
      assignedGrade: data?.assignedGrade ?? null,
    };
  }

  const result = await getAssignmentSubmissionById(submissionId);
  const data = result?.data;
  return {
    source: "assignment",
    code: data?.code ?? null,
    fileUrl: data?.fileUrl ?? null,
    contentText: data?.contentText ?? null,
    evidenceUrls: [],
    mentorFeedback: data?.mentorFeedback ?? null,
    assignedGrade: data?.assignedGrade ?? null,
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
      <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 px-3 py-3 text-center">
        <p className="text-xs text-muted-foreground">
          Không tải được bài nộp của học viên.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-2 h-7 rounded-md text-xs"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  const fileUrl = artifact?.fileUrl?.trim() || null;
  const contentText = artifact?.contentText?.trim() || null;
  const evidenceUrls = artifact?.evidenceUrls ?? [];

  if (!fileUrl && !contentText && evidenceUrls.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-3 py-3">
        <p className="text-xs text-muted-foreground">
          {assignmentType === "Retrospective"
            ? "Học viên chưa có nội dung retrospective."
            : "Học viên chưa đính kèm file hoặc nội dung văn bản."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 rounded-xl border border-[#4FC3F7]/25 bg-[#4FC3F7]/8 p-3">
      <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-foreground">
        <FileText className="size-3.5 text-[#0d6e9c]" />
        Bài nộp của học viên
        {artifact?.code ? (
          <span className="font-mono font-normal text-muted-foreground">
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
      </p>

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
        <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-background px-2.5 py-2">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {contentText}
          </p>
        </div>
      ) : null}
    </div>
  );
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
              {assignment.dueDate ? (
                <div className="sm:col-span-2">
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Hạn nộp
                  </p>
                  <ClassDateRange
                    startDate={assignment.dueDate}
                    layout="inline"
                  />
                </div>
              ) : null}
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
};

export function MentorClassGradingPanel({
  classId,
  programId,
}: MentorClassGradingPanelProps) {
  const [mode, setMode] = useState<GradingMode>("manual");
  const [assignmentId, setAssignmentId] = useState("");
  const [gradeTarget, setGradeTarget] =
    useState<AssignmentSubmissionListItem | null>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [feedback, setFeedback] = useState("");
  const [returnForRevision, setReturnForRevision] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [quizPreview, setQuizPreview] = useState<{
    studentName: string;
    scorePercent: number | null;
    correct: number | null;
    total: number | null;
  } | null>(null);
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

  const manualAssignments = useMemo(
    () => assignments.filter((item) => isManualAssignmentType(item.assignmentType)),
    [assignments],
  );

  const quizAssignments = useMemo(
    () => assignments.filter((item) => isQuizAssignmentType(item.assignmentType)),
    [assignments],
  );

  const manualModuleIdsKey = useMemo(() => {
    const ids = [
      ...new Set(
        manualAssignments
          .map((item) => item.moduleId)
          .filter((id): id is string => Boolean(id)),
      ),
    ].sort();
    return ids.join(",");
  }, [manualAssignments]);

  const { data: researchAssignmentMeta } = useClientFetch({
    enabled: Boolean(manualModuleIdsKey),
    fetcher: async (): Promise<ResearchAssignmentMeta> => {
      const moduleIds = manualModuleIdsKey.split(",").filter(Boolean);
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
    },
    deps: [manualModuleIdsKey],
    onError: () => {
      // Non-blocking — research route still attempted only when meta is known.
    },
  });

  const isResearchDeliverable = Boolean(
    assignmentId && researchAssignmentMeta?.assignmentIds.has(assignmentId),
  );

  const visibleAssignments =
    mode === "manual" ? manualAssignments : quizAssignments;

  const selectedAssignment = visibleAssignments.find(
    (item) => item.id === assignmentId,
  );

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

  const submissions = submissionsData ?? [];

  const pendingGradeCount = useMemo(
    () => submissions.filter((row) => row.status === "TurnedIn").length,
    [submissions],
  );

  const {
    data: submissionArtifact,
    isLoading: isArtifactLoading,
    hasError: hasArtifactError,
    retry: retryArtifact,
  } = useClientFetch({
    // Wait for milestone map so Capstone/Design Brief never hit assignment-submissions.
    enabled:
      gradeTarget != null &&
      mode === "manual" &&
      (selectedAssignment?.assignmentType === "Retrospective" ||
        researchAssignmentMeta != null ||
        !manualModuleIdsKey),
    fetcher: async (): Promise<SubmissionArtifact | null> => {
      if (!gradeTarget || !selectedAssignment) return null;

      if (selectedAssignment.assignmentType === "Retrospective") {
        const result = await getRetrospectiveSubmission(gradeTarget.submissionId);
        const data = result?.data;
        return {
          source: "retrospective",
          code: null,
          fileUrl: null,
          contentText: data?.contentText ?? null,
          evidenceUrls: [],
          mentorFeedback: data?.mentorFeedback ?? null,
          assignedGrade: data?.assignedGrade ?? null,
        };
      }

      return loadSubmissionArtifact(gradeTarget.submissionId, {
        isResearchDeliverable,
      });
    },
    deps: [
      gradeTarget?.submissionId,
      selectedAssignment?.assignmentType,
      isResearchDeliverable,
      researchAssignmentMeta,
      manualModuleIdsKey,
      mode,
    ],
    onError: (error) =>
      showAppErrorFromUnknown(error, "assignments.submissions.list"),
  });

  useEffect(() => {
    if (!gradeTarget || !submissionArtifact) return;
    if (submissionArtifact.mentorFeedback?.trim()) {
      setFeedback(submissionArtifact.mentorFeedback);
    }
    if (
      (gradeTarget.assignedGrade == null || gradeValue === "") &&
      submissionArtifact.assignedGrade != null
    ) {
      setGradeValue(String(submissionArtifact.assignedGrade));
    }
    // Hydrate once when detail arrives for the open grade target.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot hydrate
  }, [gradeTarget?.submissionId, submissionArtifact]);

  function handleModeChange(nextMode: string | null) {
    const value = (nextMode === "quiz" ? "quiz" : "manual") as GradingMode;
    if (value === mode) return;
    setMode(value);
    setAssignmentId("");
    setGradeTarget(null);
    setQuizPreview(null);
    setIsPromptOpen(false);
  }

  async function handleViewQuiz(row: AssignmentSubmissionListItem) {
    try {
      const result = await getQuizResult(row.submissionId);
      const data = result?.data;
      const scorePercent =
        data && data.maxPoints > 0
          ? Math.round((data.assignedGrade / data.maxPoints) * 1000) / 10
          : data?.assignedGrade ?? null;
      setQuizPreview({
        studentName: row.studentName?.trim() || "Học viên",
        scorePercent,
        correct: data?.correctCount ?? null,
        total: data?.totalQuestions ?? null,
      });
    } catch (error) {
      showAppErrorFromUnknown(error, "assignments.submissions.list");
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
    const assignedGrade = Number(gradeValue);
    if (!Number.isFinite(assignedGrade) || assignedGrade < 0) {
      showAppErrorFromUnknown(
        new Error("Điểm không hợp lệ"),
        "assignments.submissions.grade",
      );
      return;
    }

    try {
      setIsGrading(true);
      const payload = {
        assignedGrade,
        mentorFeedback: feedback.trim() ? feedback.trim() : null,
        returnForRevision,
      };

      if (
        isResearchDeliverable ||
        submissionArtifact?.source === "research"
      ) {
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
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <Tabs value={mode} onValueChange={handleModeChange} className="gap-0">
          <div className="border-b border-border bg-muted/40 px-4 pt-4 sm:px-6">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ClipboardPen className="size-4 text-primary" />
                  Chấm bài
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {mode === "manual"
                    ? "Nộp file, Capstone/Research & Retrospective — mentor chấm điểm và nhận xét."
                    : "Quiz tự chấm — mentor chỉ xem điểm / tỉ lệ đúng."}
                </p>
              </div>
              {selectedAssignment && mode === "manual" && pendingGradeCount > 0 ? (
                <Badge className="rounded-full bg-[#4FC3F7]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#0d6e9c] hover:bg-[#4FC3F7]/15">
                  {pendingGradeCount} chờ chấm
                </Badge>
              ) : null}
            </div>

            <TabsList
              variant="line"
              className="h-auto w-full justify-start gap-0 rounded-none border-b-0 bg-transparent p-0"
            >
              <TabsTrigger
                value="manual"
                className="rounded-none px-3 py-2.5 text-sm data-active:text-primary"
              >
                <ListChecks className="size-4" />
                Bài cần chấm
                <span className="font-mono text-[11px] text-muted-foreground">
                  {manualAssignments.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="quiz"
                className="rounded-none px-3 py-2.5 text-sm data-active:text-primary"
              >
                <Sparkles className="size-4" />
                Quiz · xem điểm
                <span className="font-mono text-[11px] text-muted-foreground">
                  {quizAssignments.length}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="space-y-3 border-b border-border px-4 py-3 sm:px-6">
            <Select
              value={assignmentId || null}
              onValueChange={(value) => {
                markLoading();
                setAssignmentId(value ?? "");
                setIsPromptOpen(false);
              }}
              disabled={
                isAssignmentsLoading || visibleAssignments.length === 0
              }
            >
              <SelectTrigger
                className={cn(THEME_SELECT_TRIGGER, "w-full max-w-xl")}
              >
                <span className="truncate">
                  {isAssignmentsLoading
                    ? "Đang tải bài tập..."
                    : selectedAssignment
                      ? selectedAssignment.title ||
                        selectedAssignment.code ||
                        "Bài tập"
                      : visibleAssignments.length === 0
                        ? mode === "manual"
                          ? "Chưa có bài nộp file / retrospective"
                          : "Chưa có quiz trong chương trình"
                        : mode === "manual"
                          ? "Chọn bài cần chấm…"
                          : "Chọn quiz để xem điểm…"}
                </span>
              </SelectTrigger>
              <SelectContent
                align="start"
                alignItemWithTrigger={false}
                sideOffset={8}
                className={THEME_SELECT_CONTENT}
              >
                {visibleAssignments.map((item: AssignmentListItem) => {
                  const isResearch =
                    researchAssignmentMeta?.assignmentIds.has(item.id) ?? false;
                  const isCapstone =
                    researchAssignmentMeta?.capstoneAssignmentIds.has(item.id) ??
                    false;

                  return (
                    <SelectItem
                      key={item.id}
                      value={item.id}
                      className={cn(THEME_SELECT_ITEM, "cursor-pointer")}
                    >
                      <span className="flex flex-col gap-0.5 py-0.5 text-left">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span>{item.title || item.code || "Bài tập"}</span>
                          {isCapstone ? (
                            <Badge
                              variant="outline"
                              className="rounded-full border-[#7CB342]/30 bg-[#7CB342]/12 px-1.5 py-0 text-[10px] font-semibold text-[#3d5c22]"
                            >
                              Capstone
                            </Badge>
                          ) : isResearch ? (
                            <Badge
                              variant="outline"
                              className="rounded-full px-1.5 py-0 text-[10px]"
                            >
                              Research
                            </Badge>
                          ) : null}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {ASSIGNMENT_TYPE_LABELS[item.assignmentType]}
                          {item.code ? ` · ${item.code}` : ""}
                        </span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {assignmentId ? (
              <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <BookOpenText className="size-3.5 text-primary" />
                    Đề bài
                  </p>
                  {isAssignmentDetailLoading && !assignmentDetail ? (
                    <Skeleton className="h-4 w-3/4" />
                  ) : (
                    <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {assignmentDetail?.description?.trim() ||
                        "Chưa có mô tả đề — bấm Xem đề để xem điểm đạt / hạn nộp."}
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
          </div>

          <TabsContent value="manual" className="mt-0 overflow-x-auto p-4 sm:p-6">
            {!assignmentId ? (
              <ManagerEmptyState
                title="Chọn bài để chấm"
                description="Chỉ hiện Nộp file và Retrospective — bạn chấm điểm, nhận xét hoặc trả bài để sửa."
                icon={ClipboardPen}
              />
            ) : (
              <ManagerDataTable
                columns={manualColumns}
                data={submissions}
                isLoading={isSubmissionsLoading}
                emptyState={
                  <ManagerEmptyState
                    title="Chưa có bài nộp"
                    description="Học viên active trong lớp chưa nộp bài này."
                    icon={ClipboardPen}
                  />
                }
              />
            )}
          </TabsContent>

          <TabsContent value="quiz" className="mt-0 overflow-x-auto p-4 sm:p-6">
            {!assignmentId ? (
              <ManagerEmptyState
                title="Chọn quiz để xem điểm"
                description="Quiz được hệ thống tự chấm. Bạn chỉ xem điểm và số câu đúng — không nhập điểm thủ công."
                icon={GraduationCap}
              />
            ) : (
              <ManagerDataTable
                columns={quizColumns}
                data={submissions}
                isLoading={isSubmissionsLoading}
                emptyState={
                  <ManagerEmptyState
                    title="Chưa có kết quả quiz"
                    description="Học viên chưa hoàn thành quiz này."
                    icon={Sparkles}
                  />
                }
              />
            )}
          </TabsContent>
        </Tabs>
      </section>

      <Dialog
        open={gradeTarget != null}
        onOpenChange={(open) => {
          if (!open) setGradeTarget(null);
        }}
      >
        <DialogPopup className="sm:max-w-lg">
          <DialogClose />
          <DialogHeader>
            <DialogTitle>Chấm bài</DialogTitle>
            <DialogDescription>
              {gradeTarget?.studentName?.trim() || "Học viên"} · lần #
              {gradeTarget?.attemptNumber}
              {selectedAssignment
                ? ` · ${ASSIGNMENT_TYPE_LABELS[selectedAssignment.assignmentType]}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            {assignmentDetail?.description?.trim() ? (
              <button
                type="button"
                onClick={() => setIsPromptOpen(true)}
                className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-muted/50"
              >
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                  <BookOpenText className="size-3.5 text-primary" />
                  Đề bài · xem đầy đủ
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {assignmentDetail.description.trim()}
                </p>
              </button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPromptOpen(true)}
                className="h-8 w-full rounded-lg text-xs"
              >
                <BookOpenText className="size-3.5" />
                Xem đề bài
              </Button>
            )}

            <SubmissionWorkPanel
              assignmentType={selectedAssignment?.assignmentType}
              artifact={submissionArtifact ?? null}
              isLoading={isArtifactLoading && !submissionArtifact}
              hasError={hasArtifactError}
              onRetry={retryArtifact}
            />

            <div className="space-y-1.5">
              <Label htmlFor="grade-score">Điểm</Label>
              <Input
                id="grade-score"
                type="number"
                min={0}
                step="0.1"
                value={gradeValue}
                onChange={(event) => setGradeValue(event.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grade-feedback">Nhận xét (tuỳ chọn)</Label>
              <Textarea
                id="grade-feedback"
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                className="min-h-20 resize-none text-sm"
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <div className="space-y-0.5">
                <p className="text-xs font-medium">Trả lại để sửa</p>
                <p className="text-[11px] text-muted-foreground">
                  Học viên sẽ nộp lại thay vì kết thúc chấm.
                </p>
              </div>
              <Switch
                checked={returnForRevision}
                onCheckedChange={setReturnForRevision}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setGradeTarget(null)}
              disabled={isGrading}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={() => void handleSaveGrade()}
              disabled={isGrading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isGrading ? "Đang lưu…" : "Lưu điểm"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      <Dialog
        open={quizPreview != null}
        onOpenChange={(open) => {
          if (!open) setQuizPreview(null);
        }}
      >
        <DialogPopup className="sm:max-w-sm">
          <DialogClose />
          <DialogHeader>
            <DialogTitle>Kết quả quiz</DialogTitle>
            <DialogDescription>
              Điểm do hệ thống tự chấm — chỉ xem, không chỉnh.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm font-medium text-foreground">
              {quizPreview?.studentName}
            </p>
            <div className="rounded-xl border border-[#4FC3F7]/25 bg-[#4FC3F7]/8 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Điểm
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground">
                {quizPreview?.scorePercent != null
                  ? `${quizPreview.scorePercent}%`
                  : "—"}
              </p>
              {quizPreview?.correct != null && quizPreview.total != null ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Đúng {quizPreview.correct}/{quizPreview.total} câu
                </p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setQuizPreview(null)}>
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
