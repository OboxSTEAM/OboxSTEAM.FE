"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Program } from "@/lib/api/programs";
import { chunkProgramsForRhythm } from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

import { ProgramCard } from "./program-card";

type ProgramGridProps = {
  programs: Program[];
  isLoading: boolean;
  resultsEpoch: number;
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
    <div
      className="flex flex-col gap-4 motion-safe:animate-[programGridIn_220ms_cubic-bezier(0.16,1,0.3,1)_forwards] opacity-0"
      aria-busy="true"
      aria-live="polite"
    >
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
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/8 bg-[#252525]/60 px-6 py-16 text-center motion-safe:animate-[programGridIn_320ms_cubic-bezier(0.16,1,0.3,1)_forwards] opacity-0">
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
  isLoading,
  resultsEpoch,
  onClearFilters,
}: ProgramGridProps) {
  if (isLoading) {
    return <LoadingGrid />;
  }

  if (programs.length === 0) {
    return <EmptyState onClearFilters={onClearFilters} />;
  }

  const rows = chunkProgramsForRhythm(programs);

  return (
    <div
      key={resultsEpoch}
      className="flex flex-col gap-4 motion-safe:animate-[programGridIn_320ms_cubic-bezier(0.16,1,0.3,1)_forwards] opacity-0"
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
          {row.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      ))}
    </div>
  );
}
