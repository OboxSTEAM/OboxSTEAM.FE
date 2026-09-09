"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Rocket,
  Send,
  Undo2,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import {
  publishProgram,
  submitProgramReview,
  withdrawProgramReview,
  type ProgramStatus,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { PROGRAM_STATUS_LABELS } from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

type LifecycleAction = "submit" | "withdraw" | "publish";

const STATUS_TONE: Record<ProgramStatus, string> = {
  Draft: "bg-muted text-muted-foreground",
  PendingReview: "bg-[#4FC3F7]/15 text-[#0D6E9C] dark:text-[#7dd3fc]",
  Approved: "bg-[#7E57C2]/15 text-[#51308a] dark:text-[#c4b5fd]",
  Active: "bg-[#7CB342]/15 text-[#33691e] dark:text-[#a5d66f]",
  Inactive: "bg-primary/10 text-primary",
};

const STATUS_HINT: Record<ProgramStatus, string> = {
  Draft:
    "Hoàn thiện khung chương trình rồi gửi hội đồng chuyên gia thẩm định.",
  PendingReview:
    "Chương trình đang chờ chuyên gia thẩm định — khung nội dung tạm khóa chỉnh sửa.",
  Approved:
    "Hội đồng đã phê duyệt. Xuất bản để mở chương trình cho phụ huynh và học viên.",
  Active: "Chương trình đang mở tuyển sinh.",
  Inactive: "Chương trình đã ngừng hoạt động.",
};

const ACTION_COPY: Record<
  LifecycleAction,
  { title: string; description: string; confirmLabel: string; success: string }
> = {
  submit: {
    title: "Gửi thẩm định chương trình?",
    description:
      "Chương trình sẽ chuyển sang trạng thái Chờ duyệt và khung nội dung bị khóa cho tới khi chuyên gia phản hồi.",
    confirmLabel: "Gửi duyệt",
    success: "Đã gửi chương trình cho hội đồng thẩm định.",
  },
  withdraw: {
    title: "Rút chương trình khỏi hàng chờ?",
    description:
      "Chương trình trở về trạng thái Bản nháp để bạn tiếp tục chỉnh sửa khung nội dung.",
    confirmLabel: "Rút duyệt",
    success: "Đã rút chương trình về bản nháp.",
  },
  publish: {
    title: "Xuất bản chương trình?",
    description:
      "Chương trình sẽ chuyển sang trạng thái Đang mở và hiển thị công khai cho phụ huynh.",
    confirmLabel: "Xuất bản",
    success: "Chương trình đã được xuất bản.",
  },
};

type ProgramReviewActionsProps = {
  programId: string;
  status: ProgramStatus;
  hasFramework: boolean;
  hasAdvisor?: boolean;
  moduleCount: number;
  onChanged?: () => void;
};

export function ProgramReviewActions({
  programId,
  status,
  hasFramework,
  hasAdvisor = false,
  moduleCount,
  onChanged,
}: ProgramReviewActionsProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<LifecycleAction | null>(
    null,
  );
  const [isBusy, setIsBusy] = useState(false);

  async function runAction(action: LifecycleAction) {
    setIsBusy(true);
    try {
      if (action === "submit") await submitProgramReview(programId);
      else if (action === "withdraw") await withdrawProgramReview(programId);
      else await publishProgram(programId);

      showAppSuccess({ title: ACTION_COPY[action].success });
      setPendingAction(null);
      onChanged?.();
      router.refresh();
    } catch (error) {
      showAppErrorFromUnknown(error, "programs.lifecycle");
    } finally {
      setIsBusy(false);
    }
  }

  const canSubmit = status === "Draft" && moduleCount > 0;

  return (
    <>
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-[0_2px_10px_rgba(45,45,45,0.03)]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={cn(
                "rounded-md text-[11px] font-semibold",
                STATUS_TONE[status],
              )}
            >
              {PROGRAM_STATUS_LABELS[status]}
            </Badge>
            {hasFramework ? (
              <Badge
                variant="outline"
                className="rounded-md border-border text-[11px] font-medium text-muted-foreground"
              >
                Đã gắn khung thẩm định
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="rounded-md border-dashed border-border text-[11px] font-medium text-muted-foreground"
              >
                Chưa gắn khung thẩm định
              </Badge>
            )}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {STATUS_HINT[status]}
            {status === "Draft" && moduleCount === 0
              ? " Cần ít nhất một học phần trước khi gửi duyệt."
              : ""}
            {status === "Draft" && !hasAdvisor
              ? " Nên gán chuyên gia phụ trách trước khi gửi thẩm định."
              : ""}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {status === "Draft" ? (
            <ActionButton
              icon={Send}
              label="Gửi duyệt"
              disabled={!canSubmit || isBusy}
              onClick={() => setPendingAction("submit")}
            />
          ) : null}

          {status === "PendingReview" ? (
            <ActionButton
              icon={Undo2}
              label="Rút duyệt"
              variant="outline"
              disabled={isBusy}
              onClick={() => setPendingAction("withdraw")}
            />
          ) : null}

          {status === "Approved" ? (
            <>
              <ActionButton
                icon={Rocket}
                label="Xuất bản"
                disabled={isBusy}
                onClick={() => setPendingAction("publish")}
              />
              <ActionButton
                icon={Undo2}
                label="Rút duyệt"
                variant="outline"
                disabled={isBusy}
                onClick={() => setPendingAction("withdraw")}
              />
            </>
          ) : null}

          {status === "Active" ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#7CB342]/12 px-3.5 py-2 text-xs font-semibold text-[#33691e] dark:text-[#a5d66f]">
              <CheckCircle2 className="size-4" />
              Đang mở tuyển sinh
            </span>
          ) : null}
        </div>
      </section>

      <ConfirmDialog
        isOpen={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        title={pendingAction ? ACTION_COPY[pendingAction].title : ""}
        description={pendingAction ? ACTION_COPY[pendingAction].description : ""}
        confirmLabel={pendingAction ? ACTION_COPY[pendingAction].confirmLabel : ""}
        onConfirm={async () => {
          if (pendingAction) await runAction(pendingAction);
        }}
      />
    </>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  variant = "default",
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "outline";
}) {
  return (
    <Button
      type="button"
      variant={variant}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-10 gap-2 rounded-xl px-4 text-sm font-semibold",
        variant === "default"
          ? "bg-primary text-white hover:bg-primary/90"
          : "border-border",
      )}
    >
      <Icon className="size-4" />
      {label}
    </Button>
  );
}
