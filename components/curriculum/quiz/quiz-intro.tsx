"use client";

import { AlertCircle, CalendarClock } from "lucide-react";

import type { AssignmentDetail } from "@/lib/api";

type QuizIntroProps = {
  assignment: AssignmentDetail;
};

function formatDueDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

type QuizStat = {
  label: string;
  value: string;
  unit?: string;
};

function StatCell({ stat }: { stat: QuizStat }) {
  return (
    <div className="flex items-baseline justify-between gap-4 bg-learn-surface-2/50 px-4 py-3.5 sm:px-5 sm:py-4">
      <dt className="text-sm text-learn-muted">{stat.label}</dt>
      <dd className="flex items-baseline gap-1.5">
        <span className="font-heading text-xl font-semibold leading-none tabular-nums text-learn-text-strong sm:text-2xl">
          {stat.value}
        </span>
        {stat.unit ? (
          <span className="text-sm text-learn-faint">{stat.unit}</span>
        ) : null}
      </dd>
    </div>
  );
}

export function QuizIntro({ assignment }: QuizIntroProps) {
  const dueLabel = formatDueDate(assignment.dueDate);

  const stats: QuizStat[] = [
    {
      label: "Thời gian",
      value: assignment.timeLimitMinutes ? String(assignment.timeLimitMinutes) : "∞",
      unit: assignment.timeLimitMinutes ? "phút" : undefined,
    },
    {
      label: "Số câu",
      value: assignment.questionCount != null ? String(assignment.questionCount) : "—",
      unit: "câu",
    },
    {
      label: "Điểm đạt",
      value: String(assignment.passScore),
      unit: `/ ${assignment.maxPoints}`,
    },
    {
      label: "Lượt làm",
      value: String(assignment.maxAttempts),
      unit: assignment.maxAttempts === 1 ? "lần" : "lần",
    },
  ];

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-learn-muted">
        {assignment.description || "Bài kiểm tra trắc nghiệm tự động chấm điểm."}
      </p>

      <dl className="grid max-w-md grid-cols-2 gap-px overflow-hidden rounded-xl border border-learn-border bg-learn-border sm:max-w-lg">
        {stats.map((stat) => (
          <StatCell key={stat.label} stat={stat} />
        ))}
      </dl>

      <div className="space-y-2.5">
        {dueLabel ? (
          <div className="flex items-center gap-2.5 text-sm text-learn-muted">
            <CalendarClock className="size-4 shrink-0 text-learn-faint" aria-hidden />
            <span>
              Hạn nộp:{" "}
              <span className="font-medium text-learn-text-strong">{dueLabel}</span>
            </span>
          </div>
        ) : null}

        {assignment.isRequiredForModulePass ? (
          <div className="flex items-center gap-2.5 text-sm text-learn-muted">
            <AlertCircle className="size-4 shrink-0 text-learn-primary" aria-hidden />
            <span>Bắt buộc hoàn thành để qua module.</span>
          </div>
        ) : null}
      </div>

      <p className="border-t border-learn-border pt-4 text-xs text-learn-faint">
        Chọn một đáp án cho mỗi câu. Bạn có thể đánh dấu câu hỏi để xem lại trước khi nộp bài.
      </p>
    </div>
  );
}
