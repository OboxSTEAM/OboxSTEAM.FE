"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  LayoutGrid,
  ListChecks,
  ShieldCheck,
} from "lucide-react";

import { AdvisoryCurriculumBoard } from "@/components/advisory/advisory-curriculum-board";
import { FrameworkCheckPanel } from "@/components/advisory/framework-check-panel";
import { ReviewAssessmentPanel } from "@/components/advisory/review-assessment-panel";
import {
  ExpertWorkbenchHero,
  ExpertWorkflowRail,
} from "@/components/expert/shared/expert-workbench";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  createAdvisoryThread,
  getAdvisoryBoard,
  getAdvisoryThreadPins,
  getAdvisoryThreads,
  getFrameworkVersion,
  getProgramAdvisoryWorkspace,
  getProgramFrameworkCheck,
  getReviewSubmission,
  recordAdvisoryRead,
  type FrameworkCheck,
  type ProgramAdvisoryWorkspace,
  type ProgramWithModules,
} from "@/lib/api";
import { parseRubricSnapshot } from "@/lib/advisory/parse-snapshot";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import {
  REVIEW_SUBMISSION_STATUS_LABELS,
} from "@/lib/expert/advisory-labels";
import { PROGRAM_STATUS_LABELS } from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

type WorkspaceTab = "overview" | "content" | "assessment";

const WORKSPACE_STEPS: {
  value: WorkspaceTab;
  label: string;
  detail: string;
}[] = [
  {
    value: "overview",
    label: "Hồ sơ chương trình",
    detail: "Hiểu mục tiêu, kết quả và trách nhiệm cố vấn của bạn.",
  },
  {
    value: "content",
    label: "Curriculum board",
    detail: "Đọc snapshot, xem diff và pin góp ý ngay trên cây chương trình.",
  },
  {
    value: "assessment",
    label: "Quyết định chính thức",
    detail: "Chấm rubric và kết thúc lần nộp thẩm định.",
  },
];

type ProgramAdvisoryWorkspaceProps = {
  program: ProgramWithModules;
};

function normalizeWorkspaceTab(raw: string | null): WorkspaceTab {
  if (raw === "content" || raw === "assessment" || raw === "overview") {
    return raw;
  }
  // Legacy inbox deep links → board (thread query param still opens the panel).
  if (raw === "discussion") return "content";
  return "overview";
}

