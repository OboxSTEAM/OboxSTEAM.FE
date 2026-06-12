"use client";

import { useCallback } from "react";

import AnimatedContent from "@/components/AnimatedContent";
import {
  ExpertProfileDialog,
  useExpertProfileDialog,
} from "@/components/experts/expert-profile-dialog";
import type { Paginated, ProgramReview, ProgramWithModules } from "@/lib/api/programs";
import { PROGRAM_DETAIL_SCROLL_MARGIN } from "@/lib/programs/detail-sections";
import { cn } from "@/lib/utils";

import { ProgramCurriculum } from "./program-curriculum";
import { ProgramDetailHero } from "./program-detail-hero";
import { ProgramExpertsPanel } from "./program-experts-panel";
import { ProgramOverview } from "./program-overview";
import { ProgramReviewsSection } from "./program-reviews-section";
import { ProgramSectionNav } from "./program-section-nav";
import { ProgramSidebar } from "./program-sidebar";
import { ProgramStatsBar } from "./program-stats-bar";

type ProgramDetailContentProps = {
  program: ProgramWithModules;
  initialReviews: Paginated<ProgramReview>;
};

export function ProgramDetailContent({
  program,
  initialReviews,
}: ProgramDetailContentProps) {
  const { selection, openExpert, closeExpert, isOpen } =
    useExpertProfileDialog();

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) closeExpert();
    },
    [closeExpert],
  );

  return (
    <>
      <ProgramDetailHero program={program} onExpertClick={openExpert} />

      <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:pb-16">
        <ProgramStatsBar program={program} />

        <div className="mt-8">
          <ProgramSectionNav />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-10">
          <div
            className={cn(
              "min-w-0 space-y-10",
              "bg-[radial-gradient(circle_at_1px_1px,rgba(45,45,45,0.04)_1px,transparent_0)] [background-size:20px_20px]",
            )}
          >
            <AnimatedContent distance={40} duration={0.6} threshold={0.08}>
              <section
                id="about"
                aria-labelledby="program-about-heading"
                className={PROGRAM_DETAIL_SCROLL_MARGIN}
              >
                <h2 id="program-about-heading" className="sr-only">
                  Tổng quan
                </h2>
                <ProgramOverview program={program} />
              </section>
            </AnimatedContent>

            {program.experts.length > 0 ? (
              <div className="lg:hidden">
                <ProgramExpertsPanel
                  program={program}
                  onExpertClick={openExpert}
                />
              </div>
            ) : null}

            <AnimatedContent distance={40} duration={0.6} threshold={0.08}>
              <section
                id="curriculum"
                aria-labelledby="program-curriculum-heading"
                className={PROGRAM_DETAIL_SCROLL_MARGIN}
              >
                <h2 id="program-curriculum-heading" className="sr-only">
                  Chương trình học
                </h2>
                <ProgramCurriculum program={program} />
              </section>
            </AnimatedContent>

            <AnimatedContent distance={40} duration={0.6} threshold={0.08}>
              <section
                id="reviews"
                aria-labelledby="program-reviews-heading"
                className={PROGRAM_DETAIL_SCROLL_MARGIN}
              >
                <h2 id="program-reviews-heading" className="sr-only">
                  Đánh giá
                </h2>
                <ProgramReviewsSection
                  programId={program.id}
                  programRating={program.rating}
                  totalReviews={program.totalReviews}
                  initialData={initialReviews}
                />
              </section>
            </AnimatedContent>
          </div>

          <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:block">
            <ProgramSidebar program={program} />
            <ProgramExpertsPanel
              program={program}
              onExpertClick={openExpert}
            />
          </aside>
        </div>
      </div>

      <ExpertProfileDialog
        expertId={selection?.expertId ?? null}
        open={isOpen}
        onOpenChange={handleDialogOpenChange}
        currentProgramId={program.id}
        preview={selection?.preview ?? null}
      />
    </>
  );
}
