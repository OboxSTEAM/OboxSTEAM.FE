"use client";

import { useCallback, useMemo, useState } from "react";

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
import { showAppErrorFromUnknown } from "@/lib/errors";
import {
  getProgramReviews,
  type Paginated,
  type ProgramReview,
  type ProgramReviewsQuery,
} from "@/lib/api/programs";
import {
  DEFAULT_PROGRAM_REVIEWS_QUERY,
  getReviewSortOptionId,
  PROGRAM_REVIEW_SORT_OPTIONS,
} from "@/lib/programs/constants";

import { ProgramReviewCard } from "./program-review-card";
import { StarRating } from "./star-rating";

type ProgramReviewsSectionProps = {
  programId: string;
  programRating: number | null;
  totalReviews: number;
  initialData: Paginated<ProgramReview>;
};

function getReviewSortLabel(sortId: string): string {
  return (
    PROGRAM_REVIEW_SORT_OPTIONS.find((option) => option.id === sortId)?.label ??
    "Sắp xếp"
  );
}

function ReviewSkeleton() {
  return (
    <div className="flex gap-3 py-4">
      <Skeleton className="size-6 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

function ReviewSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="divide-y divide-[#E5E5E0]">
      {Array.from({ length: count }, (_, index) => (
        <ReviewSkeleton key={index} />
      ))}
    </div>
  );
}

export function ProgramReviewsSection({
  programId,
  programRating,
  totalReviews,
  initialData,
}: ProgramReviewsSectionProps) {
  const [query, setQuery] = useState<ProgramReviewsQuery>(
    DEFAULT_PROGRAM_REVIEWS_QUERY,
  );

  const isInitialQuery = useMemo(
    () =>
      query.page === DEFAULT_PROGRAM_REVIEWS_QUERY.page &&
      query.pageSize === DEFAULT_PROGRAM_REVIEWS_QUERY.pageSize &&
      query.sortBy === DEFAULT_PROGRAM_REVIEWS_QUERY.sortBy &&
      query.isDescending === DEFAULT_PROGRAM_REVIEWS_QUERY.isDescending,
    [query],
  );

  const { data, isLoading, hasError, markLoading, retry } = useClientFetch({
    enabled: !isInitialQuery,
    initialData,
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
      setQuery((current) => ({
        ...current,
        page,
      }));
    },
    [markLoading],
  );

  const sortId = getReviewSortOptionId(query);
  const reviews = data?.items ?? [];

  return (
    <div className="space-y-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5E0] pb-4">
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
        <ReviewSkeletonList />
      ) : reviews.length === 0 ? (
        <p className="py-10 text-center text-sm text-[#6B6B6B]">
          Chưa có đánh giá nào — hãy là người đầu tiên sau khi hoàn thành
          chương trình.
        </p>
      ) : (
        <div className="divide-y divide-[#E5E5E0]">
          {reviews.map((review) => (
            <ProgramReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {data && !hasError && !isLoading && (
        <ProgramPagination
          currentPage={data.currentPage}
          totalPages={data.totalPages}
          hasPrevious={data.hasPrevious}
          hasNext={data.hasNext}
          onPageChange={handlePageChange}
          theme="light"
          className="border-t border-[#E5E5E0] pt-2"
        />
      )}
    </div>
  );
}
