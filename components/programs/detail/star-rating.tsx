import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

type StarRatingProps = {
  rating: number;
  max?: number;
  size?: number;
  className?: string;
};

/** Read-only stars with fractional fill (e.g. 4.2 → four full + a 20% star). */
export function StarRating({
  rating,
  max = 5,
  size = 14,
  className,
}: StarRatingProps) {
  const clamped = Math.max(0, Math.min(max, rating));
  const label = Number.isInteger(clamped) ? clamped : clamped.toFixed(1);

  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${label} trên ${max} sao`}
    >
      {Array.from({ length: max }, (_, index) => {
        const fill = Math.round(Math.max(0, Math.min(1, clamped - index)) * 10) / 10;
        return (
          <span
            key={index}
            className="relative inline-flex shrink-0"
            style={{ width: size, height: size }}
            aria-hidden="true"
          >
            <Star
              size={size}
              strokeWidth={1.5}
              className="absolute inset-0 fill-[#EDEDE8] text-[#DADAD3]"
            />
            {fill > 0 ? (
              <span
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star
                  size={size}
                  strokeWidth={1.5}
                  className="max-w-none fill-[#FDD835] text-[#F2B600]"
                />
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}
