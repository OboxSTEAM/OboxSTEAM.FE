"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createAssessmentRecoveryRequest } from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";

type AssessmentRecoveryRequestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleEnrollmentId: string;
  assignmentId: string;
  onCreated: () => void;
};

export function AssessmentRecoveryRequestDialog({
  open,
  onOpenChange,
  moduleEnrollmentId,
  assignmentId,
  onCreated,
}: AssessmentRecoveryRequestDialogProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await createAssessmentRecoveryRequest({
        moduleEnrollmentId,
        assignmentId,
        studentMessage: message.trim() || null,
      });
      showAppSuccess({
        title: "Đã gửi yêu cầu làm lại",
        description: "Mentor sẽ xem xét và phản hồi sớm.",
      });
      setMessage("");
      onOpenChange(false);
      onCreated();
    } catch (error) {
      showAppErrorFromUnknown(error, "assessment-recovery.create");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>Xin làm thêm lần</DialogTitle>
          <DialogDescription>
            Gửi yêu cầu tới mentor để được thêm lượt làm bài (cùng lớp hiện tại).
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Lý do / ghi chú cho mentor (không bắt buộc)"
          className="min-h-24 border-learn-border"
          maxLength={1000}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? "Đang gửi…" : "Gửi yêu cầu"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
