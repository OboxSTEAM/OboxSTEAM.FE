"use client";

import { Lock, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  canOpenMindMapTarget,
  MIND_MAP_KIND_LABELS,
  mindMapStatusTone,
  type MindMapGraphNode,
} from "@/lib/curriculum/mind-map";
import {
  ACTIVITY_TYPE_LABELS,
  ASSIGNMENT_TYPE_LABELS,
} from "@/lib/curriculum/constants";
import { MODULE_TYPE_LABELS } from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

type MindMapNodeInspectorProps = {
  node: MindMapGraphNode | null;
  breadcrumb: string[];
  onClose: () => void;
  onOpenLesson: (params: {
    activityId?: string;
    assignmentId?: string;
  }) => void;
  className?: string;
};

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#EAEAEA] py-2 last:border-b-0">
      <dt className="shrink-0 text-xs font-medium text-[#8A8A8A]">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-semibold tracking-tight text-[#2D2D2D]">
        {value}
      </dd>
    </div>
  );
}

export function MindMapNodeInspector({
  node,
  breadcrumb,
  onClose,
  onOpenLesson,
  className,
}: MindMapNodeInspectorProps) {
  if (!node) return null;

  const tone = mindMapStatusTone(node.status);
  const kindLabel = MIND_MAP_KIND_LABELS[node.kind];
  const canOpen = canOpenMindMapTarget(node.kind, node.isLocked);

  const activityId =
    node.kind === "activity" ? node.activity?.activityInfo.activityId : undefined;
  const assignmentId =
    node.kind === "assignment"
      ? node.assignment?.assignmentInfo.assignmentId
      : undefined;

  const nextActionHint = canOpen
    ? "Sẵn sàng mở bài học"
    : node.isLocked
      ? "Hoàn thành bước trước để mở khóa"
      : "Chọn hoạt động hoặc bài tập để tiếp tục";

  return (
    <aside
      className={cn(
        "flex max-h-[min(62vh,30rem)] min-h-0 w-full flex-col overflow-hidden",
        "rounded-2xl border border-[#E5E5E0] bg-white",
        "shadow-[0_12px_32px_-22px_rgba(45,43,39,0.4)]",
        className,
      )}
      aria-label={`Chi tiết ${kindLabel}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-[#EAEAEA] px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.12em] text-[#9A9A9A] uppercase">
            {kindLabel}
          </p>
          <h2 className="mt-1 font-heading text-[15px] font-bold leading-snug tracking-tight text-[#2D2D2D]">
            {node.label}
          </h2>
          {breadcrumb.length > 0 ? (
            <p className="mt-1 text-xs font-medium leading-relaxed text-[#8A8A8A]">
              {breadcrumb.join(" · ")}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Đóng chi tiết"
          onClick={onClose}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-[#2D2D2D] transition-colors hover:bg-[#F5F5F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]"
        >
          <X className="size-4" strokeWidth={2.25} aria-hidden />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="rounded-xl bg-[#FAFAF5] px-3 py-2.5">
          <p className="text-[10px] font-bold tracking-[0.1em] text-[#9A9A9A] uppercase">
            Bạn đang ở đâu
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold",
                tone.bgClass,
                tone.textClass,
              )}
            >
              {node.isLocked ? (
                <Lock className="size-3" strokeWidth={2.25} aria-hidden />
              ) : null}
              {tone.label}
            </span>
            {node.isOnCurrentPath ? (
              <span className="rounded-lg bg-[#E94B3C] px-2.5 py-1 text-xs font-bold text-white">
                Lộ trình hiện tại
              </span>
            ) : null}
          </div>
          {node.progressPercent != null ? (
            <p className="mt-2 font-mono text-xs font-semibold tabular-nums text-[#6B6B6B]">
              Tiến độ {Math.round(node.progressPercent)}%
              {node.childProgress
                ? ` · ${node.childProgress.completedCount}/${node.childProgress.totalCount}`
                : ""}
            </p>
          ) : node.childProgress ? (
            <p className="mt-2 font-mono text-xs font-semibold tabular-nums text-[#6B6B6B]">
              {node.childProgress.completedCount}/{node.childProgress.totalCount} hoàn thành
            </p>
          ) : null}
        </div>

        <div className="mt-3 rounded-xl border border-[#EAEAEA] px-3 py-2.5">
          <p className="text-[10px] font-bold tracking-[0.1em] text-[#9A9A9A] uppercase">
            Bước tiếp theo
          </p>
          <p className="mt-1.5 text-sm font-medium text-[#2D2D2D]">{nextActionHint}</p>
          {node.lockReason ? (
            <p className="mt-2 text-sm font-medium text-[#8A8A8A]">{node.lockReason}</p>
          ) : null}
        </div>

        <dl className="mt-3">
          {node.module ? (
            <>
              <MetaRow
                label="Loại mô-đun"
                value={MODULE_TYPE_LABELS[node.module.moduleInfo.moduleType]}
              />
              {node.module.moduleInfo.moduleCode ? (
                <MetaRow label="Mã" value={node.module.moduleInfo.moduleCode} />
              ) : null}
            </>
          ) : null}

          {node.milestone?.milestoneInfo.isCapstone ? (
            <MetaRow label="Capstone" value="Có" />
          ) : null}

          {node.activity ? (
            <>
              <MetaRow
                label="Hình thức"
                value={
                  ACTIVITY_TYPE_LABELS[node.activity.activityInfo.activityType]
                }
              />
              <MetaRow
                label="Lịch học"
                value={node.activity.activityInfo.schedulingMode}
              />
              {node.activity.activityInfo.material?.materialName ? (
                <MetaRow
                  label="Tài liệu"
                  value={node.activity.activityInfo.material.materialName}
                />
              ) : null}
            </>
          ) : null}

          {node.assignment ? (
            <>
              <MetaRow
                label="Loại bài"
                value={
                  ASSIGNMENT_TYPE_LABELS[
                    node.assignment.assignmentInfo.assignmentType
                  ]
                }
              />
              <MetaRow
                label="Điểm đạt"
                value={`${node.assignment.assignmentInfo.passScore}/${node.assignment.assignmentInfo.maxPoints}`}
              />
              {node.assignment.assignmentInfo.dueDate ? (
                <MetaRow
                  label="Hạn nộp"
                  value={node.assignment.assignmentInfo.dueDate}
                />
              ) : null}
            </>
          ) : null}

          {node.hub ? (
            <MetaRow
              label="Mô-đun hoàn thành"
              value={`${node.hub.completedModuleCount}/${node.hub.totalModuleCount}`}
            />
          ) : null}
        </dl>

        {node.activity?.activityInfo.description ? (
          <div className="mt-3">
            <p className="text-[10px] font-bold tracking-[0.1em] text-[#9A9A9A] uppercase">
              Mô tả
            </p>
            <p className="mt-1.5 text-sm font-medium leading-relaxed text-[#6B6B6B]">
              {node.activity.activityInfo.description}
            </p>
          </div>
        ) : null}
      </div>

      <div className="border-t border-[#EAEAEA] p-3">
        {canOpen && (activityId || assignmentId) ? (
          <Button
            type="button"
            className="min-h-11 w-full rounded-xl bg-[#E94B3C] font-semibold text-white hover:bg-[#d43e30]"
            onClick={() =>
              onOpenLesson({
                activityId,
                assignmentId,
              })
            }
          >
            Mở bài học
          </Button>
        ) : (
          <p className="text-center text-sm font-medium text-[#8A8A8A]">
            {node.isLocked
              ? "Nút này đang bị khóa."
              : "Chọn hoạt động hoặc bài tập để mở bài học."}
          </p>
        )}
      </div>
    </aside>
  );
}
