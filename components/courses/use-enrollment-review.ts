"use client";

import { useCallback, useState } from "react";

import { getMyProgramReview, type ProgramReview } from "@/lib/api/programs";
import { showAppError, showAppErrorFromUnknown } from "@/lib/errors";

type UseEnrollmentReviewOptions = {
  programId: string;
  /** From `ProgramEnrollmentResponseDto.reviewId` — seeds the label only. */
  reviewId: string | null;
};

/**
 * Review state for a Completed enrollment. Eligibility is fetched on open;
 * spread `dialogProps` onto `ProgramReviewDialog`.
 */
export function useEnrollmentReview({
  programId,
  reviewId,
}: UseEnrollmentReviewOptions) {
  const [hasReview, setHasReview] = useState(reviewId != null);
  const [isResolving, setIsResolving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [review, setReview] = useState<ProgramReview | null>(null);

  const openReview = useCallback(async () => {
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
  }, [programId]);

  const handleSaved = useCallback((saved: ProgramReview) => {
    setReview(saved);
    setHasReview(true);
  }, []);

  return {
    hasReview,
    isResolving,
    openReview,
    dialogProps: {
      open: isOpen,
      onOpenChange: setIsOpen,
      review,
      onSaved: handleSaved,
    },
  };
}
