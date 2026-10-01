"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DiscussionMessage } from "@/lib/api";

type DeleteMessageDialogProps = {
  message: DiscussionMessage | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (message: DiscussionMessage) => Promise<void>;
};

export function DeleteMessageDialog({ message, onOpenChange, onConfirm }: DeleteMessageDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirm() {
    if (!message) return;
    setIsDeleting(true);
    try {
      await onConfirm(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={message !== null} onOpenChange={(open) => !isDeleting && onOpenChange(open)}>
      <DialogPopup className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Xoá tin nhắn?</DialogTitle>
          <DialogDescription>
            Mọi người sẽ thấy “Tin nhắn đã bị xoá” thay cho nội dung. Không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
          >
            Huỷ
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={() => void handleConfirm()}
          >
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : null}
            Xoá
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
