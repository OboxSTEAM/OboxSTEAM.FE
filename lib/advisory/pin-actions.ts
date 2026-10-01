import type { DiscussionPinStatus } from "@/lib/api/advisory-chat/schemas";
import type { DiscussionPinAction } from "@/lib/validations/advisory-chat";

export const PIN_STATUS_LABELS: Record<DiscussionPinStatus, string> = {
  Open: "Cần sửa",
  Addressed: "Đã sửa, chờ xác nhận",
  Resolved: "Đã giải quyết",
};

export const PIN_STATUS_BADGE_CLASSES: Record<DiscussionPinStatus, string> = {
  Open: "bg-primary/10 text-primary",
  Addressed: "bg-amber-500/12 text-amber-800 dark:text-amber-300",
  Resolved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

export const PIN_ACTION_LABELS: Record<DiscussionPinAction, string> = {
  MarkAddressed: "Đánh dấu đã sửa",
  Resolve: "Xác nhận đã giải quyết",
  Reopen: "Mở lại",
};

const STAFF_ROLES = new Set(["Manager", "Admin"]);

export function isAdvisoryStaffRole(role: string | null | undefined): boolean {
  return role ? STAFF_ROLES.has(role) : false;
}

/**
 * Status transitions the current user may trigger (mirrors the server):
 * staff mark Open → Addressed; experts resolve Open/Addressed and reopen Addressed/Resolved.
 */
export function getAvailablePinActions(
  status: DiscussionPinStatus,
  viewer: { isStaff: boolean; canResolvePin: boolean },
): DiscussionPinAction[] {
  const actions: DiscussionPinAction[] = [];
  if (viewer.isStaff && status === "Open") actions.push("MarkAddressed");
  if (viewer.canResolvePin && status !== "Resolved") actions.push("Resolve");
  if (viewer.canResolvePin && status !== "Open") actions.push("Reopen");
  return actions;
}
