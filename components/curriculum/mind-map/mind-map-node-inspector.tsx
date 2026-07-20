"use client";

import { Lock } from "lucide-react";

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
  variant?: "side" | "sheet";
  className?: string;
};

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#E5E5E0]/80 py-2.5 last:border-b-0">
      <dt className="shrink-0 text-xs text-[#8a8a8a]">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium text-[#2D2D2D]">
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
  variant = "side",
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

  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col bg-white",
        variant === "side" && "h-full border-l border-[#E5E5E0]",
        variant === "sheet" && "h-full",
        className,
      )}
      aria-label={`Chi tiết ${kindLabel}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-[#E5E5E0] px-4 py-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#8a8a8a] uppercase">
            {kindLabel}
          </p>
          <h2 className="mt-1 font-heading text-lg font-bold leading-snug text-[#2D2D2D]">
            {node.label}
          </h2>
          {breadcrumb.length > 0 ? (
            <p className="mt-1.5 text-xs leading-relaxed text-[#6B6B6B]">
              {breadcrumb.join(" · ")}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="shrink-0"
        >
          Đóng
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              tone.bgClass,
              tone.textClass,
            )}
          >
            {node.isLocked ? <Lock className="size-3" aria-hidden /> : null}
            {tone.label}
          </span>
          {node.isOnCurrentPath ? (
            <span className="rounded-full bg-[#E94B3C] px-2.5 py-1 text-xs font-semibold text-white">
              Trên lộ trình hiện tại
            </span>
          ) : null}
        </div>

        {node.lockReason ? (
          <p className="mt-3 rounded-xl border border-[#E5E5E0] bg-[#F5F5F0] px-3 py-2.5 text-sm text-[#6B6B6B]">
            {node.lockReason}
          </p>
        ) : null}

        <dl className="mt-4">
          {node.progressPercent != null ? (
            <MetaRow
              label="Tiến độ"
              value={`${Math.round(node.progressPercent)}%`}
            />
          ) : null}
          {node.childProgress ? (
            <MetaRow
              label="Hoàn thành"
              value={`${node.childProgress.completedCount}/${node.childProgress.totalCount}`}
            />
          ) : null}

          {node.module ? (
            <>
              <MetaRow
                label="Loại mô-đun"
                value={MODULE_TYPE_LABELS[node.module.moduleInfo.moduleType]}
              />
              {node.module.moduleInfo.moduleCode ? (
                <MetaRow label="Mã" value={node.module.moduleInfo.moduleCode} />
              ) : null}
              <MetaRow
                label="Bắt buộc"
                value={node.module.moduleInfo.isMandatory ? "Có" : "Không"}
              />
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
              {node.activity.activityInfo.activityCode ? (
                <MetaRow
                  label="Mã"
                  value={node.activity.activityInfo.activityCode}
                />
              ) : null}
              {node.activity.activityInfo.material?.materialName ? (
                <MetaRow
                  label="Tài liệu"
                  value={node.activity.activityInfo.material.materialName}
                />
              ) : null}
              {node.activity.learning.lastAccessedAt ? (
                <MetaRow
                  label="Truy cập gần nhất"
                  value={node.activity.learning.lastAccessedAt}
                />
              ) : null}
              {node.activity.learning.resumeState ? (
                <MetaRow
                  label="Tiếp tục từ"
                  value={node.activity.learning.resumeState.kind}
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
                label="Điểm tối đa"
                value={String(node.assignment.assignmentInfo.maxPoints)}
              />
              <MetaRow
                label="Điểm đạt"
                value={String(node.assignment.assignmentInfo.passScore)}
              />
              {node.assignment.assignmentInfo.dueDate ? (
                <MetaRow
                  label="Hạn nộp"
                  value={node.assignment.assignmentInfo.dueDate}
                />
              ) : null}
              <MetaRow
                label="Bắt buộc để qua mô-đun"
                value={
                  node.assignment.assignmentInfo.isRequiredForModulePass
                    ? "Có"
                    : "Không"
                }
              />
            </>
          ) : null}

          {node.hub ? (
            <>
              <MetaRow
                label="Mô-đun hoàn thành"
                value={`${node.hub.completedModuleCount}/${node.hub.totalModuleCount}`}
              />
            </>
          ) : null}
        </dl>

        {node.module?.moduleInfo.learningOutcomes &&
        node.module.moduleInfo.learningOutcomes.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs font-semibold tracking-wide text-[#8a8a8a] uppercase">
              Chuẩn đầu ra
            </p>
            <ul className="mt-2 space-y-1.5">
              {node.module.moduleInfo.learningOutcomes.map((outcome) => (
                <li
                  key={outcome}
                  className="rounded-lg bg-[#F5F5F0] px-3 py-2 text-sm text-[#2D2D2D]"
                >
                  {outcome}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {node.activity?.activityInfo.description ? (
          <div className="mt-4">
            <p className="text-xs font-semibold tracking-wide text-[#8a8a8a] uppercase">
              Mô tả
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#6B6B6B]">
              {node.activity.activityInfo.description}
            </p>
          </div>
        ) : null}
      </div>

      <div className="border-t border-[#E5E5E0] p-4">
        {canOpen && (activityId || assignmentId) ? (
          <Button
            type="button"
            className="min-h-11 w-full bg-[#E94B3C] text-white hover:bg-[#d43e30]"
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
          <p className="text-center text-sm text-[#6B6B6B]">
            {node.isLocked
              ? "Nút này đang bị khóa."
              : "Chọn hoạt động hoặc bài tập để mở bài học."}
          </p>
        )}
      </div>
    </aside>
  );
}
