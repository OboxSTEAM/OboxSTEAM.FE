"use client";

import { Bookmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { QuizQuestion } from "@/lib/api";
import { cn } from "@/lib/utils";

import { QuizQuestionNav } from "./quiz-question-nav";
import { QuizTimer } from "./quiz-timer";

type QuizAttemptViewProps = {
  questions: QuizQuestion[];
  currentIndex: number;
  answers: Record<string, string[]>;
  markedIds: Set<string>;
  expiresAt: string;
  isSaving: boolean;
  isSubmitting: boolean;
  onSelectQuestion: (index: number) => void;
  onToggleMark: () => void;
  onSelectOption: (questionId: string, optionId: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onExpire: () => void;
};

export function QuizAttemptView({
  questions,
  currentIndex,
  answers,
  markedIds,
  expiresAt,
  isSaving,
  isSubmitting,
  onSelectQuestion,
  onToggleMark,
  onSelectOption,
  onPrevious,
  onNext,
  onSubmit,
  onExpire,
}: QuizAttemptViewProps) {
  const question = questions[currentIndex];
  if (!question) return null;

  const selectedIds = answers[question.id] ?? [];
  const isMarked = markedIds.has(question.id);
  const answeredCount = questions.filter((item) => (answers[item.id]?.length ?? 0) > 0).length;
  const isLast = currentIndex >= questions.length - 1;
  const isMulti = question.questionType === "MultipleChoice";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-learn-border px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-learn-muted">
            Đã trả lời {answeredCount}/{questions.length}
            {isSaving ? " · Đang lưu..." : null}
          </p>
          <QuizTimer expiresAt={expiresAt} onExpire={onExpire} />
        </div>
        <div className="mt-3">
          <QuizQuestionNav
            questions={questions}
            currentIndex={currentIndex}
            answers={answers}
            markedIds={markedIds}
            onSelect={onSelectQuestion}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-medium text-learn-faint">
            Câu {currentIndex + 1} / {questions.length}
            <span className="ml-2 text-learn-muted">· {question.points} điểm</span>
          </p>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "h-9 shrink-0 gap-2 px-3 text-sm",
              isMarked
                ? "text-learn-primary hover:text-learn-primary"
                : "text-learn-muted hover:text-learn-text-strong",
            )}
            onClick={onToggleMark}
            aria-pressed={isMarked}
          >
            <Bookmark
              className={cn("size-4", isMarked && "fill-current")}
              aria-hidden
            />
            {isMarked ? "Đã đánh dấu" : "Đánh dấu"}
          </Button>
        </div>

        <h2 className="mt-4 font-heading text-xl leading-snug font-semibold text-learn-text-strong sm:text-2xl">
          {question.questionText}
        </h2>

        <div className="mt-6 space-y-3" role={isMulti ? "group" : "radiogroup"}>
          {question.options.map((option) => {
            const isSelected = selectedIds.includes(option.id);

            return (
              <button
                key={option.id}
                type="button"
                role={isMulti ? "checkbox" : "radio"}
                aria-checked={isSelected}
                onClick={() => onSelectOption(question.id, option.id)}
                className={cn(
                  "flex w-full items-start gap-4 rounded-xl border px-4 py-3.5 text-left text-base transition-colors sm:px-5 sm:py-4",
                  isSelected
                    ? "border-learn-accent bg-learn-accent/10 text-learn-text-strong"
                    : "border-learn-border bg-learn-surface hover:border-learn-accent/40 hover:bg-learn-surface-2/80",
                )}
              >
                <span
                  className={cn(
                    "mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                    isSelected
                      ? "border-learn-accent bg-learn-accent"
                      : "border-learn-faint/50 bg-learn-surface",
                  )}
                  aria-hidden
                >
                  {isSelected ? (
                    <span className="size-2 rounded-full bg-white" />
                  ) : null}
                </span>
                <span className="min-w-0 leading-relaxed">{option.optionText}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-learn-border px-4 py-3 sm:px-6">
        <Button
          type="button"
          variant="ghost"
          size="default"
          disabled={currentIndex === 0 || isSubmitting}
          onClick={onPrevious}
        >
          Câu trước
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {!isLast ? (
            <Button
              type="button"
              variant="outline"
              size="default"
              className="border-learn-border"
              disabled={isSubmitting}
              onClick={onNext}
            >
              Câu tiếp
            </Button>
          ) : null}

          <Button
            type="button"
            size="default"
            className="bg-learn-primary text-white hover:bg-learn-primary/90"
            disabled={isSubmitting}
            onClick={onSubmit}
          >
            {isSubmitting ? "Đang nộp..." : "Nộp bài"}
          </Button>
        </div>
      </div>
    </div>
  );
}
