"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertCircle, ArrowLeft, MessageSquarePlus } from "lucide-react";

import { AdvisoryThreadPanel } from "@/components/advisory/advisory-thread-panel";
import { FrameworkCheckPanel } from "@/components/advisory/framework-check-panel";
import {
  CurriculumMutateContext,
  STRUCTURE_NODE_ICON,
  StructureTreePanelHeader,
  StructureTreeRow,
  type StructureNodeKind,
} from "@/components/curriculum/structure-tree";
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
  FrameworkCheck,
  SubmissionChangeItem,
} from "@/lib/api";
import {
  buildBoardTree,
  buildFieldChangesForTarget,
  nestBoardTree,
  pinSummaryKey,
  type BoardTreeNode,
  type NestedBoardNode,
} from "@/lib/advisory/board-tree";
import {
  ADVISORY_THREAD_TYPE_LABELS,
  ADVISORY_THREAD_STATUS_LABELS,
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
  frameworkCheck?: FrameworkCheck | null;
  isFrameworkCheckLoading?: boolean;
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

function KindIcon({ kind }: { kind: StructureNodeKind }) {
  const { Icon, color, bg } = STRUCTURE_NODE_ICON[kind];
  return (
    <span
      className="flex size-6 shrink-0 items-center justify-center rounded-[7px] border border-border shadow-[0_1px_2px_rgba(45,43,39,0.06)]"
      style={{ color, background: bg }}
      aria-hidden
    >
      <Icon className="size-3.5" strokeWidth={2.25} />
    </span>
  );
}

function containsKey(nodes: NestedBoardNode[], key: string): boolean {
  for (const node of nodes) {
    if (node.key === key) return true;
    if (containsKey(node.children, key)) return true;
  }
  return false;
}

function AdvisoryStructureTreeRow({
  node,
  depth,
  isLast,
  selectedKey,
  pinMap,
  onSelect,
}: {
  node: NestedBoardNode;
  depth: number;
  isLast: boolean;
  selectedKey: string | null;
  pinMap: Map<string, AdvisoryThreadPinSummary>;
  onSelect: (key: string) => void;
}) {
  const selected = selectedKey === node.key;
  const forceOpen =
    selected ||
    (selectedKey != null && containsKey(node.children, selectedKey));
  const summary = pinMap.get(pinSummaryKey(node.targetType, node.targetId));

  return (
    <StructureTreeRow
      depth={depth}
      isLast={isLast}
      kind={node.kind as StructureNodeKind}
      selected={selected}
      label={node.label}
      meta={node.meta}
      defaultOpen={depth === 0}
      forceOpen={forceOpen}
      onSelect={() => onSelect(node.key)}
      trailing={
        summary && summary.total > 0 ? (
          <PinCountBadge summary={summary} />
        ) : undefined
      }
    >
      {node.children.map((child, index) => (
        <AdvisoryStructureTreeRow
          key={child.key}
          node={child}
          depth={depth + 1}
          isLast={index === node.children.length - 1}
          selectedKey={selectedKey}
          pinMap={pinMap}
          onSelect={onSelect}
        />
      ))}
    </StructureTreeRow>
  );
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

function TruncationHint({ truncated }: { truncated?: boolean }) {
  if (!truncated) return null;
  return (
    <p className="mt-1 text-[11px] text-muted-foreground">
      Nội dung đã rút gọn trên board — mở chi tiết đầy đủ nếu cần.
    </p>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-2 text-sm last:border-b-0">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-foreground">{value}</dd>
    </div>
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
          {items.map((item, index) => (
            <div
              key={`${item.targetType}-${item.id}-${item.field}-${index}`}
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
  const program = node.program;
  const isQuiz =
    (assignment?.assignmentType || "").toLowerCase().includes("quiz") ||
    assignment?.questionBankId != null ||
    (assignment?.questionCount ?? 0) > 0;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <KindIcon kind={node.kind as StructureNodeKind} />
          <h3 className="font-heading text-lg font-bold text-foreground">
            {node.label}
          </h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{node.meta}</p>

        {node.kind === "program" && program ? (
          <div className="mt-4 space-y-3">
            {program.description ? (
              <div>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {program.description}
                </p>
                <TruncationHint truncated={program.descriptionIsTruncated} />
              </div>
            ) : (
              <p className="text-sm italic text-muted-foreground">
                Chưa có mô tả chương trình.
              </p>
            )}
            {program.skillsGained ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Kỹ năng đạt được
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {program.skillsGained}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {node.kind === "module" && mod ? (
          <div className="mt-4 space-y-3">
            <dl>
              <DetailRow
                label="Loại"
                value={moduleTypeLabel(mod.moduleType || mod.type)}
              />
              <DetailRow
                label="Bắt buộc"
                value={mod.isMandatory ? "Có" : "Không"}
              />
              <DetailRow
                label="Tiên quyết"
                value={mod.prerequisiteModuleId ? "Có" : "Không"}
              />
              <DetailRow
                label="Cấu trúc"
                value={`${mod.courses.length} khóa · ${mod.assignments.length} bài tập · ${mod.milestones.length} mốc`}
              />
            </dl>
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
          </div>
        ) : null}

        {node.kind === "course" && course ? (
          <div className="mt-4 space-y-3">
            {course.description ? (
              <div>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {course.description}
                </p>
                <TruncationHint truncated={course.descriptionIsTruncated} />
              </div>
            ) : (
              <p className="text-sm italic text-muted-foreground">Chưa có mô tả.</p>
            )}
            <dl>
              <DetailRow label="Mã" value={course.code || "—"} />
              <DetailRow
                label="Hoạt động"
                value={`${course.activities.length}`}
              />
            </dl>
          </div>
        ) : null}

        {node.kind === "activity" && activity ? (
          <div className="mt-4 space-y-3">
            {activity.description ? (
              <div>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {activity.description}
                </p>
                <TruncationHint truncated={activity.descriptionIsTruncated} />
              </div>
            ) : null}
            <dl>
              <DetailRow
                label="Loại"
                value={activity.activityType || activity.type || "—"}
              />
              <DetailRow
                label="Thời lượng"
                value={
                  activity.durationMinutes != null
                    ? `${activity.durationMinutes} phút`
                    : "—"
                }
              />
              <DetailRow
                label="QR check-in"
                value={activity.requireQrCheckin ? "Có" : "Không"}
              />
              <DetailRow
                label="Bằng chứng media"
                value={activity.requireMediaEvidence ? "Có" : "Không"}
              />
            </dl>
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
          <div className="mt-4 space-y-3">
            {assignment.description ? (
              <div>
                <p className="whitespace-pre-line text-sm text-foreground">
                  {assignment.description}
                </p>
                <TruncationHint truncated={assignment.descriptionIsTruncated} />
              </div>
            ) : null}
            <dl>
              <DetailRow
                label="Loại"
                value={assignment.assignmentType || "—"}
              />
              <DetailRow label="Điểm tối đa" value={assignment.maxPoints} />
              <DetailRow label="Đạt ≥" value={assignment.passScore} />
              <DetailRow label="Số lần làm" value={assignment.maxAttempts} />
              <DetailRow
                label="Giới hạn thời gian"
                value={
                  assignment.timeLimitMinutes != null
                    ? `${assignment.timeLimitMinutes} phút`
                    : "—"
                }
              />
              <DetailRow
                label="Bắt buộc để pass học phần"
                value={assignment.isRequiredForModulePass ? "Có" : "Không"}
              />
            </dl>
            {isQuiz ? (
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Cấu hình quiz
                </p>
                <dl className="mt-1">
                  <DetailRow
                    label="Ngân hàng câu hỏi"
                    value={assignment.questionBankId ? "Đã gắn" : "—"}
                  />
                  <DetailRow
                    label="Số câu"
                    value={assignment.questionCount ?? "—"}
                  />
                  <DetailRow
                    label="Xáo câu"
                    value={assignment.allowShuffle ? "Có" : "Không"}
                  />
                  <DetailRow
                    label="Xáo đáp án"
                    value={assignment.shuffleOptions ? "Có" : "Không"}
                  />
                  <DetailRow
                    label="Tỷ lệ độ khó"
                    value={`${assignment.easyPercent}/${assignment.mediumPercent}/${assignment.hardPercent}%`}
                  />
                </dl>
              </div>
            ) : null}
          </div>
        ) : null}

        {node.kind === "milestone" && milestone ? (
          <div className="mt-4 space-y-3">
            {milestone.description ? (
              <div>
                <p className="whitespace-pre-line text-sm text-foreground">
                  {milestone.description}
                </p>
                <TruncationHint truncated={milestone.descriptionIsTruncated} />
              </div>
            ) : null}
            <dl>
              <DetailRow
                label="Loại"
                value={milestone.isCapstone ? "Capstone" : "Milestone thường"}
              />
              <DetailRow
                label="Assignment"
                value={
                  milestone.assignment?.title || milestone.assignmentId || "—"
                }
              />
              <DetailRow
                label="Hoạt động gắn"
                value={milestone.activities.length || milestone.activityIds.length}
              />
            </dl>
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
  frameworkCheck = null,
  isFrameworkCheckLoading = false,
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

  const nestedTree = useMemo(() => nestBoardTree(tree), [tree]);

  useEffect(() => {
    if (!selectedThread?.targetId) return;
    const match = tree.find(
      (node) =>
        node.targetType === selectedThread.targetType &&
        node.targetId === selectedThread.targetId,
    );
    if (match) setSelectedKey(match.key);
  }, [selectedThread, tree]);

  // Prefer the program root when nothing selected yet.
  useEffect(() => {
    if (selectedKey != null || tree.length === 0) return;
    setSelectedKey(tree[0]!.key);
  }, [selectedKey, tree]);

  const pinMap = useMemo(() => {
    const map = new Map<string, AdvisoryThreadPinSummary>();
    for (const summary of pinSummaries) {
      map.set(pinSummaryKey(summary.targetType, summary.targetId), summary);
    }
    return map;
  }, [pinSummaries]);

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
            Khung chương trình
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

      {(isFrameworkCheckLoading || frameworkCheck) && (
        <div className="border-b border-border px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Kiểm tra khung chương trình
          </p>
          {isFrameworkCheckLoading ? (
            <Skeleton className="mt-3 h-20 w-full rounded-xl" />
          ) : frameworkCheck ? (
            <FrameworkCheckPanel check={frameworkCheck} compact className="mt-2" />
          ) : null}
        </div>
      )}

      <div className="hidden min-h-[560px] lg:grid lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)_minmax(260px,0.9fr)]">
        <nav
          className="flex flex-col overflow-hidden border-r border-border bg-card"
          aria-label="Cấu trúc curriculum"
        >
          <StructureTreePanelHeader hint="Chọn mục để xem chi tiết và gắn góp ý" />
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
            <CurriculumMutateContext.Provider value={false}>
              <ul role="list">
                {nestedTree.map((node, index) => (
                  <AdvisoryStructureTreeRow
                    key={node.key}
                    node={node}
                    depth={0}
                    isLast={index === nestedTree.length - 1}
                    selectedKey={selected?.key ?? selectedKey}
                    pinMap={pinMap}
                    onSelect={(key) => {
                      setSelectedKey(key);
                      setComposer(null);
                    }}
                  />
                ))}
              </ul>
            </CurriculumMutateContext.Provider>
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
            <div className="max-h-[320px] overflow-y-auto border-b border-border p-2">
              <CurriculumMutateContext.Provider value={false}>
                <ul role="list">
                  {nestedTree.map((node, index) => (
                    <AdvisoryStructureTreeRow
                      key={node.key}
                      node={node}
                      depth={0}
                      isLast={index === nestedTree.length - 1}
                      selectedKey={selected?.key ?? selectedKey}
                      pinMap={pinMap}
                      onSelect={(key) => {
                        setSelectedKey(key);
                        setComposer(null);
                      }}
                    />
                  ))}
                </ul>
              </CurriculumMutateContext.Provider>
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
