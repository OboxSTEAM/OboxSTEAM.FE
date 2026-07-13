"use client";

import { Bookmark } from "lucide-react";

import type { QuizQuestion } from "@/lib/api";
import { cn } from "@/lib/utils";

type QuizQuestionNavProps = {
  questions: QuizQuestion[];
  currentIndex: number;
  answers: Record<string, string[]>;
  markedIds: Set<string>;
  onSelect: (index: number) => void;
};

export function QuizQuestionNav({
  questions,
  currentIndex,
  answers,
  markedIds,
  onSelect,
}: QuizQuestionNavProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="tablist"
      aria-label="Danh sách câu hỏi"
    >
      {questions.map((question, index) => {
        const isCurrent = index === currentIndex;
        const isAnswered = (answers[question.id]?.length ?? 0) > 0;
        const isMarked = markedIds.has(question.id);

        return (
          <button
            key={question.id}
            type="button"
            role="tab"
            aria-selected={isCurrent}
            aria-label={`Câu ${index + 1}${isMarked ? ", đã đánh dấu" : ""}${isAnswered ? ", đã trả lời" : ""}`}
            onClick={() => onSelect(index)}
            className={cn(
              "relative flex size-10 items-center justify-center rounded-lg border text-sm font-semibold tabular-nums transition-colors sm:size-11",
              isCurrent
                ? "border-learn-accent bg-learn-accent/15 text-learn-text-strong"
                : isAnswered
                  ? "border-learn-success/40 bg-learn-success/10 text-learn-text-strong"
                  : "border-learn-border bg-learn-surface text-learn-muted hover:bg-learn-surface-2",
            )}
          >
            {index + 1}
            {isMarked ? (
              <Bookmark
                className="absolute -top-1.5 -right-1.5 size-3.5 fill-learn-primary text-learn-primary"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
