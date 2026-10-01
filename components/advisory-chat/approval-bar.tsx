"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAdvisoryChat } from "@/components/advisory-chat/advisory-chat-provider";
import { ApproveCurriculumDialog } from "@/components/advisory-chat/approve-curriculum-dialog";
import { RevokeApprovalDialog } from "@/components/advisory-chat/revoke-approval-dialog";
import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { publishProgram, requestProgramApproval, type AdvisoryWorkspace } from "@/lib/api";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

const STATE_COPY: Record<AdvisoryWorkspace["status"], { label: string; tone: string }> = {
  Draft: { label: "Bản nháp", tone: "bg-muted text-muted-foreground" },
  Approved: { label: "Đã chấp thuận", tone: "bg-emerald-500/10 text-emerald-700" },
  Active: { label: "Đang mở", tone: "bg-primary/10 text-primary" },
  Inactive: { label: "Ngừng hoạt động", tone: "bg-muted text-muted-foreground" },
};

type ApprovalBarProps = {
  /** Called after publish so the host page can reload program data. */
  onProgramChanged?: () => void;
  className?: string;
};

/** Approval state + role actions (approve, request, reopen/revoke, publish) for the advisory chat. */
export function ApprovalBar({ onProgramChanged, className }: ApprovalBarProps) {
  const router = useRouter();
  const { programId, currentUserId, isStaff, workspace, workspaceState, capabilities, hasChangesView, openChanges } =
    useAdvisoryChat();
  const [isApproveOpen, setApproveOpen] = useState(false);
  const [isRevokeOpen, setRevokeOpen] = useState(false);
  const [isPublishOpen, setPublishOpen] = useState(false);
  const [isRequesting, setRequesting] = useState(false);

  if (!workspace) {
    return (
      <div className={cn("space-y-2 px-3 py-3", className)} aria-hidden>
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-9 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
      </div>
    );
  }

  const isAdvisor =
    workspace.participants.find((participant) => participant.userId === currentUserId)?.isAdvisor ??
    !isStaff;
  const state = STATE_COPY[workspace.status];
  const { approval } = workspace;
  const isApproved = workspace.status === "Approved";
  const isLive = workspace.status === "Active" || workspace.status === "Inactive";
  const canRevoke = isApproved && capabilities.canRevokeApproval;
  const hasActions =
    capabilities.canApprove || capabilities.canRequestApproval || canRevoke || capabilities.canPublish;

  async function handleRequestApproval() {
    setRequesting(true);
    try {
      const next = await requestProgramApproval(programId);
      workspaceState.applyWorkspace(next);
      showAppSuccess({
        title: "Đã mời chuyên gia duyệt",
        description: workspace?.advisorName
          ? `${workspace.advisorName} sẽ nhận được thông báo.`
          : undefined,
      });
    } catch (error) {
      void workspaceState.refresh();
      showAppErrorFromUnknown(error, "advisory.approval.request");
    } finally {
      setRequesting(false);
    }
  }

  async function handlePublish() {
    try {
      await publishProgram(programId);
      showAppSuccess({ title: "Chương trình đã được xuất bản." });
      void workspaceState.refresh();
      onProgramChanged?.();
      router.refresh();
    } catch (error) {
      void workspaceState.refresh();
      showAppErrorFromUnknown(error, "programs.lifecycle");
    }
  }

  return (
    <div className={cn("space-y-2.5 px-3 py-3", className)}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", state.tone)}>
          {state.label}
        </span>
        <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {describeApprovalState(workspace, isLive)}
        </p>
      </div>

      {workspace.status === "Draft" && workspace.openPinCount > 0 ? (
        <p className="text-xs text-amber-800">
          Còn {workspace.openPinCount} mục cần sửa đang mở.
        </p>
      ) : null}

      {isLive && workspace.changesSinceApprovalCount > 0 ? (
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{workspace.changesSinceApprovalCount} thay đổi sau lần chấp thuận gần nhất.</span>
          {hasChangesView ? (
            <Button variant="ghost" size="xs" onClick={() => openChanges()}>
              Xem
            </Button>
          ) : null}
        </div>
      ) : null}

      {workspace.status === "Draft" && isStaff && !workspace.advisorName ? (
        <p className="text-xs text-muted-foreground">
          Gán chuyên gia tư vấn để có thể mời duyệt chương trình.
        </p>
      ) : null}

      {hasActions ? (
        <div className="flex flex-wrap gap-2">
          {capabilities.canApprove ? (
            <Button className="min-h-11 flex-1 lg:min-h-9" onClick={() => setApproveOpen(true)}>
              Chấp thuận
            </Button>
          ) : null}
          {capabilities.canRequestApproval ? (
            <Button
              variant="outline"
              className="min-h-11 flex-1 lg:min-h-9"
              disabled={isRequesting}
              onClick={() => void handleRequestApproval()}
            >
              {isRequesting ? "Đang gửi…" : "Mời chuyên gia duyệt"}
            </Button>
          ) : null}
          {canRevoke ? (
            <Button
              variant="outline"
              className="min-h-11 flex-1 lg:min-h-9"
              onClick={() => setRevokeOpen(true)}
            >
              {isAdvisor ? "Rút chấp thuận" : "Chỉnh sửa (huỷ chấp thuận)"}
            </Button>
          ) : null}
          {capabilities.canPublish ? (
            <Button className="min-h-11 flex-1 lg:min-h-9" onClick={() => setPublishOpen(true)}>
              Xuất bản
            </Button>
          ) : null}
        </div>
      ) : null}

      <ApproveCurriculumDialog open={isApproveOpen} onOpenChange={setApproveOpen} />
      <RevokeApprovalDialog
        open={isRevokeOpen}
        onOpenChange={setRevokeOpen}
        variant={isAdvisor ? "advisor" : "manager"}
      />
      <ConfirmDialog
        isOpen={isPublishOpen}
        onOpenChange={setPublishOpen}
        onConfirm={handlePublish}
        title="Xuất bản chương trình?"
        description={`Phiên bản ${approval?.curriculumVersion ?? workspace.curriculumVersion} đã được chấp thuận sẽ được xuất bản. Sau đó bạn có thể tạo lớp và buổi học; tuyển sinh mở riêng từng lớp.`}
        confirmLabel="Xuất bản"
      />
    </div>
  );
}

function describeApprovalState(workspace: AdvisoryWorkspace, isLive: boolean): string {
  const { approval } = workspace;
  if (approval) {
    const by = approval.approvedByName ? ` · ${approval.approvedByName}` : "";
    const at = formatApiDateTimeDisplay(approval.approvedAt);
    return `Phiên bản ${approval.curriculumVersion}${by}${at ? ` · ${at}` : ""}`;
  }
  if (isLive) return "Chưa có chấp thuận cho phiên bản hiện tại";
  return workspace.advisorName
    ? `Chuyên gia tư vấn: ${workspace.advisorName}`
    : "Chưa có chuyên gia tư vấn";
}
