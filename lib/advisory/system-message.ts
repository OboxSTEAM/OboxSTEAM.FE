import {
  parseSystemEventPayload,
  type ApprovalRevokeReason,
  type DiscussionMessage,
} from "@/lib/api/advisory-chat/schemas";

export type SystemMessageView = {
  text: string;
  /** Optional note (approval comment, revoke reason). */
  detail: string | null;
  tone: "neutral" | "success" | "warning";
  /** Set for `CurriculumUpdated` — opens the changes view for this range. */
  versionRange: { fromVersion: number; toVersion: number } | null;
};

const REVOKE_REASON_TEXT: Record<ApprovalRevokeReason, (actor: string | null) => string> = {
  ManagerReopened: (actor) =>
    `${actor ?? "Quản lý"} đã mở lại chương trình để chỉnh sửa — chấp thuận trước đó không còn hiệu lực.`,
  CurriculumEdited: () =>
    "Chương trình vừa được chỉnh sửa nên chấp thuận trước đó không còn hiệu lực.",
  ExpertRevoked: (actor) => `${actor ?? "Chuyên gia"} đã rút lại chấp thuận.`,
  AdvisorChanged: () => "Chuyên gia tư vấn đã thay đổi nên chấp thuận trước đó không còn hiệu lực.",
  FrameworkUpgraded: () =>
    "Chương trình đã chuyển sang phiên bản khung mới nên chấp thuận trước đó không còn hiệu lực.",
};

/** Vietnamese copy for a system message; falls back to the server text. */
export function describeSystemMessage(message: DiscussionMessage): SystemMessageView {
  const fallback: SystemMessageView = {
    text: message.text || "Cập nhật hệ thống.",
    detail: null,
    tone: "neutral",
    versionRange: null,
  };
  if (!message.systemEvent) return fallback;

  const event = parseSystemEventPayload(message.systemEvent);
  if (!event) return fallback;

  switch (event.code) {
    case "CurriculumUpdated": {
      const { actorName, changeCount, fromVersion, toVersion } = event.payload;
      const actor = actorName ?? "Quản lý";
      return {
        text:
          changeCount > 0
            ? `${actor} đã cập nhật ${changeCount} thay đổi trong chương trình.`
            : `${actor} đã cập nhật chương trình.`,
        detail: null,
        tone: "neutral",
        versionRange: { fromVersion, toVersion },
      };
    }
    case "ApprovalRequested":
      return {
        text: `${event.payload.requestedByName ?? "Quản lý"} đã gửi chương trình để chuyên gia chấp thuận.`,
        detail: null,
        tone: "neutral",
        versionRange: null,
      };
    case "Approved": {
      const { approvedByName, curriculumVersion, comment } = event.payload;
      const version = curriculumVersion !== null ? ` (phiên bản ${curriculumVersion})` : "";
      return {
        text: `${approvedByName ?? "Chuyên gia"} đã chấp thuận chương trình${version}.`,
        detail: comment,
        tone: "success",
        versionRange: null,
      };
    }
    case "ApprovalRevoked": {
      const { reason, actorName, comment } = event.payload;
      return {
        text: reason
          ? REVOKE_REASON_TEXT[reason](actorName)
          : "Chấp thuận trước đó không còn hiệu lực.",
        detail: comment,
        tone: "warning",
        versionRange: null,
      };
    }
    case "Published":
      return {
        text: `${event.payload.publishedByName ?? "Quản lý"} đã xuất bản chương trình.`,
        detail: null,
        tone: "success",
        versionRange: null,
      };
    case "AdvisorChanged": {
      const { previousAdvisorName, newAdvisorName } = event.payload;
      const text =
        previousAdvisorName && newAdvisorName
          ? `Chuyên gia tư vấn đã đổi từ ${previousAdvisorName} sang ${newAdvisorName}.`
          : newAdvisorName
            ? `${newAdvisorName} được chỉ định làm chuyên gia tư vấn.`
            : "Chuyên gia tư vấn đã thay đổi.";
      return { text, detail: null, tone: "neutral", versionRange: null };
    }
    case "FrameworkUpgraded": {
      const { actorName, fromVersion, toVersion } = event.payload;
      const actor = actorName ?? "Quản lý";
      const range =
        fromVersion !== null && toVersion !== null
          ? ` từ v${fromVersion} lên v${toVersion}`
          : toVersion !== null
            ? ` lên v${toVersion}`
            : "";
      return {
        text: `${actor} đã cập nhật khung chương trình${range}.`,
        detail: "Chương trình về Bản nháp và cần chuyên gia phụ trách chấp thuận lại theo quy tắc mới.",
        tone: "warning",
        versionRange: null,
      };
    }
  }
}
