"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import {
  AdvisoryChatProvider,
  AdvisoryChatSidebar,
  ApprovalBar,
  ProgramWorkflowTimeline,
  useAdvisoryChat,
} from "@/components/advisory-chat";
import { ExpertWorkbenchHero } from "@/components/expert/shared/expert-workbench";
import { CurriculumSplitPanel } from "@/components/manager/programs/curriculum-split-panel";
import { FrameworkRequirements } from "@/components/manager/programs/framework-requirements";
import { Button } from "@/components/ui/button";
import { useCurriculumSync } from "@/hooks/use-curriculum-sync";
import { useFrameworkCheck } from "@/hooks/use-framework-check";
import type { ProgramFramework, ProgramWithModules } from "@/lib/api";

type ExpertProgramWorkspaceProps = {
  program: ProgramWithModules;
  /** `null` when the program has no framework or the viewer cannot read it. */
  framework: ProgramFramework | null;
};

/**
 * Expert view of a program: the live curriculum (read-only) next to the shared
 * advisory chat. Approve / revoke come from the workspace capabilities.
 */
export function ExpertProgramWorkspace({ program, framework }: ExpertProgramWorkspaceProps) {
  return (
    <AdvisoryChatProvider programId={program.id} hasChangesView>
      <ExpertProgramLayout program={program} framework={framework} />
    </AdvisoryChatProvider>
  );
}

function ExpertProgramLayout({ program, framework }: ExpertProgramWorkspaceProps) {
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
          <ProgramWorkflowTimeline status={workspace?.status ?? program.status} workspace={workspace} />
        </ExpertWorkbenchHero>

        <div className="space-y-4 px-4 pb-12 pt-6 sm:px-6">
          {program.frameworkId ? (
            <FrameworkCheckBanner program={program} framework={framework} />
          ) : null}
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

function FrameworkCheckBanner({ program, framework }: ExpertProgramWorkspaceProps) {
  const frameworkCheck = useFrameworkCheck(program.id);

  return (
    <FrameworkRequirements
      variant="banner"
      framework={framework}
      frameworkVersionNumber={program.frameworkVersionNumber ?? framework?.currentVersionNumber}
      isCategoryMismatch={
        framework != null && program.category != null && framework.category !== program.category
      }
      check={frameworkCheck.check}
      isCheckLoading={frameworkCheck.isLoading}
      onRetryCheck={() => void frameworkCheck.refresh()}
    />
  );
}
