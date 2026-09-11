"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  ClipboardList,
  FileText,
  Flag,
  Layers,
  MessageSquarePlus,
} from "lucide-react";

import { AdvisoryThreadPanel } from "@/components/advisory/advisory-thread-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type {
  AdvisoryBoard,
  AdvisoryTargetType,
  AdvisoryThread,
  AdvisoryThreadPinSummary,
  AdvisoryThreadType,
  CreateAdvisoryThreadInput,
  SubmissionChangeItem,
} from "@/lib/api";
import {
  buildBoardTree,
  buildFieldChangesForTarget,
  frameworkFailKeys,
  pinSummaryKey,
  type BoardChangeKind,
  type BoardTreeNode,
} from "@/lib/advisory/board-tree";
import {
  ADVISORY_THREAD_TYPE_LABELS,
  ADVISORY_THREAD_STATUS_LABELS,
  CHANGE_KIND_LABELS,
} from "@/lib/expert/advisory-labels";
import {
  openMaterialSignedPreview,
  pickMaterialPreviewUrl,
} from "@/lib/curriculum/material-preview";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { MODULE_TYPE_LABELS } from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

export type AdvisoryBoardSelection = {
  targetType: AdvisoryTargetType;
  targetId: string;
  label: string;
  context?: string;
  anchorField?: string | null;
};

type AdvisoryCurriculumBoardProps = {
  board: AdvisoryBoard | null;
  programId: string;
  pinSummaries?: AdvisoryThreadPinSummary[];
  selectedThread?: AdvisoryThread | null;
  isLoading?: boolean;
  canAdvise?: boolean;
  canCreateRequiredChange?: boolean;
  isAdvisor?: boolean;
  isCreating?: boolean;
  onCreateThread?: (input: CreateAdvisoryThreadInput) => Promise<void>;
  onOpenThread?: (threadId: string) => void;
  onCloseThread?: () => void;
  onThreadUpdated?: () => void;
  className?: string;
};

const CHANGE_EDGE: Record<BoardChangeKind, string> = {
  added: "border-l-steam-engineering",
  removed: "border-l-primary",
  modified: "border-l-steam-technology",
  reordered: "border-l-steam-science",
};

function MaterialPreviewLink({
  activityId,
  material,
}: {
  activityId: string;
  material: {
    url?: string | null;
    fileUrl?: string | null;
  };
}) {
  const [isOpening, setIsOpening] = useState(false);
  const snapshotUrl = pickMaterialPreviewUrl(material);

  async function handleOpen() {
    setIsOpening(true);
    try {
      await openMaterialSignedPreview({
        activityId,
        fallbackUrl: snapshotUrl,
      });
    } catch (error) {
      showAppErrorFromUnknown(error, "curriculum.material.preview");
    } finally {
      setIsOpening(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="mt-2 h-8 rounded-lg text-xs font-semibold text-steam-technology"
      disabled={isOpening}
      onClick={() => void handleOpen()}
    >
      {isOpening ? "Đang mở…" : "Mở tài liệu (xem trước ký số)"}
    </Button>
  );
}

function moduleTypeLabel(value: string | null | undefined): string {
  if (!value) return "Học phần";
  return (
    MODULE_TYPE_LABELS[value as keyof typeof MODULE_TYPE_LABELS] ?? value
  );
}

function KindIcon({ kind }: { kind: BoardTreeNode["kind"] }) {
  const className = "size-3.5 shrink-0 text-muted-foreground";
  switch (kind) {
    case "module":
      return <Layers className={cn(className, "text-primary")} />;
    case "course":
      return <BookOpen className={className} />;
    case "activity":
      return <FileText className={className} />;
    case "assignment":
      return <ClipboardList className={className} />;
    case "milestone":
      return <Flag className={className} />;
  }
}

function PinCountBadge({
  summary,
}: {
  summary: AdvisoryThreadPinSummary | undefined;
}) {
  if (!summary || summary.total === 0) return null;
  return (
    <span
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums",
        summary.openRequired > 0
          ? "bg-primary/15 text-primary"
          : "bg-muted text-muted-foreground",
      )}
    >
      {summary.total}
    </span>
  );
}

function ChangeChip({ kind }: { kind: BoardChangeKind }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide",
        kind === "added" && "border-steam-engineering/40 text-steam-engineering",
        kind === "removed" && "border-primary/40 text-primary",
        kind === "modified" && "border-steam-technology/40 text-steam-technology",
        kind === "reordered" && "border-steam-science/40 text-steam-science",
      )}
    >
      {CHANGE_KIND_LABELS[kind]}
    </Badge>
  );
}

