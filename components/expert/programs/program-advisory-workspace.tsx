"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  LayoutGrid,
  ListChecks,
  MessageSquare,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import {
  AdvisoryCreateThreadForm,
  type AdvisoryThreadTarget,
} from "@/components/advisory/advisory-create-thread-form";
import {
  AdvisoryCurriculumNavigator,
  type CurriculumSelection,
} from "@/components/advisory/advisory-curriculum-navigator";
import { AdvisoryThreadList } from "@/components/advisory/advisory-thread-list";
import { AdvisoryThreadPanel } from "@/components/advisory/advisory-thread-panel";
import { ReviewAssessmentPanel } from "@/components/advisory/review-assessment-panel";
import {
  ExpertWorkbenchHero,
  ExpertWorkflowRail,
} from "@/components/expert/shared/expert-workbench";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  createAdvisoryThread,
  getAdvisoryThreads,
  getFrameworkVersion,
  getProgramAdvisoryWorkspace,
  getProgramFrameworkCheck,
  getReviewSubmission,
  recordAdvisoryRead,
  type AdvisoryThread,
  type FrameworkCheck,
  type ProgramAdvisoryWorkspace,
  type ProgramWithModules,
} from "@/lib/api";
import {
  parseCurriculumSnapshot,
  parseRubricSnapshot,
} from "@/lib/advisory/parse-snapshot";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import {
  REVIEW_SUBMISSION_STATUS_LABELS,
} from "@/lib/expert/advisory-labels";
import {
  MODULE_TYPE_LABELS,
  PROGRAM_STATUS_LABELS,
} from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

type WorkspaceTab = "overview" | "content" | "discussion" | "assessment";

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
    label: "Hồ sơ lần nộp",
    detail: "Đọc đúng snapshot và kiểm tra cấu trúc curriculum.",
  },
  {
    value: "discussion",
    label: "Trao đổi cố vấn",
    detail: "Góp ý đúng nội dung và theo dõi việc chỉnh sửa.",
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

function useWorkspaceParams() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tab = (searchParams.get("tab") as WorkspaceTab) || "overview";
  const threadId = searchParams.get("thread");
  const submissionId = searchParams.get("submission");
  const targetType = searchParams.get("targetType");
  const targetId = searchParams.get("targetId");

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

  return { tab, threadId, submissionId, targetType, targetId, setParams };
}

