"use client";

import { getProgramPriceParts } from "@/lib/programs/constants";
import { showsEnrollmentProgress } from "@/lib/programs/enrollments";
import { cn } from "@/lib/utils";

import { ProgramEnrollmentProgressFocus } from "./program-enrollment-progress-focus";
import { useProgramEnrollmentLookup } from "./program-enrollment-lookup";

type ProgramPriceDisplayProps = {
  price: number;
  className?: string;
};

function ProgramPriceDisplay({ price, className }: ProgramPriceDisplayProps) {
  const priceParts = getProgramPriceParts(price);

  return (
    <div className={cn("text-center", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-[#6B6B6B]">
        Học phí
      </p>
      {priceParts.isFree ? (
        <p className="mt-1 font-heading text-3xl font-extrabold text-[#4FC3F7]">
          {priceParts.label}
        </p>
      ) : (
        <p
          className="mt-1 inline-flex items-baseline justify-center gap-1"
          aria-label={`Giá ${priceParts.amount} ${priceParts.unit}`}
        >
          <span className="font-heading text-3xl font-extrabold tabular-nums leading-none text-[#E94B3C]">
            {priceParts.amount}
          </span>
          <span className="text-sm font-bold text-[#E94B3C]/80">
            {priceParts.unit}
          </span>
        </p>
      )}
    </div>
  );
}

function PriceSkeleton() {
  return (
    <div className="animate-pulse space-y-2 text-center" aria-hidden>
      <div className="mx-auto h-3 w-16 rounded bg-[#E5E5E0]" />
      <div className="mx-auto h-9 w-28 rounded-lg bg-[#E5E5E0]" />
    </div>
  );
}

type ProgramSidebarHeadProps = {
  price: number;
};

export function ProgramSidebarHead({ price }: ProgramSidebarHeadProps) {
  const { enrollment, isLoading } = useProgramEnrollmentLookup();

  if (isLoading) {
    return <PriceSkeleton />;
  }

  if (showsEnrollmentProgress(enrollment)) {
    return <ProgramEnrollmentProgressFocus variant="sidebar" />;
  }

  return <ProgramPriceDisplay price={price} />;
}

export function ProgramHeroEnrollmentHead({ price }: { price: number }) {
  const { enrollment, isLoading } = useProgramEnrollmentLookup();

  if (isLoading) {
    return null;
  }

  if (showsEnrollmentProgress(enrollment)) {
    return <ProgramEnrollmentProgressFocus variant="hero" className="mb-3" />;
  }

  const priceParts = getProgramPriceParts(price);
  if (priceParts.isFree) {
    return null;
  }

  return (
    <p className="mb-3 text-sm text-[#6B6B6B]">
      Học phí{" "}
      <span className="font-semibold text-[#2D2D2D]">
        {priceParts.amount} {priceParts.unit}
      </span>
    </p>
  );
}
