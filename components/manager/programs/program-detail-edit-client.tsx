"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Star, GraduationCap, LayoutGrid } from "lucide-react";

import { ClassManager } from "@/components/manager/classes/class-manager";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { CurriculumSplitPanel } from "@/components/manager/programs/curriculum-split-panel";
import { ManagerRevisionChecklist } from "@/components/advisory/manager-revision-checklist";
import { AdvisoryWorkflowTimeline } from "@/components/advisory/advisory-workflow-timeline";
import { ProgramExpertsManager } from "@/components/manager/programs/program-experts-manager";
import { ProgramReviewActions } from "@/components/manager/programs/program-review-actions";
import { FrameworkRequirements } from "@/components/manager/programs/framework-requirements";
import { attachFrameworkAuthorToProgram } from "@/lib/programs/attach-framework-author";
import { ProgramReviewsManager } from "@/components/manager/programs/program-reviews-manager";
import { useCurriculumSync } from "@/hooks/use-curriculum-sync";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  getAdvisoryThreads,
  getProgramAdvisoryWorkspace,
  getProgramFrameworkById,
  type ProgramWithModules,
} from "@/lib/api";
import {
  fetchProgramCohortLock,
  type ProgramCohortLock,
} from "@/lib/programs/editability";
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

export function ProgramDetailEditClient({ program: initialProgram }: ProgramDetailEditClientProps) {
  const router = useRouter();
  const [program, setProgram] = useState<ProgramWithModules>(initialProgram);
  const [prevInitial, setPrevInitial] = useState<ProgramWithModules>(initialProgram);
  const [activeTab, setActiveTab] = useState<TabId>("curriculum");
  const [submitRequest, setSubmitRequest] = useState(0);
  const [cohortLock, setCohortLock] = useState<ProgramCohortLock>({
    locked: false,
    reason: null,
    blockingClasses: [],
  });

  const handleSilentSync = useCallback(() => {
    router.refresh();
  }, [router]);

  useCurriculumSync(program.id, handleSilentSync);

  const { data: advisoryWorkspaceData, retry: retryAdvisoryWorkspace } = useClientFetch({
    fetcher: () => getProgramAdvisoryWorkspace(program.id),
    deps: [program.id],
    onError: (error) => showAppErrorFromUnknown(error, "expert.advisory.workspace"),
  });
  const advisoryWorkspace = advisoryWorkspaceData?.data ?? null;
  const prepFrameworkId =
    program.status === "Draft" ? program.frameworkId : null;
  const { data: prepFrameworkData } = useClientFetch({
    enabled: prepFrameworkId != null,
    fetcher: () => getProgramFrameworkById(prepFrameworkId!),
    deps: [prepFrameworkId],
    onError: (error) => showAppErrorFromUnknown(error, "frameworks.list"),
  });
  const prepFramework = prepFrameworkData?.data ?? null;
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
        await attachFrameworkAuthorToProgram(
          program.id,
          expertId,
          program.experts.map((expert) => expert.expertId),
          program.advisorExpertId,
        );
        router.refresh();
      } catch (error) {
        advisorAttachKey.current = null;
        showAppErrorFromUnknown(error, "programs.advisor");
      }
    })();
  }, [prepFramework?.expertId, program, router]);

  const { data: advisoryThreadsData, retry: retryAdvisoryThreads } = useClientFetch({
    enabled: advisoryWorkspace != null,
    fetcher: () => getAdvisoryThreads(program.id),
    deps: [program.id, advisoryWorkspace != null],
    onError: (error) => showAppErrorFromUnknown(error, "expert.advisory.workspace"),
  });
  const advisoryThreads = advisoryThreadsData?.data ?? [];

  useEffect(() => {
    let cancelled = false;
    fetchProgramCohortLock(program.id).then((lock) => {
      if (!cancelled) setCohortLock(lock);
    });
    return () => {
      cancelled = true;
    };
  }, [program.id]);

  if (initialProgram !== prevInitial) {
    setPrevInitial(initialProgram);
    setProgram(initialProgram);
  }

  const breadcrumbs = [
    { label: "Chương trình", href: "/manager/programs" },
    { label: program.name },
  ];

  /** Curriculum is frozen while the expert board reviews it. */
  const isReviewLocked =
    program.status === "PendingReview" || program.status === "Approved";
  const showPrepRequirements =
    program.status === "Draft" && program.frameworkId != null;
  const showAdvisoryPanel =
    program.status === "Draft" ||
    program.status === "PendingReview" ||
    program.status === "Approved";

  return (
    <div className="flex flex-col gap-0">
      <ManagerPageHeader
        title={program.name}
        description={`Mã: ${program.code} · Cập nhật thông tin và khung chương trình học`}
        breadcrumbs={breadcrumbs}
      />

      <StepperTabBar active={activeTab} onChange={setActiveTab} />

      <div className="px-6 pb-12 pt-6">
        <div className="mb-6">
          <ProgramReviewActions
            programId={program.id}
            status={program.status}
            hasFramework={program.frameworkId != null}
            hasAdvisor={program.advisorExpertId != null}
            moduleCount={program.modules.length}
            openRequiredCount={advisoryWorkspace?.openRequiredChangeCount ?? 0}
            addressedRequiredCount={advisoryWorkspace?.addressedRequiredChangeCount ?? 0}
            reviewRound={advisoryWorkspace?.workflow?.round ?? 0}
            submitRequest={submitRequest}
            onChanged={() => {
              retryAdvisoryWorkspace();
              retryAdvisoryThreads();
              router.refresh();
            }}
          />
        </div>

        {activeTab === "curriculum" && (
          <div className="space-y-6">
            {showPrepRequirements && prepFramework ? (
              <FrameworkRequirements
                variant="banner"
                framework={prepFramework}
                frameworkVersionNumber={
                  program.frameworkVersionNumber ??
                  prepFramework.currentVersionNumber
                }
                isCategoryMismatch={
                  program.category != null &&
                  prepFramework.category !== program.category
                }
              />
            ) : null}
            {showAdvisoryPanel ? (
              <AdvisoryWorkflowTimeline
                timeline={advisoryWorkspace?.workflow}
                participants={advisoryWorkspace?.participants}
              />
            ) : null}
            {showAdvisoryPanel && program.status === "Draft" ? (
              <ManagerRevisionChecklist
                threads={advisoryThreads}
                fixedRequiredCount={advisoryWorkspace?.fixedRequiredCount ?? 0}
                outstandingRequiredCount={advisoryWorkspace?.outstandingRequiredCount ?? 0}
                canResubmit={(advisoryWorkspace?.openRequiredChangeCount ?? 0) === 0
                  && (advisoryWorkspace?.addressedRequiredChangeCount ?? 0) > 0}
                onResubmit={() => setSubmitRequest((value) => value + 1)}
              />
            ) : null}
            <div className="w-full">
              <Suspense fallback={<CurriculumPanelFallback />}>
                <CurriculumSplitPanel
                  program={program}
                  onRefresh={() => {
                    router.refresh();
                  }}
                  cohortLocked={isReviewLocked || cohortLock.locked}
                  lockReason={
                    isReviewLocked
                      ? program.status === "Approved"
                        ? "Chương trình đã được duyệt và đang ở chế độ chỉ xem."
                        : "Chương trình đang chờ chuyên gia thẩm định. Rút duyệt để tiếp tục chỉnh sửa."
                      : cohortLock.reason
                  }
                  blockingClasses={cohortLock.blockingClasses}
                  advisoryThreads={advisoryThreads}
                  advisoryCapabilities={advisoryWorkspace?.capabilities}
                  onAdvisoryChanged={() => {
                    retryAdvisoryThreads();
                    retryAdvisoryWorkspace();
                  }}
                />
              </Suspense>
            </div>
          </div>
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
  );
}
