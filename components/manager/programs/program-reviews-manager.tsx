"use client";

import { useCallback, useMemo, useState } from "react";
import { Star, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { StarRating } from "@/components/programs/detail/star-rating";
import { ProgramPagination } from "@/components/programs/program-pagination";
import {
  LIGHT_SELECT_CONTENT,
  LIGHT_SELECT_ITEM,
  LIGHT_SELECT_TRIGGER,
} from "@/components/programs/program-select-styles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatReviewDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getReviewSortLabel(sortId: string): string {
  return (
    PROGRAM_REVIEW_SORT_OPTIONS.find((option) => option.id === sortId)?.label ??
    "Sắp xếp"
  );
}

function ReviewCardSkeleton() {
  return (
    <div className="rounded-xl border border-[#E5E5E0] bg-white p-4">
      <div className="flex gap-3">
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    </div>
  );
}

function ReviewSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: count }, (_, index) => (
        <ReviewCardSkeleton key={index} />
      ))}
    </div>
  );
}

type ManagerReviewCardProps = {
  review: ProgramReview;
  onDelete: (review: ProgramReview) => void;
};

function ManagerReviewCard({ review, onDelete }: ManagerReviewCardProps) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-[#E5E5E0] bg-white p-4 shadow-[0_2px_12px_rgba(45,45,45,0.04)]">
      <div className="flex gap-3">
        <Avatar size="sm" className="mt-0.5 size-9 shrink-0">
          {review.studentAvatarUrl ? (
            <AvatarImage src={review.studentAvatarUrl} alt="" />
          ) : null}
          <AvatarFallback className="bg-[#F5F5F0] text-xs font-medium text-[#6B6B6B]">
            {getInitials(review.studentName)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#2D2D2D]">
                {review.studentName}
              </p>
              <time
                dateTime={review.createdAt}
                className="text-xs text-[#6B6B6B] tabular-nums"
              >
                {formatReviewDate(review.createdAt)}
              </time>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onDelete(review)}
              aria-label={`Xóa đánh giá của ${review.studentName}`}
              className="size-8 shrink-0 rounded-lg text-[#6B6B6B] hover:bg-[#E94B3C]/10 hover:text-[#E94B3C]"
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>

          <div className="mt-1">
            <StarRating rating={review.starRating} size={12} />
          </div>
        </div>
      </div>

      {review.comment ? (
        <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-[#6B6B6B]">
          <span
            className="font-serif text-lg leading-none text-[#E5E5E0]"
            aria-hidden
          >
            &ldquo;
          </span>
          {review.comment}
        </blockquote>
      ) : null}
    </article>
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
    <div className="space-y-0 rounded-xl border border-[#E5E5E0] bg-white p-6 shadow-[0_4px_20px_rgba(45,45,45,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-[#2D2D2D]">
            Đánh giá từ học viên
          </h2>
          <p className="mt-1 text-sm text-[#6B6B6B]">
            Xem ai đã đánh giá {programName}. Bạn có thể xóa đánh giá vi phạm,
            không thể chỉnh sửa nội dung.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {programRating != null ? (
            <>
              <span className="font-heading text-xl font-bold text-[#2D2D2D] tabular-nums">
                {programRating.toFixed(1)}
              </span>
              <StarRating rating={programRating} size={14} />
            </>
          ) : null}
          <span className="text-sm text-[#6B6B6B]">
            {totalReviews.toLocaleString("vi-VN")} đánh giá
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end border-b border-[#E5E5E0] pb-4">
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
          <p className="text-sm text-[#6B6B6B]">
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
        <div className="pt-4">
          <ReviewSkeletonList />
        </div>
      ) : reviews.length === 0 ? (
        <div className="pt-6">
          <ManagerEmptyState
            title="Chưa có đánh giá nào"
            description={`Chương trình ${programName} chưa nhận được đánh giá từ học viên.`}
            icon={Star}
          />
        </div>
      ) : (
        <div className="grid gap-4 pt-4 sm:grid-cols-2">
          {reviews.map((review) => (
            <ManagerReviewCard
              key={review.id}
              review={review}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {data && !hasError && !isLoading ? (
        <ProgramPagination
          currentPage={data.currentPage}
          totalPages={data.totalPages}
          hasPrevious={data.hasPrevious}
          hasNext={data.hasNext}
          onPageChange={handlePageChange}
          theme="light"
          className="border-t border-[#E5E5E0] pt-2"
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
