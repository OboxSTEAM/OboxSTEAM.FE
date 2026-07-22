"use client";

import { cn } from "@/lib/utils";

type MindMapSkeletonProps = {
  className?: string;
};

export function MindMapSkeleton({ className }: MindMapSkeletonProps) {
  return (
    <div
      className={cn(
        "relative h-full min-h-[24rem] overflow-hidden bg-[#FAFAF5]",
        className,
      )}
      aria-busy
      aria-label="Đang tải bản đồ học tập"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(45,43,39,0.1) 1px, transparent 1.15px)",
          backgroundSize: "18px 18px",
        }}
        aria-hidden
      />

      {/* Hub */}
      <div className="absolute top-1/2 left-1/2 size-24 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border-2 border-dotted border-[#2D2D2D]/30 bg-white shadow-[0_0_0_8px_rgba(45,45,45,0.04)]" />

      {/* Right branch modules + leaves */}
      <div className="absolute top-[34%] left-[58%] h-14 w-36 animate-pulse rounded-2xl bg-white" />
      <div className="absolute top-[32%] left-[76%] h-8 w-28 animate-pulse rounded-lg bg-[#EFEBE3]" />
      <div className="absolute top-[40%] left-[76%] h-8 w-28 animate-pulse rounded-lg bg-[#EFEBE3]" />

      <div className="absolute top-[58%] left-[58%] h-14 w-36 animate-pulse rounded-2xl bg-white" />
      <div className="absolute top-[58%] left-[76%] h-8 w-28 animate-pulse rounded-lg bg-[#EFEBE3]" />

      {/* Left branch */}
      <div className="absolute top-[38%] right-[58%] left-auto h-14 w-36 animate-pulse rounded-2xl bg-white max-md:hidden" />
      <div className="absolute top-[36%] right-[76%] left-auto h-8 w-28 animate-pulse rounded-lg bg-[#EFEBE3] max-md:hidden" />
      <div className="absolute top-[44%] right-[76%] left-auto h-8 w-28 animate-pulse rounded-lg bg-[#EFEBE3] max-md:hidden" />
    </div>
  );
}
