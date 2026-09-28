"use client";

import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProgramReview } from "@/lib/api/programs";

import { ProgramReviewForm } from "./program-review-form";

type ProgramReviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;
  programName?: string | null;
  review?: ProgramReview | null;
  onSaved?: (review: ProgramReview) => void;
  /** Completion prompt copy (learn page) vs neutral copy (My Courses). */
  variant?: "default" | "completion";
};

export function ProgramReviewDialog({
  open,
  onOpenChange,
  programId,
  programName,
  review,
  onSaved,
  variant = "default",
}: ProgramReviewDialogProps) {
  const isEdit = review != null;
  const name = programName?.trim();

  const title = isEdit
    ? "Sửa đánh giá của bạn"
    : variant === "completion"
      ? "Chúc mừng bạn đã hoàn thành!"
      : "Đánh giá chương trình";

  const description =
    variant === "completion" && !isEdit
      ? `Bạn vừa hoàn thành${name ? ` “${name}”` : " chương trình"}. Dành 1 phút chia sẻ cảm nhận nhé.`
      : name
        ? `Chia sẻ cảm nhận của bạn về “${name}”.`
        : "Chia sẻ cảm nhận của bạn về chương trình.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-[480px] gap-5 bg-white">
        <DialogClose />
        <DialogHeader className="gap-1.5 pr-8 text-left">
          <DialogTitle className="text-[#2D2D2D]">{title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-[#6B6B6B]">
            {description}
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <ProgramReviewForm
            key={review?.id ?? "new"}
            programId={programId}
            review={review}
            onCancel={() => onOpenChange(false)}
            onSaved={(saved) => {
              onSaved?.(saved);
              onOpenChange(false);
            }}
          />
        ) : null}
      </DialogPopup>
    </Dialog>
  );
}