export function ProgramAdvisoryWorkspace({ program }: ProgramAdvisoryWorkspaceProps) {
  const { tab, threadId, submissionId, targetType, targetId, setParams } =
    useWorkspaceParams();
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [createTarget, setCreateTarget] = useState<CurriculumSelection | null>(
    null,
  );
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [mobileContentOpen, setMobileContentOpen] = useState(false);
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

  const { data: threadsData, isLoading: isThreadsLoading, retry: retryThreads } =
    useClientFetch({
      fetcher: () => getAdvisoryThreads(program.id),
      deps: [program.id],
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
    if (tab !== "discussion") return;
    void recordAdvisoryRead(program.id).catch(() => undefined);
  }, [program.id, tab]);

  const snapshotModules = useMemo(() => {
    if (submission?.curriculumSnapshotJson) {
      const parsed = parseCurriculumSnapshot(submission.curriculumSnapshotJson);
      return parsed ?? [];
    }
    return program.modules;
  }, [submission, program.modules]);

  const isViewingSnapshot =
    submission != null && submission.curriculumSnapshotJson != null;
  const snapshotUnavailable =
    submission != null &&
    submission.curriculumSnapshotJson == null &&
    activeSubmissionId != null;
  const snapshotUnreadable =
    submission?.curriculumSnapshotJson != null &&
    parseCurriculumSnapshot(submission.curriculumSnapshotJson) == null;

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

  const threads = threadsData?.data ?? [];
  const selectedThread =
    threads.find((t) => t.id === threadId) ?? null;

  const threadTargets: AdvisoryThreadTarget[] = useMemo(
    () => [
      {
        targetType: "Program",
        targetId: program.id,
        targetLabel: program.name || "Chương trình",
      },
      ...program.modules.flatMap((mod) => [
        {
          targetType: "Module" as const,
          targetId: mod.id,
          targetLabel: mod.name,
          targetContext: `Học phần ${mod.moduleOrder}`,
        },
        ...(mod.courses ?? []).map((course) => ({
          targetType: "Course" as const,
          targetId: course.id,
          targetLabel: course.name,
          targetContext: mod.name,
        })),
      ]),
    ],
    [program],
  );

  const curriculumSelection: CurriculumSelection | null = (() => {
    if (targetType === "Module" && targetId) {
      const mod = snapshotModules.find((m) => m.id === targetId);
      if (mod) {
        return {
          targetType: "Module" as const,
          targetId: mod.id,
          label: mod.name,
          context: `Học phần ${mod.moduleOrder}`,
          module: mod,
        };
      }
    }
    if (targetType === "Course" && targetId) {
      for (const mod of snapshotModules) {
        const course = (mod.courses ?? []).find((c) => c.id === targetId);
        if (course) {
          return {
            targetType: "Course" as const,
            targetId: course.id,
            label: course.name,
            context: mod.name,
            module: mod,
            course,
          };
        }
      }
    }
    return null;
  })();

  const openRequiredChanges = threads.filter(
    (t) => t.type === "RequiredChange" && t.status === "Open",
  );

  async function handleCreateThread(input: Parameters<typeof createAdvisoryThread>[1]) {
    setIsCreatingThread(true);
    try {
      const result = await createAdvisoryThread(program.id, input);
      showAppSuccess({ title: "Đã gửi góp ý" });
      setShowCreateThread(false);
      setCreateTarget(null);
      retryThreads();
      if (result?.data?.id) {
        setParams({ tab: "discussion", thread: result.data.id });
      }
    } catch (error) {
      showAppErrorFromUnknown(error, "programs.advisory");
    } finally {
      setIsCreatingThread(false);
    }
  }

  function handleCurriculumSelect(selection: CurriculumSelection) {
    setParams({
      tab: "content",
      targetType: selection.targetType,
      targetId: selection.targetId,
    });
  }

  function handleFeedbackRequest(selection: CurriculumSelection) {
    setCreateTarget(selection);
    setShowCreateThread(true);
    setParams({ tab: "discussion" });
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
            if (next) setParams({ tab: next.value });
          }}
          steps={WORKSPACE_STEPS.map((step, index) => ({
            label: step.label,
            detail: step.detail,
            state:
              index < tabIndex ? "done" : index === tabIndex ? "current" : "next",
            badge:
              step.value === "discussion" && workspace?.hasUnreadFeedback ? (
                <span className="size-2 rounded-full bg-primary" />
              ) : undefined,
          }))}
        />
      </ExpertWorkbenchHero>

      <div className="mx-auto w-full max-w-[1500px] px-4 pb-12 sm:px-6">
        <Tabs
          value={tab}
          onValueChange={(value) => setParams({ tab: value as WorkspaceTab })}
        >
          <TabsContent value="overview" className="mt-0">
            <OverviewTab
              program={program}
              workspace={workspace}
              frameworkCheck={frameworkCheck}
              isCheckLoading={isCheckLoading}
              openRequiredChanges={openRequiredChanges}
              feedbackCounts={feedbackCounts}
            />
          </TabsContent>

          <TabsContent value="content" className="mt-0">
            <ContentTab
              modules={snapshotModules}
              selection={curriculumSelection}
              isSnapshot={isViewingSnapshot}
              snapshotUnavailable={snapshotUnavailable}
              snapshotUnreadable={snapshotUnreadable}
              onSelect={handleCurriculumSelect}
              onFeedback={workspace?.canAdvise ? handleFeedbackRequest : undefined}
              onMobileOpen={() => setMobileContentOpen(true)}
            />
          </TabsContent>

          <TabsContent value="discussion" className="mt-0">
            <DiscussionTab
              programId={program.id}
              threads={threads}
              isLoading={isThreadsLoading}
              selectedThreadId={threadId}
              selectedThread={selectedThread}
              canAdvise={workspace?.canAdvise ?? false}
              isResponsibleAdvisor={isResponsibleAdvisor}
              showCreate={showCreateThread}
              createTarget={createTarget}
              targets={threadTargets}
              submissionId={activeSubmissionId}
              isCreating={isCreatingThread}
              onSelectThread={(id) => setParams({ thread: id })}
              onToggleCreate={() => setShowCreateThread((v) => !v)}
              onCreate={handleCreateThread}
              onThreadUpdated={retryThreads}
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

      <Sheet open={mobileContentOpen} onOpenChange={setMobileContentOpen}>
        <SheetPopup side="right" className="flex h-[80vh] w-full flex-col rounded-t-2xl p-0 sm:max-w-lg">
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle>Nội dung chi tiết</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <CurriculumReadingPane selection={curriculumSelection} />
          </SheetBody>
        </SheetPopup>
      </Sheet>
    </div>
  );
}

