"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  acceptIntensiveClassRedeliveryRequest,
  declineIntensiveClassRedeliveryRequest,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";

type ClassRedeliveryIntensiveConsentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  onResolved: () => void;
};

export function ClassRedeliveryIntensiveConsentDialog({
  open,
  onOpenChange,
  requestId,
  onResolved,
}: ClassRedeliveryIntensiveConsentDialogProps) {
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);

  async function handleAccept() {
    setBusy("accept");
    try {
      await acceptIntensiveClassRedeliveryRequest(requestId);
      showAppSuccess({
        title: "Đã nhận lịch học nén",
        description: "Tiếp theo hãy thanh toán để giữ lớp gốc và thêm ghế học lại.",
      });
      onOpenChange(false);
      onResolved();
    } catch (error) {
      showAppErrorFromUnknown(error, "class-redelivery.intensive");
    } finally {
      setBusy(null);
    }
  }

  async function handleDecline() {
    setBusy("decline");
    try {
      await declineIntensiveClassRedeliveryRequest(requestId);
      showAppSuccess({
        title: "Đã từ chối lịch nén",
        description: "Tiến độ module được giữ. Bạn có thể xin học lại sau.",
      });
      onOpenChange(false);
      onResolved();
    } catch (error) {
      showAppErrorFromUnknown(error, "class-redelivery.intensive");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="relative border-b border-learn-border px-6 pb-4 pt-5">
          <DialogClose className="top-4 right-4" />
          <DialogHeader className="gap-1.5 pr-8">
            <DialogTitle className="text-lg font-semibold">
              Xác nhận lịch học nén
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Quản lý đã mở lớp học lại (Remedial) với lịch nén. Nhận lịch để
              thanh toán và học song song (giữ lớp gốc). Từ chối sẽ rút yêu cầu —
              tiến độ vẫn được giữ.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="border-learn-border"
            disabled={busy != null}
            onClick={() => void handleDecline()}
          >
            {busy === "decline" ? "Đang từ chối…" : "Từ chối"}
          </Button>
          <Button
            type="button"
            className="bg-learn-primary text-white hover:bg-learn-primary/90"
            disabled={busy != null}
            onClick={() => void handleAccept()}
          >
            {busy === "accept" ? "Đang xác nhận…" : "Nhận lịch nén"}
          </Button>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
