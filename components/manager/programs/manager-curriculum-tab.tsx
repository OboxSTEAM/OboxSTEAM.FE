"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Sparkles } from "lucide-react";

import { useAdvisoryChat } from "@/components/advisory-chat/advisory-chat-provider";
import { CurriculumSplitPanel } from "@/components/manager/programs/curriculum-split-panel";
import { FrameworkRequirements } from "@/components/manager/programs/framework-requirements";
import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useFrameworkCheck } from "@/hooks/use-framework-check";
import {
  upgradeProgramFrameworkVersion,
  type ProgramFramework,
  type ProgramWithModules,
} from "@/lib/api";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown, showAppSuccess, subscribeApiErrorCode } from "@/lib/errors";
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
  /** The program's framework (requirements banner in Draft, target of a version upgrade). */
  framework: ProgramFramework | null;
  onRefresh: () => void;
};

/**
 * Manager curriculum editor gated by the advisory workspace: `canEditCurriculum`,
 * the live-class lock (`curriculumLocked`, or a 409 on save), and a confirm before
 * editing a framed program that is approved or live, since the first curriculum save
 * revokes the approval and moves it back to Draft.
 * Status and price are not curriculum fields and stay editable throughout.
 */
export function ManagerCurriculumTab({ program, framework, onRefresh }: ManagerCurriculumTabProps) {
  const { workspace, workspaceState, hasFramework } = useAdvisoryChat();
  const { refresh: refreshWorkspace } = workspaceState;

  const [isLockRejected, setLockRejected] = useState(false);
  const [acknowledgedEditKey, setAcknowledgedEditKey] = useState<string | null>(null);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [cohortLock, setCohortLock] = useState<CohortLockSnapshot | null>(null);

  const status = workspace?.status ?? program.status;
  const approval = workspace?.approval ?? null;
  const canEditCurriculum = workspace?.capabilities.canEditCurriculum ?? false;
  const isLocked = Boolean(workspace?.curriculumLocked) || isLockRejected;
  const isLive = status === "Active" || status === "Inactive";
  const editKey = `${status}:${approval?.id ?? workspace?.curriculumVersion ?? ""}`;
  const needsApprovalConfirm =
    hasFramework && (status === "Approved" || isLive) && acknowledgedEditKey !== editKey;
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

  const showApprovalNotice = needsApprovalConfirm && canEditCurriculum && !isLocked;
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

      {hasFramework && workspace?.hasNewerFrameworkVersion ? (
        <FrameworkUpgradeNotice framework={framework} isCohortLocked={isLocked} />
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
            <p className="text-sm font-semibold text-foreground">
              {isLive ? "Chương trình đang được xuất bản" : "Khung chương trình đã được chấp thuận"}
            </p>
            <p className="text-xs text-muted-foreground">
              {approval
                ? `${approval.approvedByName ?? "Chuyên gia"} chấp thuận lúc ${formatApiDateTimeDisplay(approval.approvedAt)}. `
                : null}
              Khung đang ở chế độ chỉ xem để tránh
              {isLive ? " đưa chương trình về Bản nháp" : " huỷ chấp thuận"} ngoài ý muốn; trạng thái
              và học phí vẫn đổi được.
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
        onConfirm={() => setAcknowledgedEditKey(editKey)}
        title={isLive ? "Chỉnh sửa sẽ đưa chương trình về Bản nháp" : "Chỉnh sửa sẽ huỷ chấp thuận hiện tại"}
        description={
          isLive
            ? "Lần lưu thay đổi khung chương trình đầu tiên sẽ huỷ chấp thuận và đưa chương trình về Bản nháp; chương trình ngừng nhận đăng ký mới cho tới khi chuyên gia chấp thuận lại và bạn xuất bản lại."
            : "Lần lưu thay đổi khung chương trình đầu tiên sẽ huỷ chấp thuận và đưa chương trình về Bản nháp. Bạn cần mời chuyên gia duyệt lại trước khi xuất bản."
        }
        confirmLabel="Tiếp tục chỉnh sửa"
        cancelLabel="Để sau"
      />
    </div>
  );
}

function FrameworkUpgradeNotice({
  framework,
  isCohortLocked,
}: {
  framework: ProgramFramework | null;
  isCohortLocked: boolean;
}) {
  const router = useRouter();
  const { programId, workspace, workspaceState, capabilities } = useAdvisoryChat();
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  if (!workspace) return null;

  const fromLabel =
    workspace.frameworkVersionNumber != null ? `v${workspace.frameworkVersionNumber}` : "phiên bản cũ";
  const toNumber = workspace.latestFrameworkVersionNumber ?? framework?.currentVersionNumber ?? null;
  const toLabel = toNumber != null ? `v${toNumber}` : "phiên bản mới";
  const targetVersionId = framework?.currentVersionId ?? null;
  const canUpgrade = capabilities.canUpgradeFrameworkVersion && targetVersionId != null;
  const blockedReason = isCohortLocked
    ? "Có lớp đang học hoặc học viên đang thanh toán nên chưa cập nhật được."
    : null;

  async function handleUpgrade() {
    if (!targetVersionId) return;
    try {
      const next = await upgradeProgramFrameworkVersion(programId, {
        frameworkVersionId: targetVersionId,
      });
      workspaceState.applyWorkspace(next);
      showAppSuccess({
        title: `Đã cập nhật khung lên ${toLabel}`,
        description: "Chương trình đã về Bản nháp và cần chuyên gia phụ trách chấp thuận lại.",
      });
      router.refresh();
    } catch (error) {
      void workspaceState.refresh();
      showAppErrorFromUnknown(error, "programs.framework-upgrade");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
      <Sparkles className="size-5 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">
          Khung {framework?.name ? `“${framework.name}” ` : ""}đã có {toLabel}
        </p>
        <p className="text-xs text-muted-foreground">
          Chương trình đang theo {fromLabel}. Cập nhật để áp dụng quy tắc mới; chương trình sẽ về Bản
          nháp và cần chuyên gia phụ trách chấp thuận lại.
          {blockedReason ? ` ${blockedReason}` : null}
        </p>
      </div>
      {canUpgrade ? (
        <Button type="button" size="sm" onClick={() => setConfirmOpen(true)}>
          Cập nhật lên {toLabel}
        </Button>
      ) : null}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleUpgrade}
        title={`Cập nhật khung lên ${toLabel}?`}
        description={`Chương trình chuyển từ ${fromLabel} sang ${toLabel}. Chấp thuận hiện tại bị huỷ, chương trình về Bản nháp (ngừng nhận đăng ký mới nếu đang mở) và cần chuyên gia phụ trách chấp thuận lại theo quy tắc mới trước khi xuất bản.`}
        confirmLabel="Cập nhật"
        cancelLabel="Để sau"
      />
    </div>
  );
}
