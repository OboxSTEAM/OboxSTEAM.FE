import type { ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ProgramReview } from "@/lib/api/programs";
import {
  formatReviewDate,
  getExpertInitials,
  isReviewEdited,
} from "@/lib/programs/format";
import { cn } from "@/lib/utils";

import { StarRating } from "./star-rating";

type ProgramReviewCardTone = "light" | "adaptive";

type ProgramReviewCardProps = {
  review: ProgramReview;
  className?: string;
  /** Owner actions (edit/delete) rendered at the top-right. */
  actions?: ReactNode;
  /** Replaces the student name, e.g. "Bạn". */
  heading?: string;
  /** `adaptive` follows the app theme; `light` is for always-light surfaces. */
  tone?: ProgramReviewCardTone;
};

const TONE_CLASS: Record<
  ProgramReviewCardTone,
  { avatar: string; name: string; meta: string; comment: string }
> = {
  light: {
    avatar: "bg-[#F5F5F0] text-[#6B6B6B]",
    name: "text-[#2D2D2D]",
    meta: "text-[#6B6B6B]",
    comment: "text-[#4A4A4A]",
  },
  adaptive: {
    avatar: "bg-muted text-muted-foreground",
    name: "text-foreground",
    meta: "text-muted-foreground",
    comment: "text-foreground/80",
  },
};

/** Flat review row — the parent list owns borders/dividers. */
export function ProgramReviewCard({
  review,
  className,
  actions,
  heading,
  tone = "light",
}: ProgramReviewCardProps) {
  const displayName = review.studentName || "Học viên";
  const toneClass = TONE_CLASS[tone];

  return (
    <article className={cn("flex gap-3", className)}>
      <Avatar size="lg" className="shrink-0">
        {review.studentAvatarUrl ? (
          <AvatarImage src={review.studentAvatarUrl} alt="" />
        ) : null}
        <AvatarFallback className={cn("text-sm font-semibold", toneClass.avatar)}>
          {getExpertInitials(displayName)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={cn("truncate text-sm font-semibold", toneClass.name)}>
              {heading ?? displayName}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <StarRating rating={review.starRating} size={15} tone={tone} />
              <time
                dateTime={review.createdAt}
                className={cn("text-xs tabular-nums", toneClass.meta)}
              >
                {formatReviewDate(review.createdAt)}
                {isReviewEdited(review) ? " · đã chỉnh sửa" : null}
              </time>
            </div>
          </div>
          {actions ? <div className="-mr-2 -mt-1 flex shrink-0">{actions}</div> : null}
        </div>

        {review.comment ? (
          <p
            className={cn(
              "mt-2 whitespace-pre-line text-sm leading-relaxed",
              toneClass.comment,
            )}
          >
            {review.comment}
          </p>
        ) : null}
      </div>
    </article>
  );
}
