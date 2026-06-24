"use client";

import { useState } from "react";
import { ListTree, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { SiteHeader } from "@/components/landing/site-header";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import type { EnrollmentCurriculum } from "@/lib/api";
import { cn } from "@/lib/utils";

import { ActivityPanel } from "./activity-panel";
import { CurriculumNav } from "./curriculum-nav";

const DESKTOP_NAV_WIDTH = 320;

type CurriculumShellProps = {
  curriculum: EnrollmentCurriculum;
  selectedActivityId: string | null;
  onSelectActivity: (activityId: string) => void;
  onCurriculumRefresh: () => Promise<void>;
};

export function CurriculumShell({
  curriculum,
  selectedActivityId,
  onSelectActivity,
  onCurriculumRefresh,
}: CurriculumShellProps) {
  const reduceMotion = useReducedMotion();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [desktopNavOpen, setDesktopNavOpen] = useState(true);

  const handleSelectActivity = (activityId: string) => {
    onSelectActivity(activityId);
    setMobileNavOpen(false);
  };

  const navTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <div className="learn-shell flex min-h-dvh flex-col bg-learn-bg pt-[4.5rem] sm:pt-20">
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
          <div
            id="curriculum-desktop-nav"
            className="sticky top-[4.5rem] h-[calc(100dvh-4.5rem)] overflow-y-auto sm:top-20 sm:h-[calc(100dvh-5rem)]"
            style={{ width: DESKTOP_NAV_WIDTH }}
          >
            <CurriculumNav
              curriculum={curriculum}
              selectedActivityId={selectedActivityId}
              onSelectActivity={onSelectActivity}
            />
          </div>
        </motion.aside>

        <main className="min-w-0 flex-1 p-3 sm:p-4 lg:p-6">
          <div className="mb-3 flex items-center gap-2">
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

          <ActivityPanel
            curriculum={curriculum}
            selectedActivityId={selectedActivityId}
            onSelectActivity={onSelectActivity}
            onCurriculumRefresh={onCurriculumRefresh}
          />
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
          <SheetBody className="bg-learn-surface p-0">
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
