"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Users, Star, GraduationCap, LayoutGrid } from "lucide-react";

import {
  AdvisoryChatProvider,
  AdvisoryChatSidebar,
  ApprovalBar,
  ProgramWorkflowTimeline,
  useAdvisoryChat,
} from "@/components/advisory-chat";
import { ClassManager } from "@/components/manager/classes/class-manager";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { ManagerCurriculumTab } from "@/components/manager/programs/manager-curriculum-tab";
import { ProgramExpertsManager } from "@/components/manager/programs/program-experts-manager";
import { attachFrameworkAuthorToProgram } from "@/lib/programs/attach-framework-author";
import { ProgramReviewsManager } from "@/components/manager/programs/program-reviews-manager";
import { useCurriculumSync } from "@/hooks/use-curriculum-sync";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { buildMaterialActivityOptions } from "@/lib/advisory/material-activity-options";
import { getProgramFrameworkById, type ProgramWithModules } from "@/lib/api";
import { cn } from "@/lib/utils";
import { showAppErrorFromUnknown } from "@/lib/errors";

// ─── Stepper tab config ────────────────────────────────────────────────────────
type TabId = "curriculum" | "experts" | "reviews" | "classes";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "curriculum",  label: "Khung chương trình", icon: LayoutGrid },
  { id: "experts",     label: "Chuyên gia",           icon: Users },
  { id: "reviews",     label: "Đánh giá",             icon: Star },
  { id: "classes",     label: "Lớp",                  icon: GraduationCap },
];

const TAB_IDS = new Set<TabId>(TABS.map((tab) => tab.id));

function parseProgramTab(value: string | null): TabId {
  if (value && TAB_IDS.has(value as TabId)) return value as TabId;
  return "curriculum";
}

// ─── Stepper Tab Bar ──────────────────────────────────────────────────────────
function StepperTabBar({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (id: TabId) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Các bước chỉnh sửa chương trình"
      className="sticky top-0 z-30 flex items-stretch gap-1 border-b border-border bg-background px-6"
    >
      {TABS.map((tab, idx) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`stepper-tab-${tab.id}`}
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tabular-nums transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {idx + 1}
            </span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function CurriculumPanelFallback() {
  return (
    <div
      className="min-h-[520px] animate-pulse rounded-xl border"
      style={{ background: "#ede9e0", borderColor: "#d8d2c6" }}
    />
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
type ProgramDetailEditClientProps = {
  program: ProgramWithModules;
};

function ProgramDetailEditClientInner({
  program: initialProgram,
}: ProgramDetailEditClientProps) {
  const [program, setProgram] = useState<ProgramWithModules>(initialProgram);
  const [prevInitial, setPrevInitial] = useState<ProgramWithModules>(initialProgram);

  if (initialProgram !== prevInitial) {
    setPrevInitial(initialProgram);
    setProgram(initialProgram);
  }

  const materialActivities = useMemo(
    () => buildMaterialActivityOptions(program.modules),
    [program.modules],
  );

  return (
    <AdvisoryChatProvider
      programId={program.id}
      materialActivities={materialActivities}
      hasChangesView
    >
      <ProgramDetailLayout program={program} />
    </AdvisoryChatProvider>
  );
}

function ProgramDetailLayout({ program }: { program: ProgramWithModules }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { workspace } = useAdvisoryChat();
  const activeTab = parseProgramTab(searchParams.get("tab"));

  function setActiveTab(id: TabId) {
    const params = new URLSearchParams(searchParams.toString());
    if (id === "curriculum") {
      params.delete("tab");
    } else {
      params.set("tab", id);
      params.delete("node");
      params.delete("id");
      params.delete("moduleId");
      params.delete("courseId");
      params.delete("material");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const refreshProgram = useCallback(() => {
    router.refresh();
  }, [router]);

  useCurriculumSync(program.id, refreshProgram);

  // Approve/revoke/publish by anyone lands as a workspace status change; reload the
  // RSC program so status-dependent forms are not stale.
  const syncedStatusRef = useRef(program.status);
  useEffect(() => {
    const status = workspace?.status;
    if (!status || status === program.status || status === syncedStatusRef.current) return;
    syncedStatusRef.current = status;
    router.refresh();
  }, [program.status, router, workspace?.status]);

  const prepFrameworkId = program.status === "Draft" ? program.frameworkId : null;
  const { data: prepFrameworkData } = useClientFetch({
    enabled: prepFrameworkId != null,
    fetcher: () => getProgramFrameworkById(prepFrameworkId!),
    deps: [prepFrameworkId],
    onError: (error) => showAppErrorFromUnknown(error, "frameworks.list"),
  });
  const prepFramework = prepFrameworkId ? (prepFrameworkData?.data ?? null) : null;
  const advisorAttachKey = useRef<string | null>(null);

  useEffect(() => {
    const expertId = prepFramework?.expertId;
    if (program.status !== "Draft" || !expertId) return;
    const onBoard = program.experts.some((expert) => expert.expertId === expertId);
    if (program.advisorExpertId === expertId && onBoard) return;

    const key = `${program.id}:${expertId}:${program.advisorExpertId ?? ""}`;
    if (advisorAttachKey.current === key) return;
    advisorAttachKey.current = key;

    void (async () => {
      try {
        await attachFrameworkAuthorToProgram(program.id, expertId, {
          status: program.status,
          assignedExpertIds: program.experts.map((expert) => expert.expertId),
          advisorExpertId: program.advisorExpertId,
        });
        router.refresh();
      } catch (error) {
        advisorAttachKey.current = null;
        showAppErrorFromUnknown(error, "programs.advisor");
      }
    })();
  }, [prepFramework?.expertId, program, router]);

  const breadcrumbs = [
    { label: "Chương trình", href: "/manager/programs" },
    { label: program.name },
  ];

  return (
    <div className="flex min-h-full items-stretch">
      <div className="flex min-w-0 flex-1 flex-col">
        <ManagerPageHeader
          title={program.name}
          description={`Mã: ${program.code} · Cập nhật thông tin và khung chương trình học`}
          breadcrumbs={breadcrumbs}
          footer={
            <ProgramWorkflowTimeline
              status={workspace?.status ?? program.status}
              workspace={workspace}
            />
          }
        />

        <StepperTabBar active={activeTab} onChange={setActiveTab} />

        <div className="px-6 pb-12 pt-6">
          {activeTab === "curriculum" && (
            <Suspense fallback={<CurriculumPanelFallback />}>
              <ManagerCurriculumTab
                program={program}
                framework={prepFramework}
                onRefresh={refreshProgram}
              />
            </Suspense>
          )}

          {activeTab === "experts" && (
            <div className="py-4">
              <ProgramExpertsManager program={program} />
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="py-4">
              <ProgramReviewsManager
                programId={program.id}
                programName={program.name}
                programRating={program.rating}
                totalReviews={program.totalReviews}
              />
            </div>
          )}

          {activeTab === "classes" && (
            <div className="py-4">
              <ClassManager fixedProgramId={program.id} embedded />
            </div>
          )}
        </div>
      </div>

      <AdvisoryChatSidebar
        className="sticky top-0 h-[calc(100dvh-4rem)] self-start"
        footer={<ApprovalBar />}
      />
    </div>
  );
}

export function ProgramDetailEditClient(props: ProgramDetailEditClientProps) {
  return (
    <Suspense fallback={<CurriculumPanelFallback />}>
      <ProgramDetailEditClientInner {...props} />
    </Suspense>
  );
}
