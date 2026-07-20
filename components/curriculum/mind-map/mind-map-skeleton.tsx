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
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(45,45,45,0.12) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
        aria-hidden
      />
      <div className="absolute left-1/2 top-1/2 h-14 w-48 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-[#26A69A]/35" />
      <div className="absolute left-[20%] top-[28%] h-24 w-36 animate-pulse rounded-2xl bg-[#E5E5E0]/80" />
      <div className="absolute right-[18%] top-[26%] h-24 w-36 animate-pulse rounded-2xl bg-[#E5E5E0]/80" />
      <div className="absolute bottom-[26%] left-[28%] h-10 w-28 animate-pulse rounded-lg bg-[#E5E5E0]/70" />
      <div className="absolute bottom-[22%] right-[24%] h-10 w-28 animate-pulse rounded-lg bg-[#E5E5E0]/70" />
    </div>
  );
}
