"use client";

import { forwardRef, useState } from "react";
import Image from "next/image";

import {
  LANDING_IMAGE_BLUR_DATA_URL,
  LANDING_IMAGE_QUALITY,
} from "@/lib/landing/assets";
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
  /** Fade/drop the frame onto the desk once its image has loaded (hero only). */
  settleOnLoad?: boolean;
  /** Stagger order for `settleOnLoad` (60ms steps, capped at 360ms). */
  settleIndex?: number;
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
      settleOnLoad = false,
      settleIndex = 0,
    },
    ref,
  ) {
    const [isSettled, setIsSettled] = useState(false);
    const markSettled = settleOnLoad ? () => setIsSettled(true) : undefined;

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
            settleOnLoad && "print-settle",
            frameClassName,
          )}
          data-settled={settleOnLoad ? isSettled : undefined}
          style={{
            rotate: `${rotate}deg`,
            ...(settleOnLoad
              ? ({
                  "--settle-delay": `${Math.min(settleIndex * 60, 360)}ms`,
                } as React.CSSProperties)
              : null),
          }}
        >
          <div className="relative h-full w-full overflow-hidden bg-[#1A1410]/20">
            <Image
              src={src}
              alt=""
              width={width}
              height={height}
              priority={priority}
              quality={LANDING_IMAGE_QUALITY}
              placeholder="blur"
              blurDataURL={LANDING_IMAGE_BLUR_DATA_URL}
              ref={(img) => {
                // Image may finish before hydration, so onLoad would never fire.
                if (settleOnLoad && img?.complete) setIsSettled(true);
              }}
              onLoad={markSettled}
              onError={markSettled}
              sizes="(max-width: 768px) 40vw, 22vw"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    );
  },
);

