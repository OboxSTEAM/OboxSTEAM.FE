"use client";

import { useMemo, useState } from "react";
import { ClipboardPen, GraduationCap } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  getAssignmentSubmissions,
  getAssignments,
  getQuizResult,
  gradeAssignmentSubmission,
  type AssignmentListItem,
  type AssignmentSubmissionListItem,
  type AssignmentSubmissionStatus,
  type AssignmentType,
} from "@/lib/api";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import {
  THEME_SELECT_CONTENT,
  THEME_SELECT_ITEM,
  THEME_SELECT_TRIGGER,
} from "@/lib/ui/select-styles";
import { cn } from "@/lib/utils";

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

type MentorClassGradingPanelProps = {
  classId: string;
  programId: string;
};

export function MentorClassGradingPanel({
  classId,
  programId,
}: MentorClassGradingPanelProps) {
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
  const selectedAssignment = assignments.find(
    (item) => item.id === assignmentId,
  );

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

  const columns = useMemo<ColumnDef<AssignmentSubmissionListItem>[]>(
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
        header: "Điểm",
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
        render: (row) => {
          const canGrade =
            selectedAssignment?.assignmentType !== "Quiz" &&
            (row.status === "TurnedIn" || row.status === "Graded");
          const canViewQuiz =
            selectedAssignment?.assignmentType === "Quiz" &&
            row.status === "Graded";

          if (!canGrade && !canViewQuiz) {
            return (
              <span className="text-[11px] text-muted-foreground">—</span>
            );
          }

          return (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 rounded-md px-2 text-xs"
              onClick={() => {
                if (canViewQuiz) {
                  void handleViewQuiz(row);
                  return;
                }
                setGradeTarget(row);
                setGradeValue(
                  row.assignedGrade != null ? String(row.assignedGrade) : "",
                );
                setFeedback("");
                setReturnForRevision(false);
              }}
            >
              {canViewQuiz ? "Xem kết quả" : "Chấm"}
            </Button>
          );
        },
      },
    ],
    [selectedAssignment?.assignmentType],
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
      await gradeAssignmentSubmission(gradeTarget.submissionId, {
        assignedGrade,
        mentorFeedback: feedback.trim() ? feedback.trim() : null,
        returnForRevision,
      });
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
        <div className="border-b border-border bg-muted/40 px-6 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ClipboardPen className="size-4 text-primary" />
              Chấm bài
            </p>
            {selectedAssignment ? (
              <Badge variant="outline" className="rounded-full text-[10px]">
                {ASSIGNMENT_TYPE_LABELS[selectedAssignment.assignmentType]}
              </Badge>
            ) : null}
          </div>
          <Select
            value={assignmentId || null}
            onValueChange={(value) => {
              markLoading();
              setAssignmentId(value ?? "");
            }}
            disabled={isAssignmentsLoading || assignments.length === 0}
          >
            <SelectTrigger className={cn(THEME_SELECT_TRIGGER, "w-full max-w-xl")}>
              <span className="truncate">
                {isAssignmentsLoading
                  ? "Đang tải bài tập..."
                  : selectedAssignment
                    ? selectedAssignment.title ||
                      selectedAssignment.code ||
                      "Bài tập"
                    : assignments.length === 0
                      ? "Chưa có bài tập trong chương trình"
                      : "Chọn bài tập để chấm"}
              </span>
            </SelectTrigger>
            <SelectContent
              align="start"
              alignItemWithTrigger={false}
              sideOffset={8}
              className={THEME_SELECT_CONTENT}
            >
              {assignments.map((item: AssignmentListItem) => (
                <SelectItem
                  key={item.id}
                  value={item.id}
                  className={cn(THEME_SELECT_ITEM, "cursor-pointer")}
                >
                  <span className="flex flex-col gap-0.5 py-0.5 text-left">
                    <span>{item.title || item.code || "Bài tập"}</span>
                    <span className="text-xs text-muted-foreground">
                      {ASSIGNMENT_TYPE_LABELS[item.assignmentType]}
                      {item.code ? ` · ${item.code}` : ""}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto p-6">
          {!assignmentId ? (
            <ManagerEmptyState
              title="Chọn bài tập để xem bài nộp"
              description="Danh sách lấy từ chương trình của lớp. Quiz tự chấm — mentor xem tỉ lệ đúng; File/Retrospective chấm thủ công."
              icon={GraduationCap}
            />
          ) : (
            <ManagerDataTable
              columns={columns}
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
        </div>
      </section>

      <Dialog
        open={gradeTarget != null}
        onOpenChange={(open) => {
          if (!open) setGradeTarget(null);
        }}
      >
        <DialogPopup className="sm:max-w-md">
          <DialogClose />
          <DialogHeader>
            <DialogTitle>Chấm bài</DialogTitle>
            <DialogDescription>
              {gradeTarget?.studentName?.trim() || "Học viên"} · lần #
              {gradeTarget?.attemptNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
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
              className="bg-[#E94B3C] text-white hover:bg-[#E94B3C]/90"
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
            <DialogDescription>{quizPreview?.studentName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2 text-sm">
            <p>
              Điểm:{" "}
              <span className="font-mono font-semibold">
                {quizPreview?.scorePercent != null
                  ? `${quizPreview.scorePercent}%`
                  : "—"}
              </span>
            </p>
            {quizPreview?.correct != null && quizPreview.total != null ? (
              <p className="text-muted-foreground">
                Đúng {quizPreview.correct}/{quizPreview.total} câu
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setQuizPreview(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  );
}
