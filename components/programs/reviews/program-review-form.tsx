"use client";

import { useId } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createProgramReview,
  updateProgramReview,
  type ProgramReview,
} from "@/lib/api/programs";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import {
  PROGRAM_REVIEW_COMMENT_MAX,
  programReviewFormSchema,
  type ProgramReviewFormValues,
} from "@/lib/validations/program-reviews";
import { cn } from "@/lib/utils";

import { StarRatingInput } from "./star-rating-input";

type ProgramReviewFormProps = {
  programId: string;
  /** Present → edit mode (PUT); absent → create (POST). */
  review?: ProgramReview | null;
  onSaved: (review: ProgramReview) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  className?: string;
};

export function ProgramReviewForm({
  programId,
  review,
  onSaved,
  onCancel,
  autoFocus = false,
  className,
}: ProgramReviewFormProps) {
  const isEdit = review != null;
  const ratingLabelId = useId();
  const ratingErrorId = useId();
  const commentId = useId();
  const commentHintId = useId();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProgramReviewFormValues>({
    resolver: zodResolver(programReviewFormSchema),
    defaultValues: {
      starRating: review?.starRating ?? 0,
      comment: review?.comment ?? "",
    },
  });

  const commentLength = useWatch({ control, name: "comment" })?.length ?? 0;

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = isEdit
        ? await updateProgramReview(programId, review.id, values)
        : await createProgramReview(programId, values);
      const saved = result?.data;
      if (!saved) throw new Error("Review response missing data.");

      showAppSuccess({
        title: isEdit ? "Đã cập nhật đánh giá" : "Cảm ơn bạn đã đánh giá!",
        description: isEdit
          ? "Đánh giá mới của bạn đã được lưu."
          : "Cảm nhận của bạn giúp các bạn học viên khác chọn chương trình phù hợp.",
      });
      onSaved(saved);
    } catch (error) {
      showAppErrorFromUnknown(
        error,
        isEdit ? "programs.reviews.update" : "programs.reviews.create",
      );
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className={cn("space-y-5", className)}>
      <div className="space-y-2">
        <p id={ratingLabelId} className="text-sm font-medium text-[#2D2D2D]">
          Bạn chấm chương trình bao nhiêu sao?
        </p>
        <Controller
          control={control}
          name="starRating"
          render={({ field }) => (
            <StarRatingInput
              value={field.value}
              onChange={field.onChange}
              disabled={isSubmitting}
              isInvalid={Boolean(errors.starRating)}
              aria-labelledby={ratingLabelId}
              aria-describedby={errors.starRating ? ratingErrorId : undefined}
            />
          )}
        />
        {errors.starRating ? (
          <p id={ratingErrorId} role="alert" className="text-sm text-[#E94B3C]">
            {errors.starRating.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={commentId} className="text-sm font-medium text-[#2D2D2D]">
          Nhận xét <span className="font-normal text-[#6B6B6B]">(không bắt buộc)</span>
        </Label>
        <Textarea
          id={commentId}
          rows={4}
          autoFocus={autoFocus}
          maxLength={PROGRAM_REVIEW_COMMENT_MAX}
          placeholder="Điều bạn thích nhất, điều có thể tốt hơn…"
          aria-invalid={Boolean(errors.comment) || undefined}
          aria-describedby={commentHintId}
          disabled={isSubmitting}
          className="min-h-28 resize-y bg-white text-sm leading-relaxed"
          {...register("comment")}
        />
        <div
          id={commentHintId}
          className="flex items-start justify-between gap-3 text-xs"
        >
          {errors.comment ? (
            <p role="alert" className="text-[#E94B3C]">
              {errors.comment.message}
            </p>
          ) : (
            <p className="text-[#6B6B6B]">Chỉ văn bản thuần, không chứa HTML.</p>
          )}
          <span className="shrink-0 tabular-nums text-[#6B6B6B]">
            {commentLength}/{PROGRAM_REVIEW_COMMENT_MAX}
          </span>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 px-6"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            Hủy
          </Button>
        ) : null}
        <Button
          type="submit"
          className="h-11 px-6 font-semibold"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {isSubmitting
            ? "Đang lưu…"
            : isEdit
              ? "Lưu thay đổi"
              : "Gửi đánh giá"}
        </Button>
      </div>
    </form>
  );
}
