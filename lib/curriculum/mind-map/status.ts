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
        textClass: "text-[#5a7a32]",
        bgClass: "bg-[#7CB342]/15",
        ringClass: "ring-[#7CB342]/45",
        label: MIND_MAP_STATUS_LABELS.completed,
      };
    case "current":
      return {
        textClass: "text-[#c43a2e]",
        bgClass: "bg-[#E94B3C]/12",
        ringClass: "ring-[#E94B3C]/50",
        label: MIND_MAP_STATUS_LABELS.current,
      };
    case "in_progress":
      return {
        textClass: "text-[#2d7a9c]",
        bgClass: "bg-[#4FC3F7]/15",
        ringClass: "ring-[#4FC3F7]/45",
        label: MIND_MAP_STATUS_LABELS.in_progress,
      };
    case "submitted":
      return {
        textClass: "text-[#6a4aa8]",
        bgClass: "bg-[#7E57C2]/12",
        ringClass: "ring-[#7E57C2]/40",
        label: MIND_MAP_STATUS_LABELS.submitted,
      };
    case "available":
      return {
        textClass: "text-[#2D2D2D]",
        bgClass: "bg-[#F5F5F0]",
        ringClass: "ring-[#E5E5E0]",
        label: MIND_MAP_STATUS_LABELS.available,
      };
    case "locked":
      return {
        textClass: "text-[#8a8a8a]",
        bgClass: "bg-[#E5E5E0]/70",
        ringClass: "ring-[#E5E5E0]",
        label: MIND_MAP_STATUS_LABELS.locked,
      };
    default:
      return {
        textClass: "text-[#6B6B6B]",
        bgClass: "bg-[#F5F5F0]",
        ringClass: "ring-[#E5E5E0]",
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
