"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import { ProgramReviewCard } from "@/components/programs/detail/program-review-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyProgramReview } from "@/hooks/use-my-program-review";
import { deleteProgramReview, type ProgramReview } from "@/lib/api/programs";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";

import { ProgramReviewForm } from "./program-review-form";

/** `/programs/{id}?review=1` — deep link from the completion notification. */
export const PROGRAM_REVIEW_FOCUS_PARAM = "review";

type ProgramMyReviewPanelProps = {
  programId: string;
  /** Called after create/update/delete so the public list and rating refresh. */
  onChanged: () => void;
};

export function ProgramMyReviewPanel({
  programId,
  onChanged,
}: ProgramMyReviewPanelProps) {
  const { data, isLoading, refresh, mutate } = useMyProgramReview(programId);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasFocusedRef = useRef(false);

  const review = data?.review ?? null;
  const canReview = data?.canReview ?? false;
  const isActionable = canReview || review != null;

  useEffect(() => {
    if (hasFocusedRef.current || !isActionable) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get(PROGRAM_REVIEW_FOCUS_PARAM) !== "1") return;

    hasFocusedRef.current = true;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    headingRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "center",
    });
    headingRef.current?.focus({ preventScroll: true });
  }, [isActionable]);

  const handleSaved = (saved: ProgramReview) => {
    mutate({ canReview: false, reason: "AlreadyReviewed", review: saved });
    setIsEditing(false);
    onChanged();
  };

  const handleDelete = async () => {
    if (!review) return;
    try {
      await deleteProgramReview(programId, review.id);
      showAppSuccess({
        title: "Đã xóa đánh giá",
        description: "Bạn có thể viết đánh giá mới bất cứ lúc nào.",
      });
      setIsEditing(false);
      refresh();
      onChanged();
    } catch (error) {
      showAppErrorFromUnknown(error, "programs.reviews.deleteOwn");
    }
  };

  if (isLoading && !data) {
    return (
      <div className="mt-4 rounded-xl border border-[#E5E5E0] bg-[#FAFAF5] p-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-3 h-9 w-56" />
      </div>
    );
  }

  if (!data) return null;

  if (data.reason === "NotCompleted") {
    return (
      <p className="mt-4 rounded-xl border border-dashed border-[#E5E5E0] bg-[#FAFAF5] px-4 py-3 text-sm text-[#6B6B6B]">
        Hoàn thành chương trình để chia sẻ đánh giá của bạn.
      </p>
    );
  }

  if (data.reason === "RemovedByModerator") {
    return (
      <p className="mt-4 rounded-xl border border-dashed border-[#E5E5E0] bg-[#FAFAF5] px-4 py-3 text-sm text-[#6B6B6B]">
        Đánh giá trước của bạn đã bị quản lý gỡ bỏ. Liên hệ hỗ trợ nếu bạn cần
        giải thích thêm.
      </p>
    );
  }

  if (!isActionable) return null;

  const showForm = canReview || isEditing;

  return (
    <div className="mt-4 rounded-xl border border-[#E5E5E0] bg-[#FAFAF5] p-4 sm:p-5">
      <h3
        ref={headingRef}
        tabIndex={-1}
        className="font-heading text-base font-semibold text-[#2D2D2D] outline-none"
      >
        {review ? "Đánh giá của bạn" : "Bạn đã hoàn thành chương trình này"}
      </h3>
      {!review ? (
        <p className="mt-1 text-sm text-[#6B6B6B]">
          Chia sẻ cảm nhận để giúp các bạn học viên khác chọn chương trình phù hợp.
        </p>
      ) : null}

      {showForm ? (
        <ProgramReviewForm
          key={review?.id ?? "new"}
          className="mt-4"
          programId={programId}
          review={isEditing ? review : null}
          onSaved={handleSaved}
          onCancel={isEditing ? () => setIsEditing(false) : undefined}
        />
      ) : review ? (
        <ProgramReviewCard
          className="mt-3"
          review={review}
          heading="Bạn"
          actions={
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 rounded-lg text-[#6B6B6B] hover:bg-[#4FC3F7]/10 hover:text-[#0277BD]"
                aria-label="Sửa đánh giá của bạn"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="size-4" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 rounded-lg text-[#6B6B6B] hover:bg-[#E94B3C]/10 hover:text-[#E94B3C]"
                aria-label="Xóa đánh giá của bạn"
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </>
          }
        />
      ) : null}

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title="Xóa đánh giá của bạn?"
        description="Đánh giá sẽ bị gỡ khỏi trang chương trình. Bạn có thể viết đánh giá mới sau."
        confirmLabel="Xóa đánh giá"
        variant="destructive"
      />
    </div>
  );
}
