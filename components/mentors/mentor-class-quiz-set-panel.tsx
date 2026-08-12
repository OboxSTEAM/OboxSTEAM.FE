"use client";

import { useMemo, useState } from "react";
import { FlaskConical, Lock, RefreshCw, Save } from "lucide-react";

import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  getClassQuizSet,
  pullClassQuizSet,
  updateClassQuizQuestion,
  type ClassQuizQuestion,
} from "@/lib/api";
import { ApiRequestError } from "@/lib/api/errors";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

type MentorClassQuizSetPanelProps = {
  assignmentId: string;
  classId: string;
  assignmentTitle?: string | null;
};

export function MentorClassQuizSetPanel({
  assignmentId,
  classId,
  assignmentTitle,
}: MentorClassQuizSetPanelProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [draftPoints, setDraftPoints] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const {
    data: quizSet,
    isLoading,
    hasError,
    retry,
    mutate,
  } = useClientFetch({
    fetcher: async () => {
      const result = await getClassQuizSet(assignmentId, classId);
      return result?.data ?? null;
    },
    deps: [assignmentId, classId],
    onError: (error) => showAppErrorFromUnknown(error, "classQuizSet.get"),
  });

  const questions = useMemo(() => {
    const list = quizSet?.questions ?? [];
    return [...list].sort((a, b) => a.orderIndex - b.orderIndex);
  }, [quizSet?.questions]);

  async function handlePull() {
    setIsPulling(true);
    try {
      const result = await pullClassQuizSet(assignmentId, classId);
      mutate(result?.data ?? null);
      showAppSuccess({
        title: "Đã kéo bộ đề lớp",
        description: "Cả lớp sẽ dùng chung bộ đề này.",
      });
    } catch (error) {
      showAppErrorFromUnknown(error, "classQuizSet.pull");
    } finally {
      setIsPulling(false);
    }
  }

  function startEdit(question: ClassQuizQuestion) {
    if (quizSet?.isLocked) return;
    setEditingId(question.id);
    setDraftText(question.questionText ?? "");
    setDraftPoints(String(question.points));
  }

  async function handleSave(question: ClassQuizQuestion) {
    if (!quizSet || quizSet.isLocked) return;
    const points = Number(draftPoints);
    setIsSaving(true);
    try {
      const result = await updateClassQuizQuestion(
        assignmentId,
        classId,
        question.id,
        {
          questionText: draftText.trim() || null,
          points: Number.isFinite(points) ? points : null,
        },
      );
      const updated = result?.data;
      if (updated) {
        mutate((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            questions: (prev.questions ?? []).map((item) =>
              item.id === updated.id ? updated : item,
            ),
          };
        });
      }
      setEditingId(null);
      showAppSuccess({
        title: "Đã lưu câu hỏi",
        description: "Bộ đề lớp đã được cập nhật.",
      });
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) {
        retry();
      }
      showAppErrorFromUnknown(error, "classQuizSet.update");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="p-6">
        <ManagerEmptyState
          title="Không tải được bộ đề"
          description="Thử lại sau vài giây."
          icon={FlaskConical}
          actionLabel="Thử lại"
          onAction={retry}
        />
      </div>
    );
  }

  if (!quizSet) {
    return (
      <div className="p-6">
        <ManagerEmptyState
          title="Lớp chưa có bộ đề cố định"
          description={`Kéo đề từ ngân hàng câu hỏi để cả lớp dùng chung một bộ cho “${assignmentTitle?.trim() || "bài quiz"}”. Bạn có thể chỉnh trước khi có học viên nộp bài.`}
          icon={FlaskConical}
          actionLabel={isPulling ? "Đang kéo…" : "Kéo bộ đề cho lớp"}
          onAction={() => void handlePull()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Bộ đề lớp</p>
            {quizSet.isLocked ? (
              <Badge
                variant="outline"
                className="gap-1 rounded-full border-primary/30 bg-primary/5 text-[11px] text-primary"
              >
                <Lock className="size-3" aria-hidden />
                Đã khóa — đã có bài nộp
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="rounded-full border-[#7CB342]/35 bg-[#7CB342]/10 text-[11px] text-[#3d5c22]"
              >
                Bộ đề lớp · có thể chỉnh
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {questions.length} câu hỏi · kéo lúc {quizSet.pulledAt}
          </p>
        </div>
        {!quizSet.isLocked ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPulling}
            onClick={() => void handlePull()}
            className="h-8 gap-1.5 rounded-lg"
          >
            <RefreshCw className={cn("size-3.5", isPulling && "animate-spin")} />
            {isPulling ? "Đang kéo…" : "Kéo lại từ ngân hàng"}
          </Button>
        ) : null}
      </div>

      <ul className="space-y-3 p-4 sm:p-6">
        {questions.map((question, index) => {
          const isEditing = editingId === question.id;
          return (
            <li
              key={question.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-[11px] font-semibold text-muted-foreground">
                  Câu {index + 1}
                  {question.questionType ? ` · ${question.questionType}` : ""}
                  {" · "}
                  {question.points} điểm
                </p>
                {!quizSet.isLocked && !isEditing ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => startEdit(question)}
                  >
                    Sửa
                  </Button>
                ) : null}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <Textarea
                    value={draftText}
                    onChange={(event) => setDraftText(event.target.value)}
                    className="min-h-24 rounded-xl text-sm"
                  />
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="space-y-1 text-xs text-muted-foreground">
                      Điểm
                      <Input
                        type="number"
                        min={0}
                        step="0.5"
                        value={draftPoints}
                        onChange={(event) => setDraftPoints(event.target.value)}
                        className="h-9 w-24 rounded-lg"
                      />
                    </label>
                    <div className="ml-auto flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSaving}
                        onClick={() => setEditingId(null)}
                      >
                        Hủy
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={isSaving}
                        onClick={() => void handleSave(question)}
                        className="gap-1.5"
                      >
                        <Save className="size-3.5" />
                        {isSaving ? "Đang lưu…" : "Lưu"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium leading-relaxed text-foreground">
                    {question.questionText || "—"}
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {(question.options ?? []).map((option) => (
                      <li
                        key={option.id}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm",
                          option.isCorrect
                            ? "border-[#7CB342]/40 bg-[#7CB342]/10 text-[#3d5c22]"
                            : "border-border bg-muted/20 text-muted-foreground",
                        )}
                      >
                        {option.optionText || "—"}
                        {option.isCorrect ? (
                          <span className="ml-2 text-[10px] font-semibold uppercase">
                            Đúng
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