function DiffStatsBar({
  added,
  removed,
  modified,
}: {
  added: number;
  removed: number;
  modified: number;
  reordered?: number;
}) {
  return (
    <p
      className="flex items-center gap-1.5 text-sm font-semibold tabular-nums sm:text-base"
      aria-label="Tóm tắt thay đổi so với lần nộp trước"
    >
      <span className="text-[#1a7f37] dark:text-[#3fb950]">+{added}</span>
      <span className="font-normal text-muted-foreground">/</span>
      <span className="text-[#cf222e] dark:text-[#ff7b72]">−{removed}</span>
      <span className="font-normal text-muted-foreground">/</span>
      <span className="text-[#9a6700] dark:text-[#d29922]">~{modified}</span>
    </p>
  );
}

function FieldChangeCards({ items }: { items: SubmissionChangeItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Thay đổi trường · so với lần nộp trước
      </p>
      {items.map((item) => (
        <div
          key={`${item.field}-${item.detail}`}
          className="overflow-hidden rounded-xl border border-border"
        >
          <div className="border-b border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground">
            {item.field || "Nội dung"}
          </div>
          <div className="grid gap-0 sm:grid-cols-2">
            <div className="border-b border-border p-3 sm:border-b-0 sm:border-r">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Trước
              </p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {item.before?.trim() || "—"}
              </p>
            </div>
            <div className="border-l-2 border-l-steam-engineering p-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sau
              </p>
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {item.after?.trim() || item.detail?.trim() || "—"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function NodeDetail({
  node,
  fieldChanges,
  showChanges,
}: {
  node: BoardTreeNode;
  fieldChanges: SubmissionChangeItem[];
  showChanges: boolean;
}) {
  const activity = node.activity;
  const material = activity?.material;
  const assignment = node.assignment;
  const milestone = node.milestone;
  const course = node.course;
  const mod = node.module;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <KindIcon kind={node.kind} />
          <h3 className="font-heading text-lg font-bold text-foreground">
            {node.label}
          </h3>
          {showChanges && node.change ? <ChangeChip kind={node.change} /> : null}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{node.meta}</p>

        {node.kind === "module" ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              {moduleTypeLabel(mod.moduleType || mod.type)}
              {mod.prerequisiteModuleId
                ? " · có học phần tiên quyết"
                : " · không tiên quyết"}
            </p>
            {mod.learningOutcomes.length > 0 ? (
              <ul className="space-y-1 text-sm text-foreground">
                {mod.learningOutcomes.map((outcome) => (
                  <li key={outcome}>· {outcome}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm italic text-muted-foreground">
                Chưa có learning outcomes.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {mod.courses.length} khóa · {mod.assignments.length} bài tập ·{" "}
              {mod.milestones.length} mốc
            </p>
          </div>
        ) : null}

        {node.kind === "course" && course ? (
          <div className="mt-4 space-y-3">
            {course.description ? (
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {course.description}
              </p>
            ) : (
              <p className="text-sm italic text-muted-foreground">Chưa có mô tả.</p>
            )}
          </div>
        ) : null}

        {node.kind === "activity" && activity ? (
          <div className="mt-4 space-y-3">
            {activity.description ? (
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {activity.description}
              </p>
            ) : null}
            {material ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tài liệu
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {material.title || material.fileName || "Tài liệu"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[material.materialType || material.type, material.fileName]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <MaterialPreviewLink
                  activityId={activity.id}
                  material={material}
                />
              </div>
            ) : (
              <p className="text-sm italic text-muted-foreground">
                Chưa gắn tài liệu.
              </p>
            )}
          </div>
        ) : null}

        {node.kind === "assignment" && assignment ? (
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            {assignment.description ? (
              <p className="whitespace-pre-line text-foreground">
                {assignment.description}
              </p>
            ) : null}
            <p>
              Loại: {assignment.assignmentType || "—"} · Điểm tối đa{" "}
              {assignment.maxPoints} · Đạt ≥ {assignment.passScore}
            </p>
            <p>
              Số lần làm: {assignment.maxAttempts}
              {assignment.dueAt ? ` · Hạn ${assignment.dueAt}` : ""}
            </p>
          </div>
        ) : null}

        {node.kind === "milestone" && milestone ? (
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            {milestone.description ? (
              <p className="whitespace-pre-line text-foreground">
                {milestone.description}
              </p>
            ) : null}
            <p>{milestone.isCapstone ? "Capstone" : "Milestone thường"}</p>
            {milestone.assignment ? (
              <p>Assignment: {milestone.assignment.title || milestone.assignmentId}</p>
            ) : null}
          </div>
        ) : null}

        {node.change === "removed" ? (
          <div className="mt-4 rounded-xl border border-primary/25 bg-primary/5 p-3 text-sm text-foreground">
            Mục này đã bị gỡ khỏi lần nộp hiện tại.
          </div>
        ) : null}

        {node.change === "added" ? (
          <div className="mt-4 rounded-xl border border-steam-engineering/30 bg-steam-engineering/5 p-3 text-sm text-foreground">
            Mục mới trong lần nộp này.
          </div>
        ) : null}

        {showChanges ? <FieldChangeCards items={fieldChanges} /> : null}
      </div>
    </div>
  );
}

function InlineComposer({
  selection,
  canCreateRequiredChange,
  isCreating,
  onSubmit,
  onCancel,
}: {
  selection: AdvisoryBoardSelection;
  canCreateRequiredChange: boolean;
  isCreating: boolean;
  onSubmit: (input: CreateAdvisoryThreadInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [message, setMessage] = useState("");
  const [threadType, setThreadType] = useState<AdvisoryThreadType>("Suggestion");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const trimmed = message.trim();
    if (!trimmed) {
      setError("Vui lòng nhập nội dung góp ý.");
      return;
    }
    setError(null);
    await onSubmit({
      targetType: selection.targetType,
      targetId: selection.targetId,
      type: threadType,
      message: trimmed,
      anchorKind: selection.anchorField ? "Field" : "Node",
      anchorField: selection.anchorField ?? null,
    });
    setMessage("");
  }

  return (
    <div className="space-y-3 border-t border-border bg-muted/20 p-4">
      <div className="flex items-center gap-2">
        <MessageSquarePlus className="size-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">
          Góp ý · {selection.label}
        </p>
      </div>
      {selection.anchorField ? (
        <p className="text-xs text-muted-foreground">
          Neo trường: {selection.anchorField}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={threadType === "Suggestion" ? "default" : "outline"}
          className="h-8 rounded-lg text-xs"
          onClick={() => setThreadType("Suggestion")}
        >
          Góp ý
        </Button>
        {canCreateRequiredChange ? (
          <Button
            type="button"
            size="sm"
            variant={threadType === "RequiredChange" ? "default" : "outline"}
            className="h-8 rounded-lg text-xs"
            onClick={() => setThreadType("RequiredChange")}
          >
            Yêu cầu chỉnh sửa
          </Button>
        ) : null}
      </div>
      <Textarea
        rows={3}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Mô tả góp ý cụ thể…"
        disabled={isCreating}
        className="rounded-xl border-input bg-background"
      />
      {error ? <p className="text-xs font-medium text-primary">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="h-9 rounded-xl bg-primary px-4 font-semibold text-white"
          disabled={isCreating}
          onClick={() => void handleSubmit()}
        >
          {isCreating ? "Đang gửi…" : "Gửi góp ý"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-xl"
          disabled={isCreating}
          onClick={onCancel}
        >
          Hủy
        </Button>
      </div>
    </div>
  );
}

export function AdvisoryCurriculumBoard({
  board,
  programId,
  pinSummaries = [],
  selectedThread = null,
  isLoading = false,
  canAdvise = false,
  canCreateRequiredChange = false,
  isAdvisor = false,
  isCreating = false,
  onCreateThread,
  onOpenThread,
  onCloseThread,
  onThreadUpdated,
  className,
}: AdvisoryCurriculumBoardProps) {
  const [showChanges, setShowChanges] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [composer, setComposer] = useState<AdvisoryBoardSelection | null>(null);

  const tree = useMemo(
    () => (board ? buildBoardTree(board, { includeRemovedGhosts: showChanges }) : []),
    [board, showChanges],
  );

  useEffect(() => {
    if (!selectedThread?.targetId) return;
    const match = tree.find(
      (node) =>
        node.targetType === selectedThread.targetType &&
        node.targetId === selectedThread.targetId,
    );
    if (match) setSelectedKey(match.key);
  }, [selectedThread, tree]);

  const pinMap = useMemo(() => {
    const map = new Map<string, AdvisoryThreadPinSummary>();
    for (const summary of pinSummaries) {
      map.set(pinSummaryKey(summary.targetType, summary.targetId), summary);
    }
    return map;
  }, [pinSummaries]);

  const failKeys = useMemo(
    () => frameworkFailKeys(board?.frameworkHighlights ?? []),
    [board?.frameworkHighlights],
  );

  const selected =
    tree.find((node) => node.key === selectedKey) ?? tree[0] ?? null;

  const fieldChanges = useMemo(() => {
    if (!board || !selected || !showChanges) return [];
    return buildFieldChangesForTarget(
      board.changeSummary,
      selected.targetType,
      selected.targetId,
    );
  }, [board, selected, showChanges]);

  const nodePins = useMemo(() => {
    if (!board || !selected) return [];
    return board.threadPins.filter(
      (pin) =>
        pin.targetType === selected.targetType &&
        pin.targetId === selected.targetId,
    );
  }, [board, selected]);

  const changeCounts = board?.changeSummary
    ? {
        added:
          board.changeSummary.addedCount ?? board.changeSummary.added.length,
        removed:
          board.changeSummary.removedCount ??
          board.changeSummary.removed.length,
        modified:
          board.changeSummary.modifiedCount ??
          board.changeSummary.modified.length,
      }
    : null;

  if (isLoading) {
    return (
      <div
        className={cn(
          "min-h-[520px] overflow-hidden rounded-2xl border border-border bg-card",
          className,
        )}
      >
        <Skeleton className="h-full min-h-[520px] w-full rounded-2xl" />
      </div>
    );
  }

  if (!board) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-border p-10 text-center",
          className,
        )}
      >
        <AlertCircle className="mx-auto size-6 text-muted-foreground" />
        <p className="mt-3 text-sm font-semibold text-foreground">
          Chưa có bảng curriculum thẩm định
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Cần lần nộp review để mở board cố vấn.
        </p>
      </div>
    );
  }

  function openComposer(node: BoardTreeNode, anchorField?: string) {
    setSelectedKey(node.key);
    setComposer({
      targetType: node.targetType,
      targetId: node.targetId,
      label: node.label,
      context: node.meta,
      anchorField: anchorField ?? null,
    });
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_18px_rgba(45,45,45,0.04)]",
        className,
      )}
    >
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-foreground">
            Curriculum board
          </h3>
          <p className="text-xs text-muted-foreground">
            Ảnh chụp lần nộp · {board.curriculum.modules.length} học phần
            {board.previousSubmissionId
              ? " · có thể so với lần trước"
              : " · lần nộp đầu"}
          </p>
        </div>
        {board.previousSubmissionId ? (
          <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <span>Thay đổi</span>
            <Switch
              size="sm"
              checked={showChanges}
              onCheckedChange={setShowChanges}
              aria-label="Hiện thay đổi so với lần nộp trước"
            />
          </label>
        ) : null}
        {showChanges && changeCounts ? <DiffStatsBar {...changeCounts} /> : null}
      </header>

      <div className="hidden min-h-[560px] lg:grid lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)_minmax(260px,0.9fr)]">
        <nav
          className="flex flex-col overflow-hidden border-r border-border"
          aria-label="Cấu trúc curriculum"
        >
          <div className="flex-1 overflow-y-auto">
            {tree.map((node) => {
              const summary = pinMap.get(
                pinSummaryKey(node.targetType, node.targetId),
              );
              const isSelected = selected?.key === node.key;
              const hasFail = failKeys.has(node.key);
              return (
                <button
                  key={node.key}
                  type="button"
                  onClick={() => {
                    setSelectedKey(node.key);
                    setComposer(null);
                  }}
                  className={cn(
                    "flex w-full items-start gap-2 border-b border-border/60 border-l-[3px] py-2.5 pr-3 text-left transition-colors hover:bg-muted/40",
                    isSelected && "bg-primary/5",
                    showChanges && node.change
                      ? CHANGE_EDGE[node.change]
                      : "border-l-transparent",
                    node.change === "removed" && showChanges && "opacity-60",
                  )}
                  style={{ paddingLeft: 10 + node.depth * 14 }}
                >
                  <KindIcon kind={node.kind} />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-xs font-semibold text-foreground",
                        node.change === "removed" &&
                          showChanges &&
                          "line-through",
                      )}
                    >
                      {node.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                      {node.meta}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    {showChanges && node.change ? (
                      <ChangeChip kind={node.change} />
                    ) : null}
                    {hasFail ? (
                      <Badge
                        variant="outline"
                        className="rounded-md border-primary/40 px-1.5 py-0 text-[10px] text-primary"
                      >
                        Framework
                      </Badge>
                    ) : null}
                    <PinCountBadge summary={summary} />
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="border-r border-border">
          {selected ? (
            <NodeDetail
              node={selected}
              fieldChanges={fieldChanges}
              showChanges={showChanges}
            />
          ) : (
            <p className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
              Chọn một mục trong cây curriculum.
            </p>
          )}
        </div>

        <aside className="flex flex-col overflow-hidden bg-muted/10">
          {selectedThread ? (
            <>
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 rounded-lg px-2 text-xs"
                  onClick={() => onCloseThread?.()}
                >
                  <ArrowLeft className="size-3.5" />
                  Pins
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                <AdvisoryThreadPanel
                  programId={programId}
                  thread={selectedThread}
                  isAdvisor={isAdvisor}
                  isManager={false}
                  onThreadUpdated={onThreadUpdated}
                />
              </div>
            </>
          ) : (
            <>
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-bold text-foreground">Góp ý trên mục</p>
                <p className="text-xs text-muted-foreground">
                  Pin theo node · trả lời và xác minh ngay tại board
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {nodePins.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                    Chưa có góp ý trên mục này.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {nodePins.map((pin) => (
                      <button
                        key={pin.threadId}
                        type="button"
                        onClick={() => onOpenThread?.(pin.threadId)}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-left hover:bg-muted/40"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="rounded-md text-[10px]"
                          >
                            {ADVISORY_THREAD_TYPE_LABELS[pin.type]}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {ADVISORY_THREAD_STATUS_LABELS[pin.status]}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-3 text-sm text-foreground">
                          {pin.lastMessagePreview || "Xem chi tiết"}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {canAdvise && selected && !composer ? (
                <div className="border-t border-border p-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 w-full rounded-lg text-xs font-semibold"
                    onClick={() => openComposer(selected)}
                  >
                    Góp ý trên mục này
                  </Button>
                </div>
              ) : null}
              {canAdvise && composer && onCreateThread ? (
                <InlineComposer
                  selection={composer}
                  canCreateRequiredChange={canCreateRequiredChange}
                  isCreating={isCreating}
                  onCancel={() => setComposer(null)}
                  onSubmit={async (input) => {
                    await onCreateThread({
                      ...input,
                      submissionId: board.submissionId,
                    });
                    setComposer(null);
                  }}
                />
              ) : null}
            </>
          )}
        </aside>
      </div>

      {/* Mobile: stacked tree + detail / thread */}
      <div className="lg:hidden">
        {selectedThread ? (
          <div className="min-h-[480px]">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 rounded-lg px-2 text-xs"
                onClick={() => onCloseThread?.()}
              >
                <ArrowLeft className="size-3.5" />
                Quay lại board
              </Button>
            </div>
            <AdvisoryThreadPanel
              programId={programId}
              thread={selectedThread}
              isAdvisor={isAdvisor}
              isManager={false}
              onThreadUpdated={onThreadUpdated}
            />
          </div>
        ) : (
          <>
            <div className="max-h-[320px] overflow-y-auto border-b border-border">
              {tree.map((node) => (
                <button
                  key={node.key}
                  type="button"
                  onClick={() => setSelectedKey(node.key)}
                  className={cn(
                    "flex w-full items-center gap-2 border-b border-border/60 px-3 py-2 text-left",
                    selected?.key === node.key && "bg-primary/5",
                  )}
                  style={{ paddingLeft: 12 + node.depth * 12 }}
                >
                  <KindIcon kind={node.kind} />
                  <span className="truncate text-xs font-semibold">
                    {node.label}
                  </span>
                  {showChanges && node.change ? (
                    <ChangeChip kind={node.change} />
                  ) : null}
                </button>
              ))}
            </div>
            {selected ? (
              <NodeDetail
                node={selected}
                fieldChanges={fieldChanges}
                showChanges={showChanges}
              />
            ) : null}
            {canAdvise && selected && !composer ? (
              <div className="border-t border-border p-3">
                <Button
                  type="button"
                  className="h-10 w-full rounded-xl"
                  onClick={() => openComposer(selected)}
                >
                  Góp ý trên mục này
                </Button>
              </div>
            ) : null}
            {canAdvise && composer && onCreateThread ? (
              <InlineComposer
                selection={composer}
                canCreateRequiredChange={canCreateRequiredChange}
                isCreating={isCreating}
                onCancel={() => setComposer(null)}
                onSubmit={async (input) => {
                  await onCreateThread({
                    ...input,
                    submissionId: board.submissionId,
                  });
                  setComposer(null);
                }}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
