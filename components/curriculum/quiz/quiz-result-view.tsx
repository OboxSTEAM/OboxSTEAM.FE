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
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        {result.passed ? (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-learn-success" aria-hidden />
        ) : (
          <XCircle className="mt-0.5 size-5 shrink-0 text-learn-primary" aria-hidden />
        )}
        <div>
          <p className="font-heading text-base font-semibold text-learn-text-strong">
            {result.passed ? "Đã đạt yêu cầu" : "Chưa đạt yêu cầu"}
          </p>
          <p className="mt-1 text-sm text-learn-muted">
            Lần làm thứ {result.attemptNumber} · {result.correctCount}/{result.totalQuestions} câu đúng
          </p>
        </div>
      </div>

      <dl className="space-y-3 rounded-xl border border-learn-border bg-learn-surface-2 p-4">
        <div className="flex items-baseline justify-between gap-4 text-sm">
          <dt className="text-learn-muted">Điểm đạt được</dt>
          <dd className="font-mono text-2xl font-semibold tabular-nums text-learn-text-strong">
            {result.assignedGrade}
            <span className="text-base font-normal text-learn-muted">
              {" "}/ {result.maxPoints}
            </span>
          </dd>
        </div>

        <div className="flex items-baseline justify-between gap-4 text-sm">
          <dt className="text-learn-muted">Tỷ lệ</dt>
          <dd className="font-medium text-learn-text-strong">{percent}%</dd>
        </div>

        <div className="flex items-baseline justify-between gap-4 text-sm">
          <dt className="text-learn-muted">Điểm đạt yêu cầu</dt>
          <dd className="font-medium text-learn-text-strong">{result.passScore}</dd>
        </div>

        <div
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            result.passed
              ? "border-learn-success/30 bg-learn-success/10 text-learn-text-strong"
              : "border-learn-border bg-learn-surface text-learn-muted",
          )}
        >
          {result.passed
            ? "Bạn đã hoàn thành bài kiểm tra này."
            : "Hãy ôn lại và thử lại nếu còn lượt làm."}
        </div>
      </dl>

      <p className="text-xs text-learn-faint">
        Trạng thái: {result.status} · Nộp lúc{" "}
        {new Intl.DateTimeFormat("vi-VN", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(result.submittedAt))}
      </p>
    </div>
  );
}
