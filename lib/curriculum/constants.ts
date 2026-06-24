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
/** How often embedded PDF/DOC iframes are polled for page + scroll changes. */
export const EMBEDDED_FRAME_POLL_MS = 1000;
/** Minimum interval between video checkpoint PATCH calls during playback. */
export const VIDEO_CHECKPOINT_INTERVAL_MS = 10_000;
/** Skip video checkpoint when position has not advanced by this many seconds. */
export const VIDEO_CHECKPOINT_MIN_DELTA_SECONDS = 1;