function useWorkspaceParams() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tab = normalizeWorkspaceTab(searchParams.get("tab"));
  const threadId = searchParams.get("thread");
  const submissionId = searchParams.get("submission");
  const rawTab = searchParams.get("tab");

  const setParams = useCallback(
    (patch: Record<string, string | null | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value == null || value === "") next.delete(key);
        else next.set(key, value);
      }
      router.replace(`?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  return { tab, threadId, submissionId, rawTab, setParams };
}

export function ProgramAdvisoryWorkspace({ program }: ProgramAdvisoryWorkspaceProps) {
  const { tab, threadId, submissionId, rawTab, setParams } = useWorkspaceParams();
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const { profile } = useCurrentUser();

  const { data: workspaceData, retry: retryWorkspace } = useClientFetch({
    fetcher: () => getProgramAdvisoryWorkspace(program.id),
    deps: [program.id],
    onError: (error) => showAppErrorFromUnknown(error, "expert.advisory.workspace"),
  });

  const workspace = workspaceData?.data ?? null;
  // Until a full submission-history selector is present, always bind the
  // decision surface to the latest summary. This prevents an older snapshot
  // URL from being paired with the latest submission's concurrency token.
  const activeSubmissionId = workspace?.latestSubmission?.id ?? submissionId;

  const { data: frameworkCheckData, isLoading: isCheckLoading } = useClientFetch({
    fetcher: () => getProgramFrameworkCheck(program.id),
    deps: [program.id],
    onError: (error) => showAppErrorFromUnknown(error, "programs.framework-check"),
  });

  const { data: threadsData, retry: retryThreads } = useClientFetch({
    fetcher: () =>
      getAdvisoryThreads(program.id, {
        submissionId: activeSubmissionId ?? undefined,
      }),
    deps: [program.id, activeSubmissionId],
    onError: (error) => showAppErrorFromUnknown(error, "expert.advisory.threads"),
  });

  const {
    data: boardData,
    isLoading: isBoardLoading,
    retry: retryBoard,
  } = useClientFetch({
    enabled: activeSubmissionId != null,
    fetcher: () =>
      activeSubmissionId
        ? getAdvisoryBoard(program.id, { submissionId: activeSubmissionId })
        : Promise.resolve(null),
    deps: [program.id, activeSubmissionId],
    onError: (error) => showAppErrorFromUnknown(error, "expert.advisory.workspace"),
  });

  const {
    data: pinsData,
    retry: retryPins,
  } = useClientFetch({
    enabled: activeSubmissionId != null,
    fetcher: () =>
      activeSubmissionId
        ? getAdvisoryThreadPins(program.id, { submissionId: activeSubmissionId })
        : Promise.resolve(null),
    deps: [program.id, activeSubmissionId],
    onError: (error) => showAppErrorFromUnknown(error, "expert.advisory.threads"),
  });

  const { data: submissionData, isLoading: isSubmissionLoading } = useClientFetch({
    enabled: activeSubmissionId != null,
    fetcher: () =>
      activeSubmissionId
        ? getReviewSubmission(program.id, activeSubmissionId)
        : Promise.resolve(null),
    deps: [program.id, activeSubmissionId],
    onError: (error) => showAppErrorFromUnknown(error, "expert.review.detail"),
  });

  const submission = submissionData?.data ?? null;
  const pinnedFrameworkVersionId =
    submission?.frameworkVersionId ?? workspace?.frameworkVersionId ?? null;

  const { data: frameworkVersionData } = useClientFetch({
    enabled: program.frameworkId != null && pinnedFrameworkVersionId != null,
    fetcher: () =>
      program.frameworkId && pinnedFrameworkVersionId
        ? getFrameworkVersion(program.frameworkId, pinnedFrameworkVersionId)
        : Promise.resolve(null),
    deps: [program.frameworkId, pinnedFrameworkVersionId],
    onError: (error) => showAppErrorFromUnknown(error, "frameworks.detail"),
  });

  useEffect(() => {
    if (tab !== "content") return;
    void recordAdvisoryRead(program.id).catch(() => undefined);
  }, [program.id, tab]);

  useEffect(() => {
    if (rawTab !== "discussion") return;
    setParams({ tab: "content" });
  }, [rawTab, setParams]);

  const rubricCriteria = useMemo(() => {
    if (submission?.rubricSnapshotJson) {
      const fromSnapshot = parseRubricSnapshot(submission.rubricSnapshotJson);
      if (fromSnapshot.length > 0) return fromSnapshot;
    }
    const live = frameworkVersionData?.data?.criteria ?? [];
    return [...live]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        evidenceGuidance: c.evidenceGuidance,
        maxScore: c.maxScore,
        displayOrder: c.displayOrder,
      }));
  }, [submission, frameworkVersionData]);

  const board = boardData?.data ?? null;
  const pinSummaries = pinsData?.data ?? [];

  const threads = threadsData?.data ?? [];
  const selectedThread = threads.find((t) => t.id === threadId) ?? null;

  const openRequiredChanges = threads.filter(
    (t) => t.type === "RequiredChange" && t.status === "Open",
  );
  const openSuggestions = threads.filter(
    (t) => t.type === "Suggestion" && t.status === "Open",
  );

  function refreshAdvisorySurfaces() {
    retryThreads();
    retryBoard();
    retryPins();
  }

  async function handleCreateThread(input: Parameters<typeof createAdvisoryThread>[1]) {
    setIsCreatingThread(true);
    try {
      const result = await createAdvisoryThread(program.id, {
        ...input,
        submissionId: input.submissionId ?? activeSubmissionId,
      });
      showAppSuccess({ title: "Đã gửi góp ý" });
      refreshAdvisorySurfaces();
      if (result?.data?.id) {
        setParams({ tab: "content", thread: result.data.id });
      }
    } catch (error) {
      showAppErrorFromUnknown(error, "programs.advisory");
    } finally {
      setIsCreatingThread(false);
    }
  }

  const frameworkCheck = frameworkCheckData?.data ?? null;
  const feedbackCounts = workspace?.feedbackCounts;
  const currentParticipant = workspace?.participants.find(
    (participant) => participant.userId === profile?.id,
  );
  const isResponsibleAdvisor = currentParticipant?.isAdvisor === true;
  const canDecideLatest =
    isResponsibleAdvisor &&
    submission?.status === "Pending" &&
    submission.id === workspace?.latestSubmission?.id &&
    workspace?.status === "PendingReview";
  const addressedRequiredCount = threads.filter(
    (thread) =>
      thread.type === "RequiredChange" && thread.status === "Addressed",
  ).length;
  const advisorRoleLabel = isResponsibleAdvisor
    ? "Chuyên gia chịu trách nhiệm"
    : "Chuyên gia hội đồng";

  const tabIndex = Math.max(
    0,
    WORKSPACE_STEPS.findIndex((step) => step.value === tab),
  );
  const nextActionLabel = canDecideLatest
    ? "Đối chiếu hồ sơ và hoàn tất quyết định"
    : addressedRequiredCount > 0
      ? `Xác minh ${addressedRequiredCount} nội dung Manager đã sửa`
      : workspace?.canAdvise
        ? "Đọc hồ sơ và gửi góp ý theo nội dung"
        : "Theo dõi tiến trình chương trình";

  return (
    <div className="flex flex-col gap-6">
      <ExpertWorkbenchHero
        eyebrow={
          workspace?.latestSubmission
            ? `Hồ sơ cố vấn · Lần nộp #${workspace.latestSubmission.submissionNumber}`
            : "Hồ sơ cố vấn chương trình"
        }
        title={program.name || "Chương trình chưa đặt tên"}
        description={`${program.code || "Chưa có mã"} · ${PROGRAM_STATUS_LABELS[program.status]} · ${advisorRoleLabel} · Khung v${workspace?.frameworkVersionNumber ?? "—"} · ${nextActionLabel}`}
        icon={ShieldCheck}
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/expert/programs" />}
            variant="outline"
            className="h-10 gap-2 rounded-xl border-border px-4 font-semibold"
          >
            <ArrowLeft className="size-4" />
            Hàng đợi cố vấn
          </Button>
        }
      >
        <ExpertWorkflowRail
          animate
          onStepSelect={(index) => {
            const next = WORKSPACE_STEPS[index];
            if (next) setParams({ tab: next.value, thread: null });
          }}
          steps={WORKSPACE_STEPS.map((step, index) => ({
            label: step.label,
            detail: step.detail,
            state:
              index < tabIndex ? "done" : index === tabIndex ? "current" : "next",
            badge:
              step.value === "content" && workspace?.hasUnreadFeedback ? (
                <span className="size-2 rounded-full bg-primary" />
              ) : undefined,
          }))}
        />
      </ExpertWorkbenchHero>

      <div className="mx-auto w-full max-w-[1500px] px-4 pb-12 sm:px-6">
        <Tabs
          value={tab}
          onValueChange={(value) =>
            setParams({ tab: value as WorkspaceTab, thread: null })
          }
        >
          <TabsContent value="overview" className="mt-0">
            <OverviewTab
              program={program}
              workspace={workspace}
              frameworkCheck={frameworkCheck}
              isCheckLoading={isCheckLoading}
              openRequiredChanges={openRequiredChanges}
              openSuggestions={openSuggestions}
              feedbackCounts={feedbackCounts}
              onOpenThread={(id) => setParams({ tab: "content", thread: id })}
            />
          </TabsContent>

          <TabsContent value="content" className="mt-0">
            <AdvisoryCurriculumBoard
              board={board}
              programId={program.id}
              pinSummaries={pinSummaries}
              selectedThread={selectedThread}
              frameworkCheck={frameworkCheck}
              isFrameworkCheckLoading={isCheckLoading}
              isLoading={isBoardLoading && activeSubmissionId != null}
              canAdvise={workspace?.canAdvise ?? false}
              canCreateRequiredChange={isResponsibleAdvisor}
              isAdvisor={isResponsibleAdvisor}
              isCreating={isCreatingThread}
              onCreateThread={handleCreateThread}
              onOpenThread={(id) => setParams({ tab: "content", thread: id })}
              onCloseThread={() => setParams({ thread: null })}
              onThreadUpdated={refreshAdvisorySurfaces}
            />
          </TabsContent>

          <TabsContent value="assessment" className="mt-0">
            {isSubmissionLoading ? (
              <Skeleton className="h-64 w-full rounded-2xl" />
            ) : activeSubmissionId && workspace?.latestSubmission ? (
              <section className="rounded-2xl border border-border bg-card p-6 shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
                <header className="mb-5 flex flex-wrap items-center gap-2">
                  <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
                    <ListChecks className="size-4 text-primary" />
                    Thẩm định lần {workspace.latestSubmission.submissionNumber}
                  </h2>
                  <Badge variant="outline" className="rounded-md text-[11px]">
                    {REVIEW_SUBMISSION_STATUS_LABELS[workspace.latestSubmission.status]}
                  </Badge>
                </header>
                <ReviewAssessmentPanel
                  key={activeSubmissionId}
                  programId={program.id}
                  programName={program.name}
                  submissionId={activeSubmissionId}
                  submissionStatus={workspace.latestSubmission.status}
                  concurrencyVersion={workspace.latestSubmission.concurrencyVersion}
                  criteria={rubricCriteria}
                  canDecide={canDecideLatest}
                  blockingChangeCount={
                    openRequiredChanges.length + addressedRequiredCount
                  }
                  onDecisionComplete={() => {
                    retryWorkspace();
                    retryThreads();
                  }}
                />
              </section>
            ) : (
              <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                Chương trình chưa có lần nộp thẩm định.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function OverviewTab({
  program,
  workspace,
  frameworkCheck,
  isCheckLoading,
  openRequiredChanges,
  openSuggestions,
  feedbackCounts,
  onOpenThread,
}: {
  program: ProgramWithModules;
  workspace: ProgramAdvisoryWorkspace | null;
  frameworkCheck: FrameworkCheck | null;
  isCheckLoading: boolean;
  openRequiredChanges: { id: string; targetLabel: string }[];
  openSuggestions: { id: string; targetLabel: string }[];
  feedbackCounts?: {
    openRequiredChanges: number;
    openSuggestions: number;
  };
  onOpenThread?: (threadId: string) => void;
}) {
  const openFeedbackItems = [
    ...openRequiredChanges.map((thread) => ({
      ...thread,
      kind: "required" as const,
    })),
    ...openSuggestions.map((thread) => ({
      ...thread,
      kind: "suggestion" as const,
    })),
  ];
  const suggestionCount =
    feedbackCounts?.openSuggestions ?? openSuggestions.length;
  const requiredCount =
    feedbackCounts?.openRequiredChanges ?? openRequiredChanges.length;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
        <h2 className="font-heading text-sm font-bold text-foreground">Mục tiêu & kết quả</h2>
        <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
          {program.description || "Chưa có mô tả chương trình."}
        </p>
        {program.skillsGained ? (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Kỹ năng đạt được
            </p>
            <p className="mt-1 text-sm text-foreground">{program.skillsGained}</p>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
        <h2 className="font-heading text-sm font-bold text-foreground">Thông tin thẩm định</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Trạng thái</dt>
            <dd className="font-medium text-foreground">
              {PROGRAM_STATUS_LABELS[program.status]}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Chuyên gia phụ trách</dt>
            <dd className="font-medium text-foreground">
              {workspace?.advisorName || "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Phiên bản khung</dt>
            <dd className="font-mono font-medium text-foreground">
              {workspace?.frameworkVersionNumber != null
                ? `v${workspace.frameworkVersionNumber}`
                : "—"}
            </dd>
          </div>
          {workspace?.latestSubmission ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Lần nộp gần nhất</dt>
              <dd className="font-medium text-foreground">
                #{workspace.latestSubmission.submissionNumber} ·{" "}
                {REVIEW_SUBMISSION_STATUS_LABELS[workspace.latestSubmission.status]}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      <div className="grid gap-6 lg:col-span-2 lg:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
          <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
            <LayoutGrid className="size-4 text-primary" />
            Kiểm tra khung chương trình
          </h2>
          {isCheckLoading ? (
            <Skeleton className="mt-4 h-24 w-full rounded-xl" />
          ) : frameworkCheck ? (
            <FrameworkCheckPanel check={frameworkCheck} />
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Không có dữ liệu kiểm tra.</p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="font-heading text-2xl font-bold tabular-nums leading-none text-[#4FC3F7]">
                {suggestionCount}
              </p>
              <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
                Góp ý mở
              </p>
            </div>
            <div>
              <p
                className={cn(
                  "font-heading text-2xl font-bold tabular-nums leading-none",
                  requiredCount > 0 ? "text-primary" : "text-foreground",
                )}
              >
                {requiredCount}
              </p>
              <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
                Yêu cầu chỉnh sửa
              </p>
            </div>
          </div>

          {openFeedbackItems.length > 0 ? (
            <ul className="mt-4 space-y-2.5 border-t border-border pt-3">
              {openFeedbackItems.map((thread) => {
                const isRequired = thread.kind === "required";
                return (
                  <li key={thread.id}>
                    <button
                      type="button"
                      onClick={() => onOpenThread?.(thread.id)}
                      className="flex w-full items-start gap-2.5 text-left"
                    >
                      <span
                        className={cn(
                          "mt-1.5 size-2 shrink-0 rounded-full",
                          isRequired ? "bg-primary" : "bg-[#4FC3F7]",
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "text-[10px] font-semibold uppercase tracking-wide",
                            isRequired ? "text-primary" : "text-[#4FC3F7]",
                          )}
                        >
                          {isRequired ? "Yêu cầu" : "Góp ý"}
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-foreground underline-offset-2 hover:underline">
                          {thread.targetLabel}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
              Chưa có góp ý hoặc yêu cầu chỉnh sửa đang mở.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
