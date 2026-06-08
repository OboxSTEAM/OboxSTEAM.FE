"use client";

import { Loader2 } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Program } from "@/lib/api/programs";
import { chunkProgramsForRhythm } from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

import { ProgramCard } from "./program-card";

type ProgramGridProps = {
  programs: Program[];
  isInitialLoading: boolean;
  isRefetching: boolean;
  onClearFilters: () => void;
};

function ProgramCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-white/8 bg-[#252525]">
      <Skeleton className="aspect-video w-full rounded-none bg-white/8" />
      <div className="flex flex-col gap-2 p-3.5">
        <Skeleton className="h-2.5 w-16 bg-white/8" />
        <Skeleton className="h-4 w-full bg-white/8" />
        <Skeleton className="h-4 w-4/5 bg-white/8" />
        <Skeleton className="h-3 w-2/3 bg-white/8" />
        <Skeleton className="h-3 w-1/2 bg-white/8" />
      </div>
    </div>
  );
}

function LoadingGrid() {
  const rows = chunkProgramsForRhythm(
    Array.from({ length: 5 }, (_, index) => index),
  );

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row, rowIndex) => (
        <div
          key={`skeleton-row-${rowIndex}`}
          className={cn(
            "grid gap-4",
            row.length === 2
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          )}
        >
          {row.map((item) => (
            <ProgramCardSkeleton key={`skeleton-${item}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/8 bg-[#252525]/60 px-6 py-16 text-center">
      <p className="font-heading text-lg font-semibold text-white">
        Không tìm thấy chương trình nào
      </p>
      <p className="max-w-md text-sm text-white/45 leading-relaxed">
        Thử đổi từ khóa tìm kiếm hoặc bỏ bớt bộ lọc để xem thêm chương trình STEAM.
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={onClearFilters}
        className="border-white/12 bg-white/8 text-white hover:bg-white/12 hover:text-white"
      >
        Xóa bộ lọc
      </Button>
    </div>
  );
}

export function ProgramGrid({
  programs,
  isInitialLoading,
  isRefetching,
  onClearFilters,
}: ProgramGridProps) {
  if (isInitialLoading) {
    return <LoadingGrid />;
  }

  if (programs.length === 0 && !isRefetching) {
    return <EmptyState onClearFilters={onClearFilters} />;
  }

  const rows = chunkProgramsForRhythm(programs);
  const rowStartIndexes = rows.map((_, rowIndex) =>
    rows.slice(0, rowIndex).reduce((total, row) => total + row.length, 0),
  );

  return (
    <div className="relative">
      {isRefetching && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-2"
          aria-live="polite"
          aria-busy="true"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#252525]/90 px-3 py-1.5 text-xs text-white/70 backdrop-blur-sm">
            <Loader2 size={13} className="animate-spin text-[#4FC3F7]" />
            Đang cập nhật...
          </span>
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-4 transition-opacity duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isRefetching ? "opacity-75" : "opacity-100",
        )}
      >
        {rows.map((row, rowIndex) => (
          <div
            key={`program-row-${rowIndex}`}
            className={cn(
              "grid gap-4",
              row.length === 2
                ? "grid-cols-1 sm:grid-cols-2"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
            )}
          >
            {row.map((program, itemIndex) => {
              const card = <ProgramCard program={program} />;

              if (isRefetching) {
                return <div key={program.id}>{card}</div>;
              }

              return (
                <AnimatedContent
                  key={program.id}
                  distance={32}
                  duration={0.55}
                  delay={(rowStartIndexes[rowIndex] + itemIndex) * 0.06}
                >
                  {card}
                </AnimatedContent>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
