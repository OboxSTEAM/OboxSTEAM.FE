import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

type StarRatingProps = {
  rating: number;
  max?: number;
  size?: number;
  className?: string;
};

export function StarRating({
  rating,
  max = 5,
  size = 14,
  className,
}: StarRatingProps) {
  const clamped = Math.max(0, Math.min(max, rating));

  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${clamped} trên ${max} sao`}
    >
      {Array.from({ length: max }, (_, index) => {
        const filled = index < Math.round(clamped);
        return (
          <Star
            key={index}
            size={size}
            className={cn(
              "shrink-0",
              filled
                ? "fill-[#FDD835] text-[#FDD835]"
                : "fill-transparent text-[#E5E5E0]",
            )}
            aria-hidden="true"
          />
        );
      })}
    </span>
  );
}
