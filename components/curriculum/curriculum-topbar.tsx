"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ListTree } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/landing/content";
import { cn } from "@/lib/utils";

type CurriculumTopbarProps = {
  programName: string;
  progressPercent: number;
  programId: string;
  onOpenNav: () => void;
  className?: string;
};

export function CurriculumTopbar({
  programName,
  progressPercent,
  programId,
  onOpenNav,
  className,
}: CurriculumTopbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[#E5E5E0] bg-white px-3 sm:px-4",
        className,
      )}
    >
      <Link
        href={`/programs/${programId}`}
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-[#2D2D2D] hover:bg-[#F5F5F0]"
        aria-label="Quay lại chương trình"
      >
        <ArrowLeft className="size-5" />
      </Link>

      <Link href="/" className="hidden items-center gap-2 sm:inline-flex">
        <Image
          src={SITE.logoUrl}
          alt="OboxSTEAM"
          width={28}
          height={28}
          className="size-7 rounded-md"
        />
      </Link>

      <div className="min-w-0 flex-1 text-center sm:text-left">
        <p className="truncate font-heading text-sm font-semibold text-[#2D2D2D] sm:text-base">
          {programName}
        </p>
        <div className="mt-1 hidden items-center gap-2 sm:flex">
          <div className="h-1 w-24 overflow-hidden rounded-full bg-[#E5E5E0]">
            <div
              className="h-full rounded-full bg-[#4FC3F7]"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
          <span className="text-xs text-[#6B6B6B]">{progressPercent}%</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="lg:hidden"
        onClick={onOpenNav}
      >
        <ListTree className="size-4" />
        Nội dung
      </Button>

      <Link
        href={`/programs/${programId}`}
        className="hidden shrink-0 text-sm font-medium text-[#6B6B6B] hover:text-[#2D2D2D] sm:inline"
      >
        Thoát
      </Link>
    </header>
  );
}
