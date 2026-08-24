"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Star, GraduationCap, LayoutGrid } from "lucide-react";

import { ClassManager } from "@/components/manager/classes/class-manager";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { CurriculumSplitPanel } from "@/components/manager/programs/curriculum-split-panel";
import { ProgramExpertsManager } from "@/components/manager/programs/program-experts-manager";
import { ProgramReviewsManager } from "@/components/manager/programs/program-reviews-manager";
import { useCurriculumSync } from "@/hooks/use-curriculum-sync";
import { type ProgramWithModules } from "@/lib/api";
import {
  fetchProgramCohortLock,
  type ProgramCohortLock,
} from "@/lib/programs/editability";
import { cn } from "@/lib/utils";

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
    <div className="sticky top-0 z-30 flex items-center gap-0 border-b border-border bg-background px-6 pt-4">
      {TABS.map((tab, idx) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            id={`stepper-tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 pb-3 text-sm font-medium transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "bg-border text-muted-foreground"
              )}
            >
              {idx + 1}
            </span>
            {tab.label}

            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary" />
            )}
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
  const [cohortLock, setCohortLock] = useState<ProgramCohortLock>({
    locked: false,
    reason: null,
  });

  const handleSilentSync = useCallback(() => {
    router.refresh();
  }, [router]);

  useCurriculumSync(program.id, handleSilentSync);

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

  return (
    <div className="flex flex-col gap-0">
      <ManagerPageHeader
        title={program.name}
        description={`Mã: ${program.code} · Cập nhật thông tin và khung chương trình học`}
        breadcrumbs={breadcrumbs}
      />

      <StepperTabBar active={activeTab} onChange={setActiveTab} />

      <div className="px-6 pb-12 pt-6">
        {activeTab === "curriculum" && (
          <Suspense fallback={<CurriculumPanelFallback />}>
            <CurriculumSplitPanel
              program={program}
              onRefresh={() => {
                router.refresh();
              }}
              cohortLocked={cohortLock.locked}
              lockReason={cohortLock.reason}
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
  );
}
