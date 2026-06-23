import type { ActivityNavStatus, ActivityType } from "@/lib/api";

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  SelfPaced: "Tự học",
  LiveOnline: "Trực tuyến",
  Offline: "Thực hành",
};

export const ACTIVITY_TITLE_PREFIX: Record<ActivityType, string> = {
  SelfPaced: "Đọc/Xem",
  LiveOnline: "Buổi học",
  Offline: "Thực hành",
};

export const ACTIVITY_NAV_STATUS_META: Record<
  ActivityNavStatus,
  { label: string; icon: "check" | "current" | "available" | "locked" }
> = {
  completed: { label: "Đã hoàn thành", icon: "check" },
  current: { label: "Đang học", icon: "current" },
  available: { label: "Có thể học", icon: "available" },
  locked: { label: "Đã khóa", icon: "locked" },
};

/** Scroll/video completion thresholds. */
export const SCROLL_COMPLETE_EPSILON = 0.02;
export const VIDEO_COMPLETE_EPSILON_SECONDS = 1;
export const CHECKPOINT_DEBOUNCE_MS = 1500;
