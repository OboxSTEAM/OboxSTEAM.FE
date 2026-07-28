import type { MindMapNodeStatus } from "@/lib/api";

export const MIND_MAP_STATUS_LABELS: Record<MindMapNodeStatus, string> = {
  completed: "Đã hoàn thành",
  current: "Đang học",
  in_progress: "Đang tiến hành",
  available: "Có thể học",
  submitted: "Đã nộp",
  locked: "Đã khóa",
};

export const MIND_MAP_KIND_LABELS = {
  program: "Chương trình",
  module: "Mô-đun",
  course: "Khóa học",
  milestone: "Mốc nghiên cứu",
  activity: "Hoạt động",
  assignment: "Bài tập",
} as const;

/** Tailwind text/bg accents that never rely on color alone. */
export function mindMapStatusTone(status: MindMapNodeStatus | null): {
  textClass: string;
  bgClass: string;
  ringClass: string;
  label: string;
} {
  switch (status) {
    case "completed":
      return {
        textClass: "text-learn-success",
        bgClass: "bg-learn-success/15",
        ringClass: "ring-learn-success/45",
        label: MIND_MAP_STATUS_LABELS.completed,
      };
    case "current":
      return {
        textClass: "text-learn-primary",
        bgClass: "bg-learn-primary/12",
        ringClass: "ring-learn-primary/50",
        label: MIND_MAP_STATUS_LABELS.current,
      };
    case "in_progress":
      return {
        textClass: "text-learn-accent",
        bgClass: "bg-learn-accent/15",
        ringClass: "ring-learn-accent/45",
        label: MIND_MAP_STATUS_LABELS.in_progress,
      };
    case "submitted":
      // No dedicated learn-* token for purple; reuse the themed STEAM math hue.
      return {
        textClass: "text-[var(--steam-mathematics)]",
        bgClass: "bg-[var(--steam-mathematics)]/12",
        ringClass: "ring-[var(--steam-mathematics)]/40",
        label: MIND_MAP_STATUS_LABELS.submitted,
      };
    case "available":
      return {
        textClass: "text-learn-text-strong",
        bgClass: "bg-learn-surface-2",
        ringClass: "ring-learn-border",
        label: MIND_MAP_STATUS_LABELS.available,
      };
    case "locked":
      return {
        textClass: "text-learn-muted",
        bgClass: "bg-learn-border/70",
        ringClass: "ring-learn-border",
        label: MIND_MAP_STATUS_LABELS.locked,
      };
    default:
      return {
        textClass: "text-learn-muted",
        bgClass: "bg-learn-surface-2",
        ringClass: "ring-learn-border",
        label: "Chưa xác định",
      };
  }
}

export function canOpenMindMapTarget(
  kind: "activity" | "assignment" | string,
  isLocked: boolean,
): boolean {
  if (kind !== "activity" && kind !== "assignment") return false;
  return !isLocked;
}
