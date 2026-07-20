"use client";

import { useState } from "react";
import { ListTree, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { SiteHeader } from "@/components/landing/site-header";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import type { EnrollmentCurriculum } from "@/lib/api";
import type { CurriculumClassContext } from "@/lib/curriculum/class-context";
import { findFlatAssignment } from "@/lib/curriculum/assignment-helpers";
import { cn } from "@/lib/utils";

import { ActivityPanel } from "./activity-panel";
import { AssignmentPanel } from "./assignment-panel";
import { CurriculumNav } from "./curriculum-nav";
import { CurriculumMindMapPanel } from "./mind-map/curriculum-mind-map-panel";

const DESKTOP_NAV_WIDTH = 320;

export type CurriculumMainView = "content" | "mind-map";

type CurriculumShellProps = {
  curriculum: EnrollmentCurriculum;
  selectedActivityId: string | null;
  selectedAssignmentId: string | null;
  onSelectActivity: (activityId: string) => void;
  onSelectAssignment: (assignmentId: string) => void;
  onCurriculumRefresh: () => Promise<void>;
  classContext?: CurriculumClassContext | null;
  initialView?: CurriculumMainView;
};

export function CurriculumShell({
  curriculum,
  selectedActivityId,
  selectedAssignmentId,
  onSelectActivity,
  onSelectAssignment,
  onCurriculumRefresh,
  classContext = null,
  initialView = "content",
}: CurriculumShellProps) {
  const reduceMotion = useReducedMotion();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [desktopNavOpen, setDesktopNavOpen] = useState(true);
  const [mainView, setMainView] = useState<CurriculumMainView>(initialView);

  const flatAssignment = selectedAssignmentId
    ? findFlatAssignment(curriculum, selectedAssignmentId)
    : null;

  const handleSelectActivity = (activityId: string) => {
    setMainView("content");
    onSelectActivity(activityId);
    setMobileNavOpen(false);
  };

  const handleSelectAssignment = (assignmentId: string) => {
    setMainView("content");
    onSelectAssignment(assignmentId);
    setMobileNavOpen(false);
  };

  const handleOpenMindMap = () => {
    setMainView("mind-map");
    setMobileNavOpen(false);
  };

  const handleOpenLessonFromMap = (params: {
    activityId?: string;
    assignmentId?: string;
  }) => {
    setMainView("content");
    if (params.assignmentId) {
      onSelectAssignment(params.assignmentId);
      return;
    }
    if (params.activityId) {
      onSelectActivity(params.activityId);
    }
  };

  const navTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <div className="learn-shell flex h-dvh flex-col overflow-hidden bg-learn-bg pt-[4.5rem] sm:pt-20">
      <SiteHeader defaultScrolled />

      <div className="flex min-h-0 flex-1">
        <motion.aside
          initial={false}
          animate={{
            width: desktopNavOpen ? DESKTOP_NAV_WIDTH : 0,
            opacity: desktopNavOpen ? 1 : 0,
          }}
          transition={navTransition}
          className="hidden shrink-0 overflow-hidden bg-learn-surface lg:block"
          aria-hidden={!desktopNavOpen}
        >
          <ScrollArea
            id="curriculum-desktop-nav"
            className="h-[calc(100dvh-4.5rem)] sm:h-[calc(100dvh-5rem)]"
            style={{ width: DESKTOP_NAV_WIDTH }}
          >
            <CurriculumNav
              curriculum={curriculum}
              selectedActivityId={selectedActivityId}
              selectedAssignmentId={selectedAssignmentId}
              onSelectActivity={handleSelectActivity}
              onSelectAssignment={handleSelectAssignment}
              onOpenMindMap={handleOpenMindMap}
              mainView={mainView}
              classContext={classContext}
            />
          </ScrollArea>
        </motion.aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-3 sm:p-4 lg:p-6">
          <div className="mb-2 flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="hidden gap-2 text-learn-muted hover:bg-learn-surface-2 hover:text-learn-text-strong lg:inline-flex"
              onClick={() => setDesktopNavOpen((open) => !open)}
              aria-expanded={desktopNavOpen}
              aria-controls="curriculum-desktop-nav"
            >
              {desktopNavOpen ? (
                <PanelLeftClose className="size-4" aria-hidden />
              ) : (
                <PanelLeftOpen className="size-4" aria-hidden />
              )}
              {desktopNavOpen ? "Ẩn nội dung" : "Hiện nội dung"}
            </Button>
          </div>

          <div className="min-h-0 flex-1">
            {mainView === "mind-map" ? (
              <CurriculumMindMapPanel
                enrollmentId={curriculum.enrollmentId}
                onOpenLesson={handleOpenLessonFromMap}
                className="h-full"
              />
            ) : selectedAssignmentId && flatAssignment ? (
              <AssignmentPanel
                curriculum={curriculum}
                assignmentId={selectedAssignmentId}
                flatAssignment={flatAssignment}
                onCurriculumRefresh={onCurriculumRefresh}
              />
            ) : (
              <ActivityPanel
                curriculum={curriculum}
                selectedActivityId={selectedActivityId}
                onSelectActivity={onSelectActivity}
                onCurriculumRefresh={onCurriculumRefresh}
                classSessions={classContext?.sessions ?? []}
              />
            )}
          </div>
        </main>
      </div>

      <Button
        type="button"
        size="sm"
        className={cn(
          "fixed bottom-5 left-4 z-40 gap-2 rounded-full shadow-md lg:hidden",
          "bg-learn-surface text-learn-text-strong",
          "hover:bg-learn-surface-2",
        )}
        onClick={() => setMobileNavOpen(true)}
      >
        <ListTree className="size-4" aria-hidden />
        Nội dung
      </Button>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetPopup side="left" className="bg-learn-surface p-0">
          <SheetHeader className="bg-learn-surface">
            <SheetTitle className="text-learn-text-strong">
              Nội dung khóa học
            </SheetTitle>
            <SheetClose />
          </SheetHeader>
          <SheetBody className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
            <ScrollArea className="min-h-0 flex-1">
              <CurriculumNav
                curriculum={curriculum}
                selectedActivityId={selectedActivityId}
                selectedAssignmentId={selectedAssignmentId}
                onSelectActivity={handleSelectActivity}
                onSelectAssignment={handleSelectAssignment}
                onOpenMindMap={handleOpenMindMap}
                mainView={mainView}
                classContext={classContext}
              />
            </ScrollArea>
          </SheetBody>
        </SheetPopup>
      </Sheet>
    </div>
  );
}
