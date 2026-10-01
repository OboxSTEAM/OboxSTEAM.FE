"use client";

import { useId, useState } from "react";

import { useAdvisoryChat } from "@/components/advisory-chat/advisory-chat-provider";
import { FrameworkCheckList } from "@/components/advisory-chat/framework-check-list";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFrameworkCheck } from "@/hooks/use-framework-check";
import { approveProgram, getFrameworkCheckFromError } from "@/lib/api";
import { getApiErrorCode, showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { APPROVAL_COMMENT_MAX_LENGTH } from "@/lib/validations";

type ApproveCurriculumDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Advisor sign-off on one curriculum version — gated by framework rules and open pins. */
export function ApproveCurriculumDialog({ open, onOpenChange }: ApproveCurriculumDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-h-[90dvh] max-w-lg gap-5 overflow-y-auto">
        <DialogClose />
        {open ? <ApproveCurriculumBody onClose={() => onOpenChange(false)} /> : null}
      </DialogPopup>
    </Dialog>
  );
}

function ApproveCurriculumBody({ onClose }: { onClose: () => void }) {
  const {
    programId,
    workspace,
    workspaceState,
    hasChangesView,
    openChanges,
    setActiveTab,
    setChatOpen,
  } = useAdvisoryChat();
  const frameworkCheck = useFrameworkCheck(programId);
  const commentId = useId();

  const currentVersion = workspace?.curriculumVersion ?? 0;
  const [reviewedVersion, setReviewedVersion] = useState(currentVersion);
  const [comment, setComment] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);

  const openPinCount = workspace?.openPinCount ?? 0;
  const addressedPinCount = workspace?.addressedPinCount ?? 0;
  const changeCount = workspace?.changesSinceApprovalCount ?? 0;
  const check = frameworkCheck.check;

  const isVersionChanged = currentVersion !== reviewedVersion;
  const isCommentTooLong = comment.trim().length > APPROVAL_COMMENT_MAX_LENGTH;
  const isCheckFailing = check !== null && !check.allPassed;
  const canConfirm =
    workspace !== null &&
    check !== null &&
    !isCheckFailing &&
    openPinCount === 0 &&
    !isVersionChanged &&
    !isCommentTooLong &&
    !isSubmitting;

  const blockReason = !check
    ? "Đang chờ kết quả kiểm tra khung."
    : isCheckFailing
      ? "Chương trình chưa đạt yêu cầu khung."
      : openPinCount > 0
        ? "Còn mục cần sửa đang mở."
        : isVersionChanged
          ? "Hãy xem lại phiên bản mới trước khi chấp thuận."
          : null;

  function handleOpenChat() {
    setActiveTab("chat");
    setChatOpen(true);
    onClose();
  }

  function handleOpenChanges() {
    openChanges();
    onClose();
  }

  async function handleConfirm() {
    if (!canConfirm) return;
    setSubmitting(true);
    try {
      const next = await approveProgram(programId, {
        curriculumVersion: reviewedVersion,
        comment: comment.trim() || null,
      });
      workspaceState.applyWorkspace(next);
      showAppSuccess({
        title: "Đã chấp thuận chương trình",
        description: `Phiên bản ${next.approval?.curriculumVersion ?? reviewedVersion} sẵn sàng để quản lý xuất bản.`,
      });
      onClose();
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === "FRAMEWORK_CHECK_FAILED") {
        const failedCheck = getFrameworkCheckFromError(error);
        if (failedCheck) frameworkCheck.applyCheck(failedCheck);
        else void frameworkCheck.refresh();
      } else {
        void workspaceState.refresh();
      }
      showAppErrorFromUnknown(error, "advisory.approval.approve");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <DialogHeader className="gap-1.5">
        <DialogTitle>Chấp thuận chương trình</DialogTitle>
        <DialogDescription>
          Bạn xác nhận đã xem curriculum phiên bản {reviewedVersion}. Sau khi chấp thuận, quản lý có
          thể xuất bản chương trình.
        </DialogDescription>
      </DialogHeader>

      {isVersionChanged ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-500/12 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-300">
          <span className="min-w-0 flex-1">
            Chương trình vừa được cập nhật lên phiên bản {currentVersion}. Hãy xem lại thay đổi trước
            khi chấp thuận.
          </span>
          <div className="flex gap-1.5">
            {hasChangesView ? (
              <Button variant="outline" size="xs" onClick={handleOpenChanges}>
                Xem thay đổi
              </Button>
            ) : null}
            <Button size="xs" onClick={() => setReviewedVersion(currentVersion)}>
              Đã xem
            </Button>
          </div>
        </div>
      ) : null}

      <section className="space-y-2" aria-labelledby={`${commentId}-framework`}>
        <h3
          id={`${commentId}-framework`}
          className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Kiểm tra khung
        </h3>
        <FrameworkCheckList
          check={check}
          isLoading={frameworkCheck.isLoading}
          error={frameworkCheck.error}
          onRetry={() => void frameworkCheck.refresh()}
          onNavigated={onClose}
        />
      </section>

      <section className="space-y-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Trước khi chấp thuận
        </h3>
        <SummaryRow
          tone={openPinCount > 0 ? "warning" : "neutral"}
          text={
            openPinCount > 0
              ? `Còn ${openPinCount} mục cần sửa đang mở — cần xử lý hoặc gỡ ghim trước.`
              : addressedPinCount > 0
                ? `Không còn mục cần sửa đang mở · ${addressedPinCount} mục đã sửa chờ bạn xác nhận.`
                : "Không còn mục cần sửa nào đang mở."
          }
          actionLabel={openPinCount > 0 || addressedPinCount > 0 ? "Mở trò chuyện" : null}
          onAction={handleOpenChat}
        />
        <SummaryRow
          tone="neutral"
          text={
            changeCount > 0
              ? `${changeCount} thay đổi chưa được chấp thuận.`
              : "Không có thay đổi mới kể từ lần chấp thuận gần nhất."
          }
          actionLabel={changeCount > 0 && hasChangesView ? "Xem" : null}
          onAction={handleOpenChanges}
        />
      </section>

      <div className="space-y-1.5">
        <Label htmlFor={commentId} className="text-xs font-medium">
          Nhận xét (không bắt buộc)
        </Label>
        <Textarea
          id={commentId}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={3}
          placeholder="Ghi chú cho quản lý khi chấp thuận…"
          aria-invalid={isCommentTooLong || undefined}
          disabled={isSubmitting}
        />
        <p
          className={cn(
            "text-right font-mono text-[11px] tabular-nums",
            isCommentTooLong ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {comment.trim().length}/{APPROVAL_COMMENT_MAX_LENGTH}
        </p>
      </div>

      <DialogFooter className="items-center gap-2">
        {blockReason ? (
          <p className="mr-auto text-xs text-muted-foreground" role="status">
            {blockReason}
          </p>
        ) : null}
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Huỷ
        </Button>
        <Button onClick={() => void handleConfirm()} disabled={!canConfirm}>
          {isSubmitting ? "Đang chấp thuận…" : `Chấp thuận phiên bản ${reviewedVersion}`}
        </Button>
      </DialogFooter>
    </>
  );
}

function SummaryRow({
  tone,
  text,
  actionLabel,
  onAction,
}: {
  tone: "neutral" | "warning";
  text: string;
  actionLabel: string | null;
  onAction: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs",
        tone === "warning"
          ? "bg-amber-500/12 text-amber-800 dark:text-amber-300"
          : "bg-muted/60 text-muted-foreground",
      )}
    >
      <span className="min-w-0 flex-1 leading-relaxed">{text}</span>
      {actionLabel ? (
        <Button variant="ghost" size="xs" onClick={onAction} className="shrink-0">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