function OverviewTab({
  program,
  workspace,
  frameworkCheck,
  isCheckLoading,
  openRequiredChanges,
  feedbackCounts,
}: {
  program: ProgramWithModules;
  workspace: ProgramAdvisoryWorkspace | null;
  frameworkCheck: FrameworkCheck | null;
  isCheckLoading: boolean;
  openRequiredChanges: { id: string; targetLabel: string }[];
  feedbackCounts?: {
    openRequiredChanges: number;
    openSuggestions: number;
  };
}) {
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

        {feedbackCounts ? (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
            <Badge variant="secondary" className="rounded-md text-[11px]">
              {feedbackCounts.openSuggestions} góp ý mở
            </Badge>
            <Badge
              className={cn(
                "rounded-md text-[11px]",
                feedbackCounts.openRequiredChanges > 0
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-foreground",
              )}
            >
              {feedbackCounts.openRequiredChanges} yêu cầu chỉnh sửa
            </Badge>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-[0_4px_18px_rgba(45,45,45,0.04)] lg:col-span-2">
        <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
          <LayoutGrid className="size-4 text-primary" />
          Kiểm tra khung chương trình
        </h2>
        {isCheckLoading ? (
          <Skeleton className="mt-4 h-24 w-full rounded-xl" />
        ) : frameworkCheck ? (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              {frameworkCheck.allPassed ? (
                <CheckCircle2 className="size-4 text-[#7CB342]" />
              ) : (
                <XCircle className="size-4 text-primary" />
              )}
              <span className="text-sm font-medium text-foreground">
                {frameworkCheck.allPassed
                  ? "Đáp ứng yêu cầu khung"
                  : "Còn mục chưa đáp ứng"}
              </span>
            </div>
            <ul className="space-y-2">
              {frameworkCheck.checks.map((check, index) => (
                <li
                  key={`${check.code}-${index}`}
                  className="flex items-start gap-2 rounded-xl border border-border bg-background/50 px-3 py-2 text-xs"
                >
                  {check.passed ? (
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#7CB342]" />
                  ) : (
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {check.label || check.code}
                    </p>
                    <p className="text-muted-foreground">
                      Yêu cầu: {check.expected || "—"} · Thực tế: {check.actual || "—"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Không có dữ liệu kiểm tra.</p>
        )}
      </section>

      {openRequiredChanges.length > 0 ? (
        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6 lg:col-span-2">
          <h2 className="text-sm font-bold text-primary">Yêu cầu chỉnh sửa đang mở</h2>
          <ul className="mt-3 space-y-1">
            {openRequiredChanges.map((thread) => (
              <li key={thread.id} className="text-sm text-foreground">
                · {thread.targetLabel}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function ContentTab({
  modules,
  selection,
  isSnapshot,
  snapshotUnavailable,
  snapshotUnreadable,
  onSelect,
  onFeedback,
  onMobileOpen,
}: {
  modules: ProgramWithModules["modules"];
  selection: CurriculumSelection | null;
  isSnapshot: boolean;
  snapshotUnavailable: boolean;
  snapshotUnreadable: boolean;
  onSelect: (s: CurriculumSelection) => void;
  onFeedback?: (s: CurriculumSelection) => void;
  onMobileOpen: () => void;
}) {
  if (snapshotUnreadable) {
    return (
      <div className="rounded-2xl border border-primary/25 bg-primary/5 p-8 text-center">
        <AlertCircle className="mx-auto size-6 text-primary" />
        <p className="mt-3 font-semibold text-foreground">
          Không thể đọc hồ sơ lần nộp này
        </p>
        <p className="mx-auto mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
          Dữ liệu chương trình hiện tại không được dùng thay cho ảnh chụp thẩm định,
          để tránh đưa ra nhận định trên sai phiên bản.
        </p>
      </div>
    );
  }

  if (snapshotUnavailable) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Ảnh chụp curriculum không khả dụng cho lần nộp legacy này.
      </p>
    );
  }

  return (
    <>
      <div className="hidden min-h-[520px] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_18px_rgba(45,45,45,0.04)] lg:grid lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <AdvisoryCurriculumNavigator
          modules={modules}
          selected={selection}
          onSelect={onSelect}
          onFeedback={onFeedback}
          isSnapshot={isSnapshot}
          showFeedbackAction={onFeedback != null}
          className="border-r border-border"
        />
        <CurriculumReadingPane selection={selection} />
      </div>

      <div className="lg:hidden">
        <AdvisoryCurriculumNavigator
          modules={modules}
          selected={selection}
          onSelect={(s) => {
            onSelect(s);
            onMobileOpen();
          }}
          isSnapshot={isSnapshot}
          showFeedbackAction={false}
        />
      </div>
    </>
  );
}

function CurriculumReadingPane({
  selection,
}: {
  selection: CurriculumSelection | null;
}) {
  if (!selection) {
    return (
      <p className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
        Chọn học phần hoặc khóa học để xem chi tiết.
      </p>
    );
  }

  if (selection.targetType === "Course" && selection.course) {
    const course = selection.course;
    return (
      <div className="overflow-y-auto p-6">
        <h3 className="font-heading text-lg font-bold text-foreground">{course.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{selection.context}</p>
        {course.description ? (
          <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">
            {course.description}
          </p>
        ) : null}
        {(course.activities ?? []).length > 0 ? (
          <ul className="mt-4 space-y-2">
            {course.activities.map((activity) => (
              <li
                key={activity.id}
                className="rounded-lg border border-border px-3 py-2 text-sm text-foreground"
              >
                {activity.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-xs italic text-muted-foreground">Chưa có hoạt động.</p>
        )}
      </div>
    );
  }

  if (selection.module) {
    const mod = selection.module;
    return (
      <div className="overflow-y-auto p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-heading text-lg font-bold text-foreground">{mod.name}</h3>
          <Badge variant="outline" className="rounded-md text-[10px]">
            {MODULE_TYPE_LABELS[mod.moduleType]}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{selection.context}</p>
        {mod.learningOutcomes?.length ? (
          <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
            {mod.learningOutcomes.map((outcome) => (
              <li key={outcome}>· {outcome}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  return null;
}

function DiscussionTab({
  programId,
  threads,
  isLoading,
  selectedThreadId,
  selectedThread,
  canAdvise,
  isResponsibleAdvisor,
  showCreate,
  createTarget,
  targets,
  submissionId,
  isCreating,
  onSelectThread,
  onToggleCreate,
  onCreate,
  onThreadUpdated,
}: {
  programId: string;
  threads: AdvisoryThread[];
  isLoading: boolean;
  selectedThreadId: string | null;
  selectedThread: AdvisoryThread | null;
  canAdvise: boolean;
  isResponsibleAdvisor: boolean;
  showCreate: boolean;
  createTarget: CurriculumSelection | null;
  targets: AdvisoryThreadTarget[];
  submissionId: string | null;
  isCreating: boolean;
  onSelectThread: (id: string) => void;
  onToggleCreate: () => void;
  onCreate: (input: Parameters<typeof createAdvisoryThread>[1]) => Promise<void>;
  onThreadUpdated: () => void;
}) {
  const defaultTarget = createTarget
    ? {
        targetType: createTarget.targetType,
        targetId: createTarget.targetId,
        targetLabel: createTarget.label,
        targetContext: createTarget.context,
      }
    : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-start gap-2">
          <MessageSquare className="mt-0.5 size-4 text-primary" />
          <div>
            <h2 className="font-heading text-sm font-bold text-foreground">Trao đổi theo nội dung</h2>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              Đề xuất là hướng dẫn chuyên môn; yêu cầu bắt buộc cần được xác minh trước khi phê duyệt.
            </p>
          </div>
        </div>
        {canAdvise ? (
          <Button
            type="button"
            variant="outline"
            onClick={onToggleCreate}
            className="h-9 rounded-lg text-xs font-semibold"
          >
            {showCreate ? "Đóng" : "Góp ý mới"}
          </Button>
        ) : null}
      </header>

      {showCreate ? (
        <div className="border-b border-border p-4">
          <AdvisoryCreateThreadForm
            targets={targets}
            defaultTarget={defaultTarget}
            canCreateRequiredChange={isResponsibleAdvisor}
            submissionId={submissionId}
            isSubmitting={isCreating}
            onSubmit={onCreate}
            onCancel={onToggleCreate}
          />
        </div>
      ) : null}

      <div className="grid min-h-[480px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <AdvisoryThreadList
          threads={threads}
          selectedThreadId={selectedThreadId}
          onSelect={onSelectThread}
          isLoading={isLoading}
        />
        <div className="border-t border-border lg:border-t-0 lg:border-l">
          <AdvisoryThreadPanel
            programId={programId}
            thread={selectedThread}
            isAdvisor={isResponsibleAdvisor}
            isManager={false}
            onThreadUpdated={onThreadUpdated}
          />
        </div>
      </div>
    </div>
  );
}
