"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

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
import { withdrawProgramEnrollment } from "@/lib/api/program-enrollments";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

type WithdrawProgramEnrollmentControlProps = {
  enrollmentId: string;
  programName?: string | null;
  /** Where to send the student after a successful quit. */
  redirectTo?: string;
  variant?: "sidebar" | "nav" | "ghost";
  className?: string;
  onWithdrawn?: () => void;
};

export function WithdrawProgramEnrollmentControl({
  enrollmentId,
  programName,
  redirectTo,
  variant = "sidebar",
  className,
  onWithdrawn,
}: WithdrawProgramEnrollmentControlProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      await withdrawProgramEnrollment(enrollmentId);
      showAppSuccess({
        title: "Đã rời chương trình",
        description:
          "Ghi danh chuyển sang Đã hủy. Bạn có thể đăng ký lại sau (phí 50% trong 1 tháng).",
      });
      setOpen(false);
      onWithdrawn?.();
      if (redirectTo) {
        router.replace(redirectTo);
        router.refresh();
      } else {
        router.refresh();
      }
    } catch (error) {
      showAppErrorFromUnknown(error, "programs.withdraw");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isNavDanger = variant === "nav";

  const triggerClassName = isNavDanger
    ? "h-10 w-full justify-center gap-2 border border-[#E94B3C]/40 bg-[#FFF0EE] px-3 text-xs font-semibold text-[#a82a1e] shadow-none hover:bg-[#FFE4E0] hover:text-[#8a2218]"
    : variant === "ghost"
      ? "h-auto px-0 text-xs font-medium text-[#6B6B6B] underline-offset-2 hover:bg-transparent hover:text-[#2D2D2D] hover:underline"
      : "h-auto w-full justify-center px-0 text-xs font-medium text-[#6B6B6B] underline-offset-2 hover:bg-transparent hover:text-[#2D2D2D] hover:underline";

  return (
    <>
      <Button
        type="button"
        variant={isNavDanger ? "outline" : "ghost"}
        className={cn(triggerClassName, className)}
        onClick={() => setOpen(true)}
      >
        {isNavDanger ? (
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
        ) : null}
        Rời chương trình
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPopup className="max-w-[420px] gap-5">
          <DialogClose />
          <DialogHeader className="gap-1.5 text-left">
            <DialogTitle>Rời chương trình?</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {programName?.trim()
                ? `Bạn sẽ dừng học “${programName.trim()}”. `
                : "Bạn sẽ dừng học chương trình này. "}
              Ghế lớp được thu hồi ngay, ghi danh chuyển sang Đã hủy. Muốn học
              tiếp sau đó phải đăng ký lại (50% trong 1 tháng kể từ khi rời).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setOpen(false)}
            >
              Ở lại học
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting}
              onClick={() => void handleConfirm()}
            >
              {isSubmitting ? "Đang xử lý…" : "Xác nhận rời"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  );
}
