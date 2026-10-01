"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ShieldCheck } from "lucide-react";

import {
  AdvisoryChatProvider,
  AdvisoryChatSidebar,
  ApprovalBar,
  FrameworkCheckList,
  useAdvisoryChat,
} from "@/components/advisory-chat";
import { ExpertWorkbenchHero } from "@/components/expert/shared/expert-workbench";
import { CurriculumSplitPanel } from "@/components/manager/programs/curriculum-split-panel";
import { ProgramLifecycleSteps } from "@/components/manager/programs/program-lifecycle-steps";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCurriculumSync } from "@/hooks/use-curriculum-sync";
import { useFrameworkCheck } from "@/hooks/use-framework-check";
import type { ProgramWithModules } from "@/lib/api";
import { cn } from "@/lib/utils";

type ExpertProgramWorkspaceProps = {
  program: ProgramWithModules;
};

/**
 * Expert view of a program: the live curriculum (read-only) next to the shared
 * advisory chat. Approve / revoke come from the workspace capabilities.
 */
export function ExpertProgramWorkspace({ program }: ExpertProgramWorkspaceProps) {
  return (
    <AdvisoryChatProvider programId={program.id} hasChangesView>
      <ExpertProgramLayout program={program} />
    </AdvisoryChatProvider>
  );
}

function ExpertProgramLayout({ program }: ExpertProgramWorkspaceProps) {
  const router = useRouter();
  const { workspace, currentUserId } = useAdvisoryChat();

  const refreshProgram = useCallback(() => {
    router.refresh();
  }, [router]);

  useCurriculumSync(program.id, refreshProgram);

  const participant = workspace?.participants.find((item) => item.userId === currentUserId);
  const roleLabel = participant
    ? participant.isAdvisor
      ? "Chuyên gia phụ trách"
      : "Hội đồng chuyên môn"
    : "Hồ sơ cố vấn chương trình";
  const frameworkLabel =
    program.frameworkVersionNumber != null
      ? `Khung v${program.frameworkVersionNumber}`
      : "Chưa gắn khung";

  return (
    <div className="flex min-h-full items-stretch">
      <div className="flex min-w-0 flex-1 flex-col">
        <ExpertWorkbenchHero
          eyebrow={roleLabel}
          title={program.name || "Chương trình chưa đặt tên"}
          description={`${program.code || "Chưa có mã"} · ${frameworkLabel}`}
          icon={ShieldCheck}
          actions={
            <Button
              nativeButton={false}
              render={<Link href="/expert/programs" />}
              variant="outline"
              className="h-10 gap-2 rounded-xl border-border px-4 font-semibold"
            >
              <ArrowLeft className="size-4" />
              Danh sách cố vấn
            </Button>
          }
        >
          <ProgramLifecycleSteps
            status={workspace?.status ?? program.status}
            hasApproval={workspace ? workspace.approval !== null : null}
          />
        </ExpertWorkbenchHero>

        <div className="space-y-4 px-4 pb-12 pt-6 sm:px-6">
          {program.frameworkId ? <FrameworkCheckSection programId={program.id} /> : null}
          <CurriculumSplitPanel program={program} onRefresh={refreshProgram} readOnly />
        </div>
      </div>

      <AdvisoryChatSidebar
        className="sticky top-0 h-[calc(100dvh-4rem)] self-start"
        footer={<ApprovalBar />}
      />
    </div>
  );
}

/** Live framework rules, collapsed by default; failing rules link to the components to fix. */
function FrameworkCheckSection({ programId }: { programId: string }) {
  const [isOpen, setOpen] = useState(false);
  const frameworkCheck = useFrameworkCheck(programId);
  const { check } = frameworkCheck;
  const failedCount = check ? check.checks.filter((item) => !item.passed).length : 0;

  let summary = "Đang kiểm tra…";
  let tone = "bg-muted text-muted-foreground";
  if (check) {
    if (failedCount > 0) {
      summary = `${failedCount}/${check.checks.length} quy tắc chưa đạt`;
      tone = "bg-amber-500/12 text-amber-800 dark:text-amber-300";
    } else {
      summary = "Đạt toàn bộ quy tắc";
      tone = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    }
  } else if (frameworkCheck.error) {
    summary = "Không tải được";
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setOpen} className="rounded-2xl border border-border bg-card">
      <CollapsibleTrigger className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2.5 text-left">
        <span className="text-sm font-semibold text-foreground">Kiểm tra khung</span>
        <span className="flex items-center gap-2">
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", tone)}>{summary}</span>
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
              isOpen && "rotate-180",
            )}
            aria-hidden
          />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        <FrameworkCheckList
          check={check}
          isLoading={frameworkCheck.isLoading}
          error={frameworkCheck.error}
          onRetry={() => void frameworkCheck.refresh()}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
