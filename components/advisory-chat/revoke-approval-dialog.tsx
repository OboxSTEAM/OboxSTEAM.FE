"use client";

import { useId, useState } from "react";

import { useAdvisoryChat } from "@/components/advisory-chat/advisory-chat-provider";
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
import { revokeProgramApproval } from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { APPROVAL_COMMENT_MAX_LENGTH } from "@/lib/validations";

type RevokeVariant = "manager" | "advisor";

const COPY: Record<
  RevokeVariant,
  { title: string; description: (version: number) => string; confirm: string; success: string; placeholder: string }
> = {
  manager: {
    title: "Mở lại để chỉnh sửa?",
    description: (version) =>
      `Chấp thuận phiên bản ${version} sẽ bị huỷ và chương trình trở về Bản nháp. Chuyên gia cần chấp thuận lại trước khi xuất bản.`,
    confirm: "Huỷ chấp thuận và chỉnh sửa",
    success: "Đã mở lại chương trình để chỉnh sửa",
    placeholder: "Ví dụ: cần bổ sung hoạt động offline cho học phần 2…",
  },
  advisor: {
    title: "Rút chấp thuận?",
    description: (version) =>
      `Chấp thuận phiên bản ${version} sẽ bị huỷ. Quản lý không thể xuất bản cho tới khi bạn chấp thuận lại.`,
    confirm: "Rút chấp thuận",
    success: "Đã rút chấp thuận",
    placeholder: "Cho quản lý biết điều cần xem lại…",
  },
};

type RevokeApprovalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: RevokeVariant;
};

export function RevokeApprovalDialog({ open, onOpenChange, variant }: RevokeApprovalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md gap-5">
        <DialogClose />
        {open ? <RevokeApprovalBody variant={variant} onClose={() => onOpenChange(false)} /> : null}
      </DialogPopup>
    </Dialog>
  );
}

function RevokeApprovalBody({ variant, onClose }: { variant: RevokeVariant; onClose: () => void }) {
  const { programId, workspace, workspaceState } = useAdvisoryChat();
  const reasonId = useId();
  const [reason, setReason] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);

  const copy = COPY[variant];
  const version = workspace?.approval?.curriculumVersion ?? workspace?.curriculumVersion ?? 0;
  const trimmed = reason.trim();
  const isTooLong = trimmed.length > APPROVAL_COMMENT_MAX_LENGTH;

  async function handleConfirm() {
    if (isTooLong || isSubmitting) return;
    setSubmitting(true);
    try {
      const next = await revokeProgramApproval(programId, { reason: trimmed || null });
      workspaceState.applyWorkspace(next);
      showAppSuccess({ title: copy.success });
      onClose();
    } catch (error) {
      void workspaceState.refresh();
      showAppErrorFromUnknown(error, "advisory.approval.revoke");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <DialogHeader className="gap-1.5">
        <DialogTitle>{copy.title}</DialogTitle>
        <DialogDescription>{copy.description(version)}</DialogDescription>
      </DialogHeader>

      <div className="space-y-1.5">
        <Label htmlFor={reasonId} className="text-xs font-medium">
          Lý do (không bắt buộc)
        </Label>
        <Textarea
          id={reasonId}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          placeholder={copy.placeholder}
          aria-invalid={isTooLong || undefined}
          disabled={isSubmitting}
        />
        <p
          className={cn(
            "text-right font-mono text-[11px] tabular-nums",
            isTooLong ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {trimmed.length}/{APPROVAL_COMMENT_MAX_LENGTH}
        </p>
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Huỷ
        </Button>
        <Button
          variant="destructive"
          onClick={() => void handleConfirm()}
          disabled={isTooLong || isSubmitting}
        >
          {isSubmitting ? "Đang xử lý…" : copy.confirm}
        </Button>
      </DialogFooter>
    </>
  );
}
