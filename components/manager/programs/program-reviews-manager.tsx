"use client";

import { useCallback, useMemo, useState } from "react";
import { Star, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ProgramReviewCard } from "@/components/programs/detail/program-review-card";
import { StarRating } from "@/components/programs/detail/star-rating";
import { ProgramPagination } from "@/components/programs/program-pagination";
import {
  LIGHT_SELECT_CONTENT,
  LIGHT_SELECT_ITEM,
  LIGHT_SELECT_TRIGGER,
} from "@/components/programs/program-select-styles";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  deleteProgramReview,
  getProgramReviews,
  type ProgramReview,
  type ProgramReviewsQuery,
} from "@/lib/api/programs";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import {
  DEFAULT_PROGRAM_REVIEWS_QUERY,
  getReviewSortOptionId,
  PROGRAM_REVIEW_SORT_OPTIONS,
} from "@/lib/programs/constants";
type ProgramReviewsManagerProps = {
  programId: string;
  programName: string;
  programRating: number | null;
  totalReviews: number;
};

function getReviewSortLabel(sortId: string): string {
  return (
    PROGRAM_REVIEW_SORT_OPTIONS.find((option) => option.id === sortId)?.label ??
    "Sắp xếp"
  );
}

function ReviewSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <ul className="divide-y divide-border" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="flex gap-3 py-4">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3.5 w-44" />
            <Skeleton className="h-3.5 w-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}

type DeleteReviewButtonProps = {
  review: ProgramReview;
  onDelete: (review: ProgramReview) => void;
};

function DeleteReviewButton({ review, onDelete }: DeleteReviewButtonProps) {
  const displayName = review.studentName || "Học viên";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => onDelete(review)}
      aria-label={`Xóa đánh giá của ${displayName}`}
      className="size-8 shrink-0 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
    >
      <Trash2 className="size-4" aria-hidden />
    </Button>
  );
}

export function ProgramReviewsManager({
  programId,
  programName,
  programRating,
  totalReviews,
}: ProgramReviewsManagerProps) {
  const [query, setQuery] = useState<ProgramReviewsQuery>(
    DEFAULT_PROGRAM_REVIEWS_QUERY,
  );
  const [deleteTarget, setDeleteTarget] = useState<ProgramReview | null>(null);

  const { data, isLoading, hasError, markLoading, retry } = useClientFetch({
    fetcher: async () => {
      const result = await getProgramReviews(programId, query);
      return result?.data ?? null;
    },
    deps: [programId, query],
    onError: (error) => showAppErrorFromUnknown(error, "programs.reviews"),
  });

  const handleSortChange = useCallback(
    (sortId: string | null) => {
      if (!sortId) return;
      const option = PROGRAM_REVIEW_SORT_OPTIONS.find(
        (item) => item.id === sortId,
      );
      if (!option) return;

      markLoading();
      setQuery({
        ...DEFAULT_PROGRAM_REVIEWS_QUERY,
        sortBy: option.sortBy,
        isDescending: option.isDescending,
      });
    },
    [markLoading],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      markLoading();
      setQuery((current) => ({ ...current, page }));
    },
    [markLoading],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteProgramReview(programId, deleteTarget.id);
      showAppSuccess({
        title: "Đã xóa đánh giá",
        description: `Đánh giá của ${deleteTarget.studentName} đã được xóa.`,
      });
      setDeleteTarget(null);
      retry();
    } catch (error) {
      showAppErrorFromUnknown(error, "programs.reviews.delete");
    }
  }, [deleteTarget, programId, retry]);

  const sortId = useMemo(() => getReviewSortOptionId(query), [query]);
  const reviews = data?.items ?? [];

  return (
    <div className="space-y-0 rounded-xl border border-border bg-card p-6 shadow-[0_4px_20px_rgba(45,45,45,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Đánh giá từ học viên
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Xem ai đã đánh giá {programName}. Bạn có thể xóa đánh giá vi phạm,
            không thể chỉnh sửa nội dung.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {programRating != null ? (
            <>
              <span className="font-heading text-xl font-bold text-foreground tabular-nums">
                {programRating.toFixed(1)}
              </span>
              <StarRating rating={programRating} size={14} tone="adaptive" />
            </>
          ) : null}
          <span className="text-sm text-muted-foreground">
            {totalReviews.toLocaleString("vi-VN")} đánh giá
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end border-b border-border pb-4">
        <Select value={sortId} onValueChange={handleSortChange}>
          <SelectTrigger className={LIGHT_SELECT_TRIGGER} size="default">
            <span className="truncate">{getReviewSortLabel(sortId)}</span>
          </SelectTrigger>
          <SelectContent
            className={LIGHT_SELECT_CONTENT}
            alignItemWithTrigger={false}
            sideOffset={8}
            align="end"
          >
            {PROGRAM_REVIEW_SORT_OPTIONS.map((option) => (
              <SelectItem
                key={option.id}
                value={option.id}
                className={LIGHT_SELECT_ITEM}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasError ? (
        <div className="py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Không tải được đánh giá. Vui lòng thử lại.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={retry}
          >
            Thử lại
          </Button>
        </div>
      ) : isLoading ? (
        <ReviewSkeletonList />
      ) : reviews.length === 0 ? (
        <div className="pt-6">
          <ManagerEmptyState
            title="Chưa có đánh giá nào"
            description={`Chương trình ${programName} chưa nhận được đánh giá từ học viên.`}
            icon={Star}
          />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {reviews.map((review) => (
            <li key={review.id} className="py-4 last:pb-0">
              <ProgramReviewCard
                review={review}
                tone="adaptive"
                actions={
                  <DeleteReviewButton
                    review={review}
                    onDelete={setDeleteTarget}
                  />
                }
              />
            </li>
          ))}
        </ul>
      )}

      {data && !hasError && !isLoading ? (
        <ProgramPagination
          currentPage={data.currentPage}
          totalPages={data.totalPages}
          hasPrevious={data.hasPrevious}
          hasNext={data.hasNext}
          onPageChange={handlePageChange}
          theme="light"
          className="border-t border-border pt-2"
        />
      ) : null}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Xóa đánh giá này?"
        description={`Bạn có chắc muốn xóa đánh giá của ${deleteTarget?.studentName ?? "học viên"}? Hành động này không thể hoàn tác.`}
        confirmLabel="Đồng ý xóa"
        variant="destructive"
      />
    </div>
  );
}
