"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { AlertCircle, ArrowLeft, MessageSquarePlus } from "lucide-react";

import { AdvisoryThreadPanel } from "@/components/advisory/advisory-thread-panel";
import { AdvisoryThreadList } from "@/components/advisory/advisory-thread-list";
import { FrameworkCheckPanel } from "@/components/advisory/framework-check-panel";
import {
  CurriculumMutateContext,
  STRUCTURE_NODE_ICON,
  StructureTreePanelHeader,
  StructureTreeRow,
  type StructureNodeKind,
} from "@/components/curriculum/structure-tree";
import {
  MilestoneRail,
  MilestoneRelationLines,
  useMilestoneRelationLines,
  type MilestoneRailGroup,
} from "@/components/curriculum/milestone-rail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type {
  AdvisoryBoard,
  AdvisoryCapabilities,
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
  /** Unresolved threads, including ones carried from an earlier submission. */
  threads?: AdvisoryThread[];
  verificationSubmissionId?: string | null;
  selectedThread?: AdvisoryThread | null;
  frameworkCheck?: FrameworkCheck | null;
  isFrameworkCheckLoading?: boolean;
  isLoading?: boolean;
  canAdvise?: boolean;
  capabilities?: AdvisoryCapabilities;
  reviewActionsLocked?: boolean;
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

function subtreeHasActivity(node: NestedBoardNode, ids: ReadonlySet<string>): boolean {
  if (node.kind === "activity" && ids.has(node.targetId)) return true;
  return node.children.some((child) => subtreeHasActivity(child, ids));
}

function AdvisoryStructureTreeRow({
  node,
  depth,
  isLast,
  selectedKey,
  pinMap,
  linkedActivityIds,
  onSelect,
}: {
  node: NestedBoardNode;
  depth: number;
  isLast: boolean;
  selectedKey: string | null;
  pinMap: Map<string, AdvisoryThreadPinSummary>;
  linkedActivityIds: ReadonlySet<string>;
  onSelect: (key: string) => void;
}) {
  const selected = selectedKey === node.key;
  const children = node.children.filter((child) => child.kind !== "milestone");
  const forceOpen =
    selected ||
    (selectedKey != null && containsKey(node.children, selectedKey)) ||
    subtreeHasActivity(node, linkedActivityIds);
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
      anchorId={node.kind === "activity" ? `activity:${node.targetId}` : undefined}
      linked={node.kind === "activity" && linkedActivityIds.has(node.targetId)}
      onSelect={() => onSelect(node.key)}
      trailing={
        summary && summary.total > 0 ? (
          <PinCountBadge summary={summary} />
        ) : undefined
      }
    >
      {children.map((child, index) => (
        <AdvisoryStructureTreeRow
          key={child.key}
          node={child}
          depth={depth + 1}
          isLast={index === children.length - 1}
          selectedKey={selectedKey}
          pinMap={pinMap}
          linkedActivityIds={linkedActivityIds}
          onSelect={onSelect}
        />
      ))}
    </StructureTreeRow>
  );
}

function milestoneGroupsFromTree(tree: BoardTreeNode[]): MilestoneRailGroup[] {
  return tree
    .filter((node) => node.kind === "module")
    .map((mod) => ({
      moduleId: mod.targetId,
      moduleName: mod.label,
      items: tree
        .filter(
          (node) =>
            node.kind === "milestone" && node.module?.id === mod.targetId,
        )
        .map((node) => {
          const milestone = node.milestone;
          const activityIds =
            milestone?.activityIds?.length
              ? milestone.activityIds
              : (milestone?.activities ?? []).map((activity) => activity.id);
          return {
            id: node.targetId,
            title: milestone?.title || milestone?.code || node.label,
            isCapstone: Boolean(milestone?.isCapstone),
            order: milestone?.order ?? 0,
            assignmentTitle:
              milestone?.assignment?.title || "Chưa có sản phẩm nộp",
            activityIds,
          };
        }),
    }))
    .filter((group) => group.items.length > 0);
}

