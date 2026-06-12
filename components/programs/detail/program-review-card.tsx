import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ProgramReview } from "@/lib/api/programs";
import { cn } from "@/lib/utils";

import { StarRating } from "./star-rating";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatReviewDate(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

type ProgramReviewCardProps = {
  review: ProgramReview;
  className?: string;
};

export function ProgramReviewCard({ review, className }: ProgramReviewCardProps) {
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-xl border border-[#E5E5E0] bg-white p-4 shadow-[0_2px_12px_rgba(45,45,45,0.04)]",
        className,
      )}
    >
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
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-sm font-semibold text-[#2D2D2D]">
              {review.studentName}
            </p>
            <time
              dateTime={review.createdAt}
              className="text-xs text-[#6B6B6B] tabular-nums"
            >
              {formatReviewDate(review.createdAt)}
            </time>
          </div>

          <div className="mt-1">
            <StarRating rating={review.starRating} size={12} />
          </div>
        </div>
      </div>

      {review.comment ? (
        <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-[#6B6B6B]">
          <span className="font-serif text-lg leading-none text-[#E5E5E0]" aria-hidden>
            &ldquo;
          </span>
          {review.comment}
        </blockquote>
      ) : null}
    </article>
  );
}
