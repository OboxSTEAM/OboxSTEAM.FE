"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Program } from "@/lib/api/programs";
import { cn } from "@/lib/utils";

import { ProgramCard } from "./program-card";

const GRID_CLASS =
  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5";

type ProgramGridProps = {
  programs: Program[];
  isLoading: boolean;
  resultsEpoch: number;
  onClearFilters: () => void;
};

function ProgramCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/8 bg-[#252525]">
      <div className="p-3 pb-0">
        <Skeleton className="aspect-[16/9] w-full rounded-lg bg-white/8" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3 pt-2.5">
        <div className="flex items-center gap-2">
          <Skeleton className="size-6 shrink-0 rounded-full bg-white/8" />
          <Skeleton className="h-3 w-24 bg-white/8" />
        </div>
        <Skeleton className="h-4 w-full bg-white/8" />
        <Skeleton className="h-4 w-4/5 bg-white/8" />
        <Skeleton className="h-8 w-full bg-white/8" />
        <Skeleton className="h-3 w-2/3 bg-white/8" />
        <Skeleton className="h-3 w-full bg-white/8" />
      </div>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div
      className={cn(
        GRID_CLASS,
        "motion-safe:animate-[programGridIn_220ms_cubic-bezier(0.16,1,0.3,1)_forwards] opacity-0",
      )}
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: 8 }, (_, index) => (
        <ProgramCardSkeleton key={`skeleton-${index}`} />
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

  return (
    <div
      key={resultsEpoch}
      className={cn(
        GRID_CLASS,
        "motion-safe:animate-[programGridIn_320ms_cubic-bezier(0.16,1,0.3,1)_forwards] opacity-0",
      )}
    >
      {programs.map((program) => (
        <ProgramCard key={program.id} program={program} />
      ))}
    </div>
  );
}
