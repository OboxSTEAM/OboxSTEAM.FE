"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ProgramPagination } from "@/components/programs/program-pagination";
import { ProgramMyReviewPanel } from "@/components/programs/reviews/program-my-review-panel";
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
  getReviewSortOptionId,
  PROGRAM_REVIEW_SORT_OPTIONS,
  PUBLIC_PROGRAM_REVIEWS_QUERY,
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

function ReviewSkeletonList({
  count = PUBLIC_PROGRAM_REVIEWS_QUERY.pageSize ?? 4,
}: {
  count?: number;
}) {
  return (
    <ul className="divide-y divide-[#EFEFEA]" aria-hidden>
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

export function ProgramReviewsSection({
  programId,
  programRating,
  totalReviews,
  initialData,
}: ProgramReviewsSectionProps) {
  const router = useRouter();
  const [query, setQuery] = useState<ProgramReviewsQuery>(
    PUBLIC_PROGRAM_REVIEWS_QUERY,
  );
  /** Bumped after the student's own review changes — the server-seeded page is stale then. */
  const [refreshKey, setRefreshKey] = useState(0);

  const isInitialQuery = useMemo(
    () =>
      query.page === PUBLIC_PROGRAM_REVIEWS_QUERY.page &&
      query.pageSize === PUBLIC_PROGRAM_REVIEWS_QUERY.pageSize &&
      query.sortBy === PUBLIC_PROGRAM_REVIEWS_QUERY.sortBy &&
      query.isDescending === PUBLIC_PROGRAM_REVIEWS_QUERY.isDescending,
    [query],
  );

  const { data, isLoading, hasError, markLoading, retry } = useClientFetch({
    enabled: !isInitialQuery || refreshKey > 0,
    initialData,
    fetcher: async () => {
      const result = await getProgramReviews(programId, query);
      return result?.data ?? null;
    },
    deps: [programId, query, refreshKey],
    onError: (error) => showAppErrorFromUnknown(error, "programs.reviews"),
  });

  const handleOwnReviewChanged = useCallback(() => {
    markLoading();
    setRefreshKey((key) => key + 1);
    router.refresh();
  }, [markLoading, router]);

  const handleSortChange = useCallback(
    (sortId: string | null) => {
      if (!sortId) return;

      const option = PROGRAM_REVIEW_SORT_OPTIONS.find(
        (item) => item.id === sortId,
      );
      if (!option) return;

      markLoading();
      setQuery({
        ...PUBLIC_PROGRAM_REVIEWS_QUERY,
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
    <div className="rounded-xl border border-[#E5E5E0] bg-white px-5 py-5 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold text-[#2D2D2D]">
            Học viên nói gì về chương trình
          </h2>
          <div className="mt-2 flex items-center gap-3">
            {programRating != null ? (
              <span className="font-heading text-3xl font-bold leading-none text-[#2D2D2D] tabular-nums">
                {programRating.toFixed(1)}
              </span>
            ) : null}
            <div className="flex flex-col gap-1">
              {programRating != null ? (
                <StarRating rating={programRating} size={18} />
              ) : null}
              <span className="text-xs text-[#6B6B6B]">
                {totalReviews > 0
                  ? `${totalReviews.toLocaleString("vi-VN")} đánh giá`
                  : "Chưa có đánh giá"}
              </span>
            </div>
          </div>
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

      <ProgramMyReviewPanel
        programId={programId}
        onChanged={handleOwnReviewChanged}
      />

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
        <div className="mt-4 border-t border-[#EFEFEA]">
          <ReviewSkeletonList />
        </div>
      ) : reviews.length === 0 ? (
        <p className="mt-4 border-t border-[#EFEFEA] pt-6 text-center text-sm text-[#6B6B6B]">
          Chưa có đánh giá nào — hãy là người đầu tiên sau khi hoàn thành
          chương trình.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-[#EFEFEA] border-t border-[#EFEFEA]">
          {reviews.map((review) => (
            <li key={review.id} className="py-4 last:pb-0">
              <ProgramReviewCard review={review} />
            </li>
          ))}
        </ul>
      )}

      {data && !hasError && !isLoading && (
        <ProgramPagination
          currentPage={data.currentPage}
          totalPages={data.totalPages}
          hasPrevious={data.hasPrevious}
          hasNext={data.hasNext}
          onPageChange={handlePageChange}
          theme="light"
          className="mt-4 border-t border-[#EFEFEA] pt-2"
        />
      )}
    </div>
  );
}
