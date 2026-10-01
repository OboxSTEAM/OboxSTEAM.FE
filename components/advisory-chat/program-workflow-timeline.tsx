"use client";

import {
  ExpertWorkflowRail,
  type ExpertWorkflowStep,
} from "@/components/expert/shared/expert-workbench";
import { Badge } from "@/components/ui/badge";
import type { AdvisoryWorkspace, ProgramStatus } from "@/lib/api";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { cn } from "@/lib/utils";

const STAGE_BY_STATUS: Record<ProgramStatus, number> = {
  Draft: 0,
  Approved: 1,
  Active: 2,
  Inactive: 2,
};

type ProgramWorkflowTimelineProps = {
  status: ProgramStatus;
  /** `null` while the advisory workspace is loading. */
  workspace: AdvisoryWorkspace | null;
  className?: string;
};

/**
 * Draft → Approved → Published rail shared by the expert and manager program pages;
 * each step explains itself on hover and "Việc của bạn" follows the viewer's capabilities.
 */
export function ProgramWorkflowTimeline({ status, workspace, className }: ProgramWorkflowTimelineProps) {
  const stage = STAGE_BY_STATUS[status];
  const approval = workspace?.approval ?? null;
  const isLiveWithoutApproval = stage === 2 && workspace != null && approval === null;

  const approvalDetail = approval
    ? `${approval.approvedByName ?? "Chuyên gia"} đã chấp thuận phiên bản v${approval.curriculumVersion} lúc ${formatApiDateTimeDisplay(approval.approvedAt)}.`
    : "Chuyên gia phụ trách chấp thuận phiên bản khung hiện tại khi đạt yêu cầu của khung.";

  const baseSteps: Omit<ExpertWorkflowStep, "state">[] = [
    {
      label: "Soạn thảo & góp ý",
      detail:
        "Manager xây dựng khung chương trình; chuyên gia góp ý, ghim yêu cầu và trao đổi trong kênh thảo luận.",
    },
    {
      label: "Chấp thuận",
      detail: isLiveWithoutApproval
        ? "Khung đã thay đổi sau khi xuất bản nên chấp thuận cũ không còn hiệu lực; cần chuyên gia chấp thuận lại."
        : approvalDetail,
      badge: isLiveWithoutApproval ? (
        <span className="rounded-full bg-amber-500/12 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-300">
          Cần chấp thuận lại
        </span>
      ) : undefined,
    },
    status === "Inactive"
      ? {
          label: "Ngừng hoạt động",
          detail: "Chương trình đã ngừng nhận học viên mới; manager có thể mở lại bất cứ lúc nào.",
        }
      : {
          label: "Xuất bản",
          detail: "Manager xuất bản chương trình để mở lớp cho học viên đăng ký.",
        },
  ];
  const steps = baseSteps.map(
    (step, index): ExpertWorkflowStep => ({
      ...step,
      state: index < stage ? "done" : index === stage ? "current" : "next",
    }),
  );

  const currentLabel = steps[stage]?.label ?? "Chưa xác định";
  const advisorLabel = workspace
    ? (workspace.advisorName ?? "Chưa phân công chuyên gia")
    : "Đang tải…";
  const nextAction = workspace ? describeNextAction(workspace, stage, isLiveWithoutApproval) : null;

  return (
    <section className={cn("rounded-2xl border border-border bg-card px-4 py-4", className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Tiến trình chương trình
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {currentLabel}
            <span className="mx-2 text-muted-foreground">·</span>
            <span className="font-normal text-muted-foreground">Phụ trách: {advisorLabel}</span>
          </p>
        </div>
        {workspace ? (
          <Badge variant="outline" className="rounded-md text-[11px]">
            {workspace.openPinCount} ghim đang mở
          </Badge>
        ) : null}
      </div>
      {nextAction ? (
        <p className="mb-3 text-sm text-foreground">
          <span className="font-semibold">Việc của bạn: </span>
          {nextAction}
        </p>
      ) : null}
      <ExpertWorkflowRail steps={steps} />
    </section>
  );
}

function describeNextAction(
  workspace: AdvisoryWorkspace,
  stage: number,
  isLiveWithoutApproval: boolean,
): string | null {
  const { capabilities } = workspace;
  if (stage === 0 && capabilities.canApprove) {
    return "Rà soát khung chương trình và chấp thuận khi đạt yêu cầu.";
  }
  if (isLiveWithoutApproval && capabilities.canApprove) {
    return "Rà soát các thay đổi và chấp thuận lại phiên bản hiện tại.";
  }
  if (stage === 0 && capabilities.canRequestApproval) {
    return workspace.openPinCount > 0
      ? `Xử lý ${workspace.openPinCount} ghim đang mở rồi mời chuyên gia duyệt.`
      : "Hoàn thiện khung chương trình rồi mời chuyên gia duyệt.";
  }
  if (isLiveWithoutApproval && capabilities.canRequestApproval) {
    return "Mời chuyên gia chấp thuận lại các thay đổi sau khi xuất bản.";
  }
  if (stage === 1 && capabilities.canPublish) {
    return "Xuất bản chương trình để mở lớp cho học viên đăng ký.";
  }
  return null;
}
