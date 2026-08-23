import { forwardRef } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

export type HeroPhotoPrintProps = {
  src: string;
  alt: string;
  /** Intrinsic image width (next/image). */
  width: number;
  /** Intrinsic image height (next/image). */
  height: number;
  /** Absolute placement on the hero (top/left/right/bottom + visibility). */
  className?: string;
  /** Print frame size (w-* / aspect-*). */
  frameClassName?: string;
  rotate?: number;
  priority?: boolean;
  zIndex?: number;
};

/**
 * Physical photo print — cream matte, soft desk shadow, slight tilt.
 * Position via `className`; size via `frameClassName`.
 * Forwarded ref is the motion target (slide-out on scroll).
 */
export const HeroPhotoPrint = forwardRef<HTMLDivElement, HeroPhotoPrintProps>(
  function HeroPhotoPrint(
    {
      src,
      alt: _alt,
      width,
      height,
      className,
      frameClassName,
      rotate = 0,
      priority = false,
      zIndex = 10,
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn("absolute pointer-events-none will-change-transform", className)}
        style={{ zIndex }}
        aria-hidden="true"
      >
        <div
          className={cn(
            "relative overflow-hidden bg-[#FAFAF5] p-[0.45rem] pb-[1.15rem]",
            "shadow-[0_14px_36px_rgba(0,0,0,0.42),0_2px_6px_rgba(0,0,0,0.28)]",
            "ring-1 ring-black/10",
            frameClassName,
          )}
          style={{ rotate: `${rotate}deg` }}
        >
          <div className="relative h-full w-full overflow-hidden bg-[#1A1410]/20">
            <Image
              src={src}
              alt=""
              width={width}
              height={height}
              priority={priority}
              sizes="(max-width: 768px) 40vw, 22vw"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    );
  },
);
