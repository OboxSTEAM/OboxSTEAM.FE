"use client";

import { useEffect, useState } from "react";
import { Inbox, PanelRightClose, PanelRightOpen, X } from "lucide-react";

import { MentorBoardManager } from "@/components/mentors/mentor-board-manager";
import { MyClassMentorRequests } from "@/components/mentors/my-class-mentor-requests";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { MentorSkillsSection } from "@/components/profile/mentor-skills-section";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function useIsDesktopPanel() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isDesktop;
}

export function MentorAssignmentHub() {
  const isDesktop = useIsDesktopPanel();
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);
  const [requestsRefreshKey, setRequestsRefreshKey] = useState(0);
  const [skillsVersion, setSkillsVersion] = useState(0);

  function openRequests() {
    setIsRequestsOpen(true);
  }

  function handleApplied() {
    setRequestsRefreshKey((key) => key + 1);
    setIsRequestsOpen(true);
  }

  function handleSkillsChanged() {
    setSkillsVersion((version) => version + 1);
  }

  return (
    <div className="flex min-h-full flex-col">
      <ManagerPageHeader
        title="Đăng ký lớp"
        description="Quản lý kỹ năng, tìm lớp đang tuyển mentor — mở panel để theo dõi yêu cầu đã gửi."
      >
        <Button
          type="button"
          variant={isRequestsOpen ? "secondary" : "outline"}
          onClick={() => setIsRequestsOpen((open) => !open)}
          aria-expanded={isRequestsOpen}
          aria-controls="mentor-my-requests"
          className="h-10 rounded-lg"
        >
          {isRequestsOpen ? (
            <PanelRightClose className="size-4" />
          ) : (
            <PanelRightOpen className="size-4" />
          )}
          <Inbox className="size-4" />
          Yêu cầu của tôi
        </Button>
      </ManagerPageHeader>

      <div className="relative flex min-h-0 flex-1">
        <section className="min-w-0 flex-1">
          <div className="border-b border-border bg-card px-4 py-3 lg:px-6">
            <MentorSkillsSection
              defaultExpanded={false}
              onChanged={handleSkillsChanged}
            />
          </div>
          <div className="border-b border-border bg-card px-4 py-3 lg:px-6">
            <h3 className="text-sm font-semibold text-foreground">
              Lớp mentor
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Lớp đang tuyển và lớp đã xin / đã nhận xếp chung — ưu tiên hiện
              trước. Chip xanh = kỹ năng bạn đã khớp.
            </p>
          </div>
          <MentorBoardManager
            embedded
            denserGrid={isRequestsOpen && isDesktop === true}
            skillsVersion={skillsVersion}
            onApplied={handleApplied}
            onViewRequests={openRequests}
          />
        </section>

        <aside
          id="mentor-my-requests"
          aria-hidden={!isRequestsOpen}
          className={cn(
            "hidden shrink-0 overflow-hidden border-l border-border transition-[width] duration-300 ease-out motion-reduce:transition-none lg:block",
            isRequestsOpen ? "w-[22rem] xl:w-[24rem]" : "w-0 border-l-0",
          )}
        >
          <div
            className={cn(
              "sticky top-0 h-[calc(100vh-4rem)] w-[22rem] p-4 xl:w-[24rem]",
              !isRequestsOpen && "pointer-events-none",
            )}
          >
            <div className="relative h-full">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsRequestsOpen(false)}
                className="absolute right-2 top-2 z-10 size-8 rounded-lg text-muted-foreground hover:text-foreground"
                aria-label="Đóng yêu cầu của tôi"
              >
                <X className="size-4" />
              </Button>
              <MyClassMentorRequests panel refreshKey={requestsRefreshKey} />
            </div>
          </div>
        </aside>
      </div>

      <Sheet
        open={isDesktop === false && isRequestsOpen}
        onOpenChange={setIsRequestsOpen}
      >
        <SheetPopup side="right" className="w-[min(24rem,92vw)] p-0">
          <SheetTitle className="sr-only">Yêu cầu của tôi</SheetTitle>
          <div className="flex h-full flex-col p-3">
            <div className="mb-2 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsRequestsOpen(false)}
                className="size-8 rounded-lg"
                aria-label="Đóng"
              >
                <X className="size-4" />
              </Button>
            </div>
            <MyClassMentorRequests
              panel
              refreshKey={requestsRefreshKey}
              className="min-h-0 flex-1"
            />
          </div>
        </SheetPopup>
      </Sheet>
    </div>
  );
}
