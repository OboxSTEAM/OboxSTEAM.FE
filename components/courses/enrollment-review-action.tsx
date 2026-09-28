"use client";

import { useState } from "react";
import { Loader2, Star } from "lucide-react";

import { ProgramReviewDialog } from "@/components/programs/reviews/program-review-dialog";
import { Button } from "@/components/ui/button";
import {
  getMyProgramReview,
  type ProgramReview,
} from "@/lib/api/programs";
import { showAppError, showAppErrorFromUnknown } from "@/lib/errors";
import { cn } from "@/lib/utils";

type EnrollmentReviewActionProps = {
  programId: string;
  programName?: string | null;
  /** From `ProgramEnrollmentResponseDto.reviewId` — drives the label only. */
  reviewId: string | null;
  className?: string;
};

/** "Đánh giá" / "Sửa đánh giá" for Completed enrollments; review state is fetched on click. */
export function EnrollmentReviewAction({
  programId,
  programName,
  reviewId,
  className,
}: EnrollmentReviewActionProps) {
  const [hasReview, setHasReview] = useState(reviewId != null);
  const [isResolving, setIsResolving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [review, setReview] = useState<ProgramReview | null>(null);

  const handleClick = async () => {
    setIsResolving(true);
    try {
      const result = await getMyProgramReview(programId);
      const state = result?.data;
      if (!state) throw new Error("Review state response missing data.");

      if (state.review) {
        setReview(state.review);
        setHasReview(true);
        setIsOpen(true);
        return;
      }

      if (state.canReview) {
        setReview(null);
        setHasReview(false);
        setIsOpen(true);
        return;
      }

      showAppError({
        title: "Chưa thể đánh giá",
        reason:
          state.reason === "RemovedByModerator"
            ? "Đánh giá trước của bạn đã bị quản lý gỡ bỏ."
            : "Bạn chỉ có thể đánh giá sau khi hoàn thành chương trình.",
        action:
          state.reason === "RemovedByModerator"
            ? "Liên hệ hỗ trợ OboxSTEAM nếu bạn cho rằng đây là nhầm lẫn."
            : "Hoàn thành chương trình rồi quay lại để chia sẻ cảm nhận.",
      });
    } catch (error) {
      showAppErrorFromUnknown(error, "programs.reviews.mine");
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("inline-flex gap-1.5 border-[#E5E5E0] text-[#2D2D2D]", className)}
        disabled={isResolving}
        aria-busy={isResolving}
        onClick={() => void handleClick()}
      >
        {isResolving ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Star
            className={cn(
              "size-4",
              hasReview ? "fill-[#FDD835] text-[#FDD835]" : "text-[#6B6B6B]",
            )}
            aria-hidden
          />
        )}
        {hasReview ? "Sửa đánh giá" : "Đánh giá"}
      </Button>

      <ProgramReviewDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        programId={programId}
        programName={programName}
        review={review}
        onSaved={(saved) => {
          setReview(saved);
          setHasReview(true);
        }}
      />
    </>
  );
}
