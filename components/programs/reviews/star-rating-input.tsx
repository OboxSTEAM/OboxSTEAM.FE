"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

const STAR_LABELS = ["Chưa tốt", "Tạm được", "Ổn", "Tốt", "Tuyệt vời"] as const;

type StarRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  disabled?: boolean;
  isInvalid?: boolean;
  id?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
};

/** Radio-group star picker — arrow keys move and select, like native radios. */
export function StarRatingInput({
  value,
  onChange,
  max = 5,
  disabled = false,
  isInvalid = false,
  id,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: StarRatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const displayValue = hovered ?? value;
  const focusableValue = value >= 1 ? value : 1;

  const selectAndFocus = (next: number) => {
    const clamped = Math.min(max, Math.max(1, next));
    onChange(clamped);
    buttonRefs.current[clamped - 1]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, star: number) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        event.preventDefault();
        selectAndFocus(star + 1);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        event.preventDefault();
        selectAndFocus(star - 1);
        break;
      case "Home":
        event.preventDefault();
        selectAndFocus(1);
        break;
      case "End":
        event.preventDefault();
        selectAndFocus(max);
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        id={id}
        role="radiogroup"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-invalid={isInvalid || undefined}
        className="inline-flex items-center"
        onMouseLeave={() => setHovered(null)}
      >
        {Array.from({ length: max }, (_, index) => {
          const star = index + 1;
          const isFilled = star <= displayValue;
          const isChecked = star === value;

          return (
            <button
              key={star}
              ref={(node) => {
                buttonRefs.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={isChecked}
              aria-label={`${star} sao · ${STAR_LABELS[index] ?? ""}`}
              tabIndex={star === focusableValue ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(star)}
              onKeyDown={(event) => handleKeyDown(event, star)}
              onMouseEnter={() => setHovered(star)}
              className={cn(
                "inline-flex size-11 items-center justify-center rounded-lg outline-none transition-transform duration-150",
                "focus-visible:ring-2 focus-visible:ring-[#4FC3F7] motion-safe:hover:scale-110",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <Star
                className={cn(
                  "size-7 transition-colors duration-150",
                  isFilled
                    ? "fill-[#FDD835] text-[#FDD835]"
                    : isInvalid
                      ? "fill-transparent text-[#E94B3C]/50"
                      : "fill-transparent text-[#D6D6CF]",
                )}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
      <span className="min-w-[5.5rem] text-sm font-medium text-[#6B6B6B]" aria-hidden>
        {displayValue >= 1 ? STAR_LABELS[displayValue - 1] : "Chọn số sao"}
      </span>
    </div>
  );
}
