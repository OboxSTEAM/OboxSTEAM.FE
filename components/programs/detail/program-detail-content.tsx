"use client";

import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Paginated, ProgramReview, ProgramWithModules } from "@/lib/api/programs";

import { ProgramCurriculum } from "./program-curriculum";
import { ProgramHero } from "./program-hero";
import { ProgramOverview } from "./program-overview";
import { ProgramReviewsSection } from "./program-reviews-section";
import { ProgramSidebar } from "./program-sidebar";

type ProgramDetailContentProps = {
  program: ProgramWithModules;
  initialReviews: Paginated<ProgramReview>;
};

export function ProgramDetailContent({
  program,
  initialReviews,
}: ProgramDetailContentProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <Breadcrumb className="mb-5">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>Trang chủ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/#programs" />}>
              Chương trình
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-[12rem] truncate sm:max-w-xs">
              {program.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18.5rem] lg:gap-8 lg:items-start">
        <div className="space-y-6 min-w-0">
          <ProgramHero program={program} />

          <div className="lg:hidden">
            <ProgramSidebar program={program} />
          </div>

          <Tabs defaultValue="overview">
            <TabsList
              variant="line"
              className="h-auto w-full justify-start gap-4 border-b border-[#E5E5E0] bg-transparent p-0"
            >
              <TabsTrigger
                value="overview"
                className="rounded-none px-0 pb-2.5 after:bg-[#E94B3C] data-active:text-[#2D2D2D]"
              >
                Tổng quan
              </TabsTrigger>
              <TabsTrigger
                value="curriculum"
                className="rounded-none px-0 pb-2.5 after:bg-[#E94B3C] data-active:text-[#2D2D2D]"
              >
                Chương trình học
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-none px-0 pb-2.5 after:bg-[#E94B3C] data-active:text-[#2D2D2D]"
              >
                Đánh giá
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-5">
              <ProgramOverview program={program} />
            </TabsContent>

            <TabsContent value="curriculum" className="mt-5">
              <ProgramCurriculum program={program} />
            </TabsContent>

            <TabsContent value="reviews" className="mt-5">
              <ProgramReviewsSection
                programId={program.id}
                programRating={program.rating}
                totalReviews={program.totalReviews}
                initialData={initialReviews}
              />
            </TabsContent>
          </Tabs>
        </div>

        <ProgramSidebar program={program} className="hidden lg:block" />
      </div>
    </div>
  );
}
