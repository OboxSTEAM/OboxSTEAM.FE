"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

import { useAdvisoryChat } from "@/components/advisory-chat/advisory-chat-provider";
import { CurriculumSplitPanel } from "@/components/manager/programs/curriculum-split-panel";
import { FrameworkRequirements } from "@/components/manager/programs/framework-requirements";
import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useFrameworkCheck } from "@/hooks/use-framework-check";
import type { ProgramFramework, ProgramWithModules } from "@/lib/api";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { subscribeApiErrorCode } from "@/lib/errors";
import {
  fetchProgramCohortLock,
  type ProgramCohortLock,
  type ProgramCohortLockClass,
} from "@/lib/programs/editability";

const LOCKED_FALLBACK_REASON =
  "Không thể chỉnh sửa khi lớp đang diễn ra hoặc đã có học viên.";
const READ_ONLY_REASON = "Bạn chỉ có quyền xem khung chương trình này.";
const NO_BLOCKING_CLASSES: ProgramCohortLockClass[] = [];

type CohortLockSnapshot = { programId: string; lock: ProgramCohortLock };

type ManagerCurriculumTabProps = {
  program: ProgramWithModules;
  /** Framework of a Draft program, for the requirements banner. */
  framework: ProgramFramework | null;
  onRefresh: () => void;
};

/**
 * Manager curriculum editor gated by the advisory workspace: `canEditCurriculum`,
 * the live-class lock (`curriculumLocked`, or a 409 on save), and a confirm before
 * editing an approved curriculum, since the first curriculum save revokes the approval.
 * Status, price and framework are not curriculum fields and stay editable throughout.
 */
export function ManagerCurriculumTab({ program, framework, onRefresh }: ManagerCurriculumTabProps) {
  const { workspace, workspaceState } = useAdvisoryChat();
  const { refresh: refreshWorkspace } = workspaceState;

  const [isLockRejected, setLockRejected] = useState(false);
  const [acknowledgedApprovalId, setAcknowledgedApprovalId] = useState<string | null>(null);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [cohortLock, setCohortLock] = useState<CohortLockSnapshot | null>(null);

  const status = workspace?.status ?? program.status;
  const approval = workspace?.approval ?? null;
  const canEditCurriculum = workspace?.capabilities.canEditCurriculum ?? false;
  const isLocked = Boolean(workspace?.curriculumLocked) || isLockRejected;
  const needsApprovalConfirm = approval !== null && acknowledgedApprovalId !== approval.id;
  const isReadOnly = !workspace || !canEditCurriculum || isLocked || needsApprovalConfirm;
  const canEditProgramSettings = workspace != null && (canEditCurriculum || isLocked);

  const showRequirements = status === "Draft" && program.frameworkId != null && framework != null;
  const frameworkCheck = useFrameworkCheck(program.id, { enabled: showRequirements });

  useEffect(
    () =>
      subscribeApiErrorCode("CURRICULUM_LOCKED_COHORT", () => {
        setLockRejected(true);
        void refreshWorkspace();
      }),
    [refreshWorkspace],
  );

  useEffect(() => {
    if (!isLocked) return;
    let isActive = true;
    void fetchProgramCohortLock(program.id).then((lock) => {
      if (isActive) setCohortLock({ programId: program.id, lock });
    });
    return () => {
      isActive = false;
    };
  }, [isLocked, program.id]);

  const lockDetails = cohortLock?.programId === program.id ? cohortLock.lock : null;
  let lockReason: string | null = null;
  let blockingClasses = NO_BLOCKING_CLASSES;
  if (isLocked) {
    lockReason = lockDetails?.locked ? lockDetails.reason : LOCKED_FALLBACK_REASON;
    blockingClasses = lockDetails?.blockingClasses ?? NO_BLOCKING_CLASSES;
  } else if (workspace && !canEditCurriculum) {
    lockReason = READ_ONLY_REASON;
  }

  const showApprovalNotice =
    approval !== null && needsApprovalConfirm && canEditCurriculum && !isLocked;
  const isWorkspaceFailed = !workspace && workspaceState.error != null;

  return (
    <div className="space-y-6">
      {isWorkspaceFailed ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3"
        >
          <p className="min-w-0 flex-1 text-sm text-foreground">
            Không tải được quyền chỉnh sửa nên khung chương trình đang ở chế độ chỉ xem.
          </p>
          <Button type="button" size="sm" variant="outline" onClick={() => void refreshWorkspace()}>
            Thử lại
          </Button>
        </div>
      ) : null}

      {showRequirements ? (
        <FrameworkRequirements
          variant="banner"
          framework={framework}
          frameworkVersionNumber={program.frameworkVersionNumber ?? framework.currentVersionNumber}
          isCategoryMismatch={program.category != null && framework.category !== program.category}
          check={frameworkCheck.check}
          isCheckLoading={frameworkCheck.isLoading}
        />
      ) : null}

      {showApprovalNotice ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
          <ShieldCheck className="size-5 shrink-0 text-emerald-700" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Khung chương trình đã được chấp thuận</p>
            <p className="text-xs text-muted-foreground">
              {approval.approvedByName ?? "Chuyên gia"} chấp thuận lúc{" "}
              {formatApiDateTimeDisplay(approval.approvedAt)}. Khung đang ở chế độ chỉ xem để tránh
              huỷ chấp thuận ngoài ý muốn; trạng thái, học phí và khung thẩm định vẫn đổi được.
            </p>
          </div>
          <Button type="button" size="sm" onClick={() => setConfirmOpen(true)}>
            Chỉnh sửa
          </Button>
        </div>
      ) : null}

      <CurriculumSplitPanel
        program={program}
        onRefresh={onRefresh}
        cohortLocked={isReadOnly}
        canEditProgramSettings={canEditProgramSettings}
        lockReason={lockReason}
        blockingClasses={blockingClasses}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => setAcknowledgedApprovalId(approval?.id ?? null)}
        title="Chỉnh sửa sẽ huỷ chấp thuận hiện tại"
        description={
          status === "Approved"
            ? "Lần lưu thay đổi khung chương trình đầu tiên sẽ huỷ chấp thuận và đưa chương trình về Bản nháp. Bạn cần mời chuyên gia duyệt lại trước khi xuất bản."
            : "Lần lưu thay đổi khung chương trình đầu tiên sẽ huỷ chấp thuận. Chương trình vẫn giữ trạng thái hiện tại nhưng không còn được ghi nhận là đã chấp thuận."
        }
        confirmLabel="Tiếp tục chỉnh sửa"
        cancelLabel="Để sau"
      />
    </div>
  );
}