function AdvisoryStructurePane({
  tree,
  nestedTree,
  selectedKey,
  pinMap,
  onSelect,
}: {
  tree: BoardTreeNode[];
  nestedTree: NestedBoardNode[];
  selectedKey: string | null;
  pinMap: Map<string, AdvisoryThreadPinSummary>;
  onSelect: (key: string) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const groups = useMemo(() => milestoneGroupsFromTree(tree), [tree]);
  const selectedMilestone = tree.find(
    (node) => node.kind === "milestone" && node.key === selectedKey,
  );
  const linkedActivityIds = useMemo(() => {
    const milestone = selectedMilestone?.milestone;
    const ids = milestone?.activityIds?.length
      ? milestone.activityIds
      : (milestone?.activities ?? []).map((activity) => activity.id);
    return new Set(ids);
  }, [selectedMilestone]);
  const relationLines = useMilestoneRelationLines(
    stageRef,
    selectedMilestone?.targetId ?? null,
    [...linkedActivityIds],
  );

  return (
    <div
      ref={stageRef}
      className="relative grid min-h-full"
      style={{
        gridTemplateColumns:
          groups.length > 0 ? "minmax(0,1fr) 210px" : "minmax(0,1fr)",
      }}
    >
      <div className="min-w-0 p-2">
        <CurriculumMutateContext.Provider value={false}>
          <ul role="list">
            {nestedTree.map((node, index) => (
              <AdvisoryStructureTreeRow
                key={node.key}
                node={node}
                depth={0}
                isLast={index === nestedTree.length - 1}
                selectedKey={selectedKey}
                pinMap={pinMap}
                linkedActivityIds={linkedActivityIds}
                onSelect={onSelect}
              />
            ))}
          </ul>
        </CurriculumMutateContext.Provider>
      </div>
      {groups.length > 0 ? (
        <MilestoneRail
          groups={groups}
          selectedId={selectedMilestone?.targetId ?? null}
          onSelect={(item) => {
            const node = tree.find(
              (entry) =>
                entry.kind === "milestone" && entry.targetId === item.id,
            );
            if (node) onSelect(node.key);
          }}
        />
      ) : null}
      <MilestoneRelationLines lines={relationLines} />
    </div>
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
  onComment,
}: {
  label: string;
  value: ReactNode;
  onComment?: () => void;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-2 text-sm last:border-b-0">
      <dt className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
        {label}
        {onComment ? (
          <button
            type="button"
            onClick={onComment}
            className="rounded p-0.5 text-muted-foreground opacity-60 transition-opacity hover:bg-primary/10 hover:text-primary hover:opacity-100 focus-visible:opacity-100"
            aria-label={`Góp ý cho ${label}`}
            title={`Góp ý cho ${label}`}
          >
            <MessageSquarePlus className="size-3" />
          </button>
        ) : null}
      </dt>
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

function assignmentTypeLabel(type: string | null | undefined): string {
  if (type === "Quiz") return "Trắc nghiệm";
  if (type === "Retrospective") return "Nhật ký phản tư";
  if (type === "FileUpload") return "Nộp tệp";
  return type || "—";
}

function AssignmentDetailFields({
  assignment,
  onCommentField,
}: {
  assignment: NonNullable<BoardTreeNode["assignment"]>;
  onCommentField?: (fieldKey: string) => void;
}) {
  const isQuiz =
    (assignment.assignmentType || "").toLowerCase().includes("quiz") ||
    assignment.questionBankId != null ||
    (assignment.questionCount ?? 0) > 0;

  return (
    <div className="space-y-3">
      {assignment.description ? (
        <div>
          <p className="whitespace-pre-line text-sm text-foreground">
            {assignment.description}
          </p>
          <TruncationHint truncated={assignment.descriptionIsTruncated} />
        </div>
      ) : null}
      <dl>
        <DetailRow label="Mã" value={assignment.code || "—"} />
        <DetailRow
          label="Loại nộp"
          value={assignmentTypeLabel(assignment.assignmentType)}
        />
        <DetailRow
          label="Điểm tối đa"
          value={assignment.maxPoints}
          onComment={() => onCommentField?.("maxPoints")}
        />
        <DetailRow
          label="Điểm đạt"
          value={assignment.passScore}
          onComment={() => onCommentField?.("passScore")}
        />
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
            <DetailRow label="Số câu" value={assignment.questionCount ?? "—"} />
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
  );
}

function NodeDetail({
  node,
  fieldChanges,
  showChanges,
  onCommentField,
}: {
  node: BoardTreeNode;
  fieldChanges: SubmissionChangeItem[];
  showChanges: boolean;
  onCommentField?: (fieldKey: string) => void;
}) {
  const activity = node.activity;
  const material = activity?.material;
  const assignment = node.assignment;
  const milestone = node.milestone;
  const course = node.course;
  const mod = node.module;
  const program = node.program;

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
          <div className="mt-4">
            <AssignmentDetailFields
              assignment={assignment}
              onCommentField={onCommentField}
            />
          </div>
        ) : null}

        {node.kind === "milestone" && milestone ? (
          <div className="mt-4 space-y-5">
            <section className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                1 · Mốc nghiên cứu
              </p>
              {milestone.description ? (
                <div>
                  <p className="whitespace-pre-line text-sm text-foreground">
                    {milestone.description}
                  </p>
                  <TruncationHint truncated={milestone.descriptionIsTruncated} />
                </div>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  Chưa có mô tả.
                </p>
              )}
              <dl>
                <DetailRow label="Mã" value={milestone.code || "—"} />
                <DetailRow
                  label="Loại"
                  value={milestone.isCapstone ? "Capstone" : "Milestone thường"}
                />
                <DetailRow
                  label="Hoạt động gắn"
                  value={milestone.activities.length || milestone.activityIds.length}
                />
              </dl>
            </section>

            <section className="space-y-3 border-t border-border pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                2 · Sản phẩm nộp đi kèm
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                Không phải bài tập của khóa học. Mỗi mốc có đúng một sản phẩm nộp.
              </p>
              {milestone.assignment ? (
                <>
                  <p className="text-sm font-semibold text-foreground">
                    {milestone.assignment.title || "Sản phẩm nộp"}
                  </p>
                  <AssignmentDetailFields
                    assignment={milestone.assignment}
                    onCommentField={onCommentField}
                  />
                </>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  Chưa có sản phẩm nộp.
                </p>
              )}
            </section>
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

  const typeOptions: {
    value: AdvisoryThreadType;
    title: string;
    description: string;
  }[] = [
    {
      value: "Suggestion",
      title: "Gợi ý",
      description: "Không chặn phê duyệt. Manager chỉ cần ghi nhận.",
    },
    ...(canCreateRequiredChange
      ? [
          {
            value: "RequiredChange" as const,
            title: "Bắt buộc sửa",
            description: "Manager phải sửa và bạn chấp nhận trước khi duyệt.",
          },
        ]
      : []),
  ];

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
          Nhận xét · {selection.label}
        </p>
      </div>
      {selection.anchorField ? (
        <p className="text-xs text-muted-foreground">
          Trường: {selection.anchorField}
        </p>
      ) : null}
      <fieldset className="space-y-2">
        <legend className="sr-only">Loại nhận xét</legend>
        <div
          className="space-y-2"
          role="radiogroup"
          aria-label="Loại nhận xét"
        >
          {typeOptions.map((option) => {
            const isSelected = threadType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={isCreating}
                onClick={() => setThreadType(option.value)}
                className={cn(
                  "flex w-full cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  "disabled:pointer-events-none disabled:opacity-50",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-muted/40",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                    isSelected
                      ? "border-primary"
                      : "border-muted-foreground/40",
                  )}
                  aria-hidden
                >
                  <span
                    className={cn(
                      "size-2 rounded-full bg-primary transition-opacity",
                      isSelected ? "opacity-100" : "opacity-0",
                    )}
                  />
                </span>
                <span>
                  <span className="font-semibold text-foreground">
                    {option.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
      <Textarea
        rows={3}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Mô tả nhận xét cụ thể…"
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
          {isCreating ? "Đang gửi…" : "Gửi nhận xét"}
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
  threads = [],
  verificationSubmissionId: _verificationSubmissionId = null,
  selectedThread = null,
  frameworkCheck = null,
  isFrameworkCheckLoading = false,
  isLoading = false,
  canAdvise = false,
  capabilities,
  reviewActionsLocked = false,
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

  const selectedThreadKey = useMemo(() => {
    if (!selectedThread?.targetId) return null;
    return (
      tree.find(
        (node) =>
          node.targetType === selectedThread.targetType &&
          node.targetId === selectedThread.targetId,
      )?.key ?? null
    );
  }, [selectedThread, tree]);

  // Prefer the active thread, then the user's selection, then the program root.
  const activeSelectedKey = selectedThreadKey ?? selectedKey ?? tree[0]?.key ?? null;

  const pinMap = useMemo(() => {
    const map = new Map<string, AdvisoryThreadPinSummary>();
    for (const summary of pinSummaries) {
      map.set(pinSummaryKey(summary.targetType, summary.targetId), summary);
    }
    const carried = new Map<
      string,
      { targetType: AdvisoryThread["targetType"]; targetId: string; open: number; total: number }
    >();
    for (const thread of threads) {
      if (thread.type !== "RequiredChange" || thread.status === "Resolved" || !thread.targetId) {
        continue;
      }
      const key = pinSummaryKey(thread.targetType, thread.targetId);
      const row = carried.get(key) ?? {
        targetType: thread.targetType,
        targetId: thread.targetId,
        open: 0,
        total: 0,
      };
      row.total += 1;
      if (thread.status === "Open") row.open += 1;
      carried.set(key, row);
    }
    for (const [key, row] of carried) {
      const current = map.get(key);
      map.set(key, {
        targetType: row.targetType,
        targetId: row.targetId,
        openRequired: Math.max(current?.openRequired ?? 0, row.open),
        openSuggestions: current?.openSuggestions ?? 0,
        total: Math.max(current?.total ?? 0, row.total),
      });
    }
    return map;
  }, [pinSummaries, threads]);

  const selected = tree.find((node) => node.key === activeSelectedKey) ?? tree[0] ?? null;

  const fieldChanges = useMemo(() => {
    if (!board || !selected || !showChanges) return [];
    return buildFieldChangesForTarget(
      board.changeSummary,
      selected.targetType,
      selected.targetId,
    );
  }, [board, selected, showChanges]);

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

      <div
        className={cn(
          "hidden min-h-[560px] lg:grid",
          tree.some((node) => node.kind === "milestone")
            ? "lg:grid-cols-[minmax(0,530px)_minmax(0,1fr)_minmax(260px,0.9fr)]"
            : "lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)_minmax(260px,0.9fr)]",
        )}
      >
        <nav
          className="flex flex-col overflow-hidden border-r border-border bg-card"
          aria-label="Cấu trúc curriculum"
        >
          <StructureTreePanelHeader hint="Mốc nằm cạnh cây và nối tới hoạt động của khóa" />
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <AdvisoryStructurePane
              tree={tree}
              nestedTree={nestedTree}
              selectedKey={activeSelectedKey}
              pinMap={pinMap}
              onSelect={(key) => {
                setSelectedKey(key);
                setComposer(null);
              }}
            />
          </div>
        </nav>

        <div className="border-r border-border">
          {selected ? (
            <NodeDetail
              node={selected}
              fieldChanges={fieldChanges}
              showChanges={showChanges}
              onCommentField={(fieldKey) => openComposer(selected, fieldKey)}
            />
          ) : (
            <p className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
              Chọn một mục trong cây curriculum.
            </p>
          )}
        </div>

        <aside className="flex flex-col overflow-hidden bg-muted/10">
          <div className="border-b border-border bg-card px-4 py-3">
            <p className="text-sm font-bold text-foreground">Nhận xét</p>
          </div>
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
                  Nhận xét
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                <AdvisoryThreadPanel
                  programId={programId}
                  thread={selectedThread}
                  isAdvisor={isAdvisor}
                  isManager={false}
                  reviewActionsLocked={reviewActionsLocked}
                  canReply={capabilities?.canReply !== false}
                  onThreadUpdated={onThreadUpdated}
                />
              </div>
            </>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <AdvisoryThreadList
                  threads={threads.filter((thread) => {
                    if (!selected) return thread.type === "General";
                    if (thread.type === "General") return selected.targetType === "Program";
                    return (
                      thread.targetType === selected.targetType &&
                      thread.targetId === selected.targetId
                    );
                  })}
                  selectedThreadId={null}
                  onSelect={(threadId) => onOpenThread?.(threadId)}
                  emptyMessage="Chưa có nhận xét trên mục này."
                />
              </div>
              {canAdvise && selected && !composer ? (
                <div className="border-t border-border p-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 w-full rounded-lg text-xs font-semibold"
                    onClick={() => openComposer(selected)}
                  >
                    Gửi nhận xét trên mục này
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
              reviewActionsLocked={reviewActionsLocked}
              canReply={capabilities?.canReply !== false}
              onThreadUpdated={onThreadUpdated}
            />
          </div>
        ) : (
          <>
            <div className="max-h-[420px] overflow-y-auto border-b border-border">
              <AdvisoryStructurePane
                tree={tree}
                nestedTree={nestedTree}
                selectedKey={activeSelectedKey}
                pinMap={pinMap}
                onSelect={(key) => {
                  setSelectedKey(key);
                  setComposer(null);
                }}
              />
            </div>
            {selected ? (
              <NodeDetail
                node={selected}
              fieldChanges={fieldChanges}
              showChanges={showChanges}
              onCommentField={(fieldKey) => openComposer(selected, fieldKey)}
              />
            ) : null}
            {canAdvise && selected && !composer ? (
              <div className="border-t border-border p-3">
                <Button
                  type="button"
                  className="h-10 w-full rounded-xl"
                  onClick={() => openComposer(selected)}
                >
                  Gửi nhận xét trên mục này
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
