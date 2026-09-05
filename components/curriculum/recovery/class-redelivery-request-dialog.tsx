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
import { createClassRedeliveryRequest } from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";

type ClassRedeliveryRequestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleEnrollmentId: string;
  onCreated: () => void;
};

export function ClassRedeliveryRequestDialog({
  open,
  onOpenChange,
  moduleEnrollmentId,
  onCreated,
}: ClassRedeliveryRequestDialogProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await createClassRedeliveryRequest({
        moduleEnrollmentId,
        requestMessage: message.trim() || null,
      });
      showAppSuccess({
        title: "Đã gửi yêu cầu học lại lớp",
        description:
          "Tiếp theo hãy chọn lớp Standard phù hợp rồi thanh toán phí học lại (50%).",
      });
      setMessage("");
      onOpenChange(false);
      onCreated();
    } catch (error) {
      showAppErrorFromUnknown(error, "class-redelivery.create");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>Xin học lại lớp</DialogTitle>
          <DialogDescription>
            Chọn lớp Open để học lại từ đầu, hoặc lớp đang chạy đủ điều kiện để
            giữ tiến độ. Phí học lại bằng 50% giá chương trình. Đóng danh sách
            lớp nếu chưa muốn chọn — bạn vẫn Active.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Ghi chú (không bắt buộc)"
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
