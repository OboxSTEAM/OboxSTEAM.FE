"use client";

import { useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";

import { AdvisoryCreateThreadForm } from "@/components/advisory/advisory-create-thread-form";
import { AdvisoryThreadList } from "@/components/advisory/advisory-thread-list";
import { AdvisoryThreadPanel } from "@/components/advisory/advisory-thread-panel";
import { Button } from "@/components/ui/button";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  createAdvisoryThread,
  getAdvisoryThreads,
  type ProgramWithModules,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";

type ManagerAdvisoryPanelProps = {
  program: ProgramWithModules;
  submissionId?: string | null;
};

export function ManagerAdvisoryPanel({
  program,
  submissionId = null,
}: ManagerAdvisoryPanelProps) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { data, isLoading, retry } = useClientFetch({
    fetcher: () => getAdvisoryThreads(program.id),
    deps: [program.id],
    onError: (error) => showAppErrorFromUnknown(error, "expert.advisory.threads"),
  });

  const threads = data?.data ?? [];
  const selectedThread =
    threads.find((thread) => thread.id === selectedThreadId) ?? null;

  const targets = useMemo(
    () => [
      {
        targetType: "Program" as const,
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

  async function handleCreateThread(input: {
    targetType: Parameters<typeof createAdvisoryThread>[1]["targetType"];
    targetId: string | null;
    type: Parameters<typeof createAdvisoryThread>[1]["type"];
    message: string;
    submissionId?: string | null;
  }) {
    setIsCreating(true);
    try {
      const result = await createAdvisoryThread(program.id, input);
      showAppSuccess({ title: "Đã gửi góp ý" });
      setShowCreate(false);
      retry();
      if (result?.data?.id) setSelectedThreadId(result.data.id);
    } catch (error) {
      showAppErrorFromUnknown(error, "expert.advisory.threads");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/70 px-5 py-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-primary" />
          <div>
            <h2 className="font-heading text-base font-bold text-foreground">
              Trao đổi thẩm định
            </h2>
            <p className="text-xs text-muted-foreground">
              Trao đổi với chuyên gia phụ trách về curriculum và rubric.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowCreate((v) => !v)}
          className="h-9 rounded-lg text-xs font-semibold"
        >
          {showCreate ? "Đóng form" : "Góp ý mới"}
        </Button>
      </header>

      {showCreate ? (
        <div className="border-b border-border p-4">
          <AdvisoryCreateThreadForm
            targets={targets}
            canCreateRequiredChange={false}
            submissionId={submissionId}
            isSubmitting={isCreating}
            onSubmit={handleCreateThread}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      ) : null}

      <div className="grid min-h-[360px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <AdvisoryThreadList
          threads={threads}
          selectedThreadId={selectedThreadId}
          onSelect={setSelectedThreadId}
          isLoading={isLoading}
        />
        <div className="border-t border-border lg:border-t-0 lg:border-l">
          <AdvisoryThreadPanel
            programId={program.id}
            thread={selectedThread}
            isAdvisor={false}
            isManager={true}
            onThreadUpdated={retry}
          />
        </div>
      </div>
    </section>
  );
}
