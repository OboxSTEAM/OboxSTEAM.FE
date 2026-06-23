"use client";

import { useState } from "react";

import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import type { EnrollmentCurriculum } from "@/lib/api";

import { ActivityPanel } from "./activity-panel";
import { CurriculumNav } from "./curriculum-nav";
import { CurriculumTopbar } from "./curriculum-topbar";

type CurriculumShellProps = {
  curriculum: EnrollmentCurriculum;
  programId: string;
  selectedActivityId: string | null;
  onSelectActivity: (activityId: string) => void;
  onCurriculumRefresh: () => Promise<void>;
};

export function CurriculumShell({
  curriculum,
  programId,
  selectedActivityId,
  onSelectActivity,
  onCurriculumRefresh,
}: CurriculumShellProps) {
  const [navOpen, setNavOpen] = useState(false);

  const handleSelectActivity = (activityId: string) => {
    onSelectActivity(activityId);
    setNavOpen(false);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#FAFAF5]">
      <CurriculumTopbar
        programName={curriculum.programName}
        progressPercent={curriculum.progressPercent}
        programId={programId}
        onOpenNav={() => setNavOpen(true)}
      />

      <div className="grid min-h-0 flex-1 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="hidden min-h-0 border-r border-[#E5E5E0] bg-white lg:block">
          <div className="sticky top-14 h-[calc(100dvh-3.5rem)] overflow-y-auto">
            <CurriculumNav
              curriculum={curriculum}
              selectedActivityId={selectedActivityId}
              onSelectActivity={onSelectActivity}
            />
          </div>
        </aside>

        <main className="min-h-0 p-3 sm:p-4 lg:p-6">
          <ActivityPanel
            curriculum={curriculum}
            selectedActivityId={selectedActivityId}
            onSelectActivity={onSelectActivity}
            onCurriculumRefresh={onCurriculumRefresh}
          />
        </main>
      </div>

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetPopup side="left" className="p-0">
          <SheetHeader>
            <SheetTitle>Nội dung khóa học</SheetTitle>
            <SheetClose />
          </SheetHeader>
          <SheetBody>
            <CurriculumNav
              curriculum={curriculum}
              selectedActivityId={selectedActivityId}
              onSelectActivity={handleSelectActivity}
            />
          </SheetBody>
        </SheetPopup>
      </Sheet>
    </div>
  );
}
