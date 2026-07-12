"use client";

import { CheckCircle2, XCircle } from "lucide-react";

import type { QuizResult } from "@/lib/api";
import { cn } from "@/lib/utils";

type QuizResultViewProps = {
  result: QuizResult;
};

export function QuizResultView({ result }: QuizResultViewProps) {
  const percent = result.maxPoints > 0
    ? Math.round((result.assignedGrade / result.maxPoints) * 100)
    : 0;

  return (
    <div className="max-w-sm space-y-4">
      <div className="flex items-start gap-2.5">
        {result.passed ? (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-learn-success" aria-hidden />
        ) : (
          <XCircle className="mt-0.5 size-5 shrink-0 text-learn-primary" aria-hidden />
        )}
        <div>
          <p className="font-heading text-base font-semibold text-learn-text-strong">
            {result.passed ? "Đã đạt yêu cầu" : "Chưa đạt yêu cầu"}
          </p>
          <p className="mt-0.5 text-sm text-learn-muted">
            Lần {result.attemptNumber} · {result.correctCount}/{result.totalQuestions} câu đúng
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-learn-border bg-learn-surface-2 p-4">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-3xl font-semibold tabular-nums text-learn-text-strong">
            {result.assignedGrade}
          </span>
          <span className="text-base text-learn-muted">/ {result.maxPoints}</span>
          <span
            className={cn(
              "ml-auto rounded-full px-2 py-0.5 text-xs font-medium",
              result.passed
                ? "bg-learn-success/15 text-learn-success"
                : "bg-learn-primary/10 text-learn-primary",
            )}
          >
            {percent}%
          </span>
        </div>

        <dl className="mt-3 space-y-1.5 border-t border-learn-border pt-3 text-xs">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-learn-muted">Điểm đạt yêu cầu</dt>
            <dd className="font-medium text-learn-text-strong">{result.passScore}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-learn-muted">Nộp lúc</dt>
            <dd className="font-medium text-learn-text-strong">
              {new Intl.DateTimeFormat("vi-VN", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(result.submittedAt))}
            </dd>
          </div>
        </dl>
      </div>

      <p className="text-xs text-learn-faint">
        {result.passed
          ? "Bạn đã hoàn thành bài kiểm tra này."
          : "Hãy ôn lại và thử lại nếu còn lượt làm."}
      </p>
    </div>
  );
}
