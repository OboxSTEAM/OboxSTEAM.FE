"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import {
  ExpertWorkflowRail,
  type ExpertWorkflowStep,
} from "@/components/expert/shared/expert-workbench";
import { Badge } from "@/components/ui/badge";
import type {
  AdvisoryParticipant,
  AdvisoryWorkflowStageKey,
  AdvisoryWorkflowTimeline,
} from "@/lib/api";
import { getAdvisoryNextActionLabel } from "@/lib/expert/advisory-labels";
import { cn } from "@/lib/utils";

const STAGE_LABELS: Record<AdvisoryWorkflowStageKey, string> = {
  Preparation: "Soạn thảo",
  Review: "Thẩm định",
  Revision: "Chỉnh sửa",
  AwaitingPublication: "Đã duyệt",
  Published: "Đã xuất bản",
};

const STAGE_DETAILS: Record<AdvisoryWorkflowStageKey, string> = {
  Preparation: "Manager hoàn thiện chương trình trước khi gửi thẩm định.",
  Review: "Chuyên gia thẩm định lần nộp hiện tại.",
  Revision: "Manager xử lý các mục bắt buộc sửa.",
  AwaitingPublication: "Đã duyệt và chờ xuất bản.",
  Published: "Chương trình đã được xuất bản.",
};

type AdvisoryWorkflowTimelineProps = {
  timeline: AdvisoryWorkflowTimeline | null | undefined;
  participants?: AdvisoryParticipant[];
  onStageSelect?: (stage: AdvisoryWorkflowStageKey) => void;
  /** Sits in the status row, beside the outstanding-requirement count. */
  action?: ReactNode;
  className?: string;
};

function responsibilityLabel(
  timeline: AdvisoryWorkflowTimeline,
  participants: AdvisoryParticipant[],
): string {
  if (timeline.responsibleUserId) {
    const participant = participants.find(
      (item) => item.userId === timeline.responsibleUserId,
    );
    if (participant?.displayName) return participant.displayName;
  }
  return timeline.responsibleRole === "Advisor" ? "Chuyên gia" : "Manager";
}

export function AdvisoryWorkflowTimeline({
  timeline,
  participants = [],
  onStageSelect,
  action,
  className,
}: AdvisoryWorkflowTimelineProps) {
  if (!timeline || timeline.stages.length === 0) {
    return (
      <div className={cn("flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border p-3", className)}>
        <p className="text-xs text-muted-foreground">
          Chưa có dữ liệu tiến trình advisory từ máy chủ.
        </p>
        {action}
      </div>
    );
  }

  const current = timeline.currentStage
    ? STAGE_LABELS[timeline.currentStage]
    : "Chưa xác định";
  const responsibility = responsibilityLabel(timeline, participants);
  const steps: ExpertWorkflowStep[] = timeline.stages.map((stage) => ({
    label:
      stage.key === "Review" && timeline.round > 0
        ? `Thẩm định · lần ${timeline.round}`
        : STAGE_LABELS[stage.key],
    detail: STAGE_DETAILS[stage.key],
    state:
      stage.state === "completed"
        ? "done"
        : stage.state === "current"
          ? "current"
          : stage.state === "skipped"
            ? "skipped"
            : "next",
  }));

  return (
    <section className={cn("rounded-2xl border border-border bg-card px-4 py-4", className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Tiến trình advisory
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {current}
            <span className="mx-2 text-muted-foreground">·</span>
            <span className="font-normal text-muted-foreground">
              Phụ trách: {responsibility}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {action}
          <Badge variant="outline" className="rounded-md text-[11px]">
            {timeline.outstandingRequirementCount} bắt buộc sửa còn lại
          </Badge>
        </div>
      </div>
      {timeline.nextAction?.code ? (
        <p className="mb-3 text-sm text-foreground">
          <span className="font-semibold">Việc của bạn: </span>
          {getAdvisoryNextActionLabel(timeline.nextAction.code)}
        </p>
      ) : null}

      <div className="hidden sm:block">
        <ExpertWorkflowRail
          steps={steps}
          onStepSelect={(index) => {
            const stage = timeline.stages[index];
            if (stage) onStageSelect?.(stage.key);
          }}
        />
      </div>

      <details className="group sm:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground">
          Xem 6 giai đoạn
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
        </summary>
        <ol className="mt-3 space-y-2">
          {timeline.stages.map((stage, index) => (
            <li key={stage.key}>
              <button
                type="button"
                onClick={() => onStageSelect?.(stage.key)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-muted/50"
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                    stage.state === "completed" &&
                      "border-emerald-600 bg-emerald-600 text-white",
                    stage.state === "current" &&
                      "border-primary bg-primary text-primary-foreground",
                    stage.state === "skipped" &&
                      "border-dashed border-border text-muted-foreground",
                    stage.state === "upcoming" &&
                      "border-border text-muted-foreground",
                  )}
                >
                  {index + 1}
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {STAGE_LABELS[stage.key]}
                </span>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {stage.state === "completed"
                    ? "Hoàn tất"
                    : stage.state === "current"
                      ? "Hiện tại"
                      : stage.state === "skipped"
                        ? "Bỏ qua"
                        : "Sắp tới"}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}

export { STAGE_LABELS };
