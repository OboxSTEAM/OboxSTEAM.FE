import type {
  CurriculumChangeField,
  CurriculumChangeItem,
  CurriculumTargetType,
} from "@/lib/api";
import { ACTIVITY_TYPE_LABELS, ASSIGNMENT_TYPE_LABELS } from "@/lib/curriculum/constants";
import {
  MODULE_TYPE_LABELS,
  PROGRAM_CATEGORY_META,
  PROGRAM_LEVEL_LABELS,
} from "@/lib/programs/constants";

/** Labels the BE sends are English defaults — localize by `fieldKey`, fall back to `label`. */
const FIELD_LABELS_BY_TARGET: Partial<Record<CurriculumTargetType, Record<string, string>>> = {
  Program: {
    name: "Tên chương trình",
    description: "Mô tả chương trình",
    category: "Thể loại",
    level: "Cấp độ",
    estimatedDuration: "Thời lượng dự kiến",
    skillsGained: "Kỹ năng đạt được",
    seriesName: "Chuỗi chương trình",
    thumbnailUrl: "Ảnh đại diện",
    thumbnail: "Ảnh đại diện",
    frameworkVersionId: "Phiên bản khung",
    advisorExpertId: "Chuyên gia tư vấn",
  },
  Module: {
    name: "Tên học phần",
    description: "Mô tả học phần",
    moduleType: "Loại học phần",
    moduleOrder: "Thứ tự học phần",
  },
  Course: {
    name: "Tên khóa học",
    code: "Mã khóa học",
    description: "Mô tả khóa học",
    courseOrder: "Thứ tự khóa học",
    thumbnailUrl: "Ảnh khóa học",
  },
  Activity: {
    name: "Tên hoạt động",
    description: "Mô tả hoạt động",
    activityType: "Hình thức",
    activityOrder: "Thứ tự hoạt động",
    durationMinutes: "Thời lượng",
    requireQrCheckin: "Điểm danh bằng QR",
    requireMediaEvidence: "Yêu cầu minh chứng hình ảnh",
  },
  Assignment: {
    title: "Tiêu đề bài tập",
    description: "Mô tả bài tập",
    assignmentType: "Loại bài tập",
    maxPoints: "Điểm tối đa",
    passScore: "Điểm đạt",
    isRequiredForModulePass: "Bắt buộc để qua học phần",
    dueDate: "Hạn nộp",
    availableFrom: "Mở từ",
    availableUntil: "Đóng lúc",
    timeLimitMinutes: "Giới hạn thời gian",
    maxAttempts: "Số lần làm tối đa",
    questionBankId: "Ngân hàng câu hỏi",
    questionCount: "Số câu hỏi",
    allowShuffle: "Xáo trộn câu hỏi",
    shuffleOptions: "Xáo trộn đáp án",
    easyPercent: "Tỷ lệ câu dễ (%)",
    mediumPercent: "Tỷ lệ câu trung bình (%)",
    hardPercent: "Tỷ lệ câu khó (%)",
  },
  ResearchMilestone: {
    title: "Tiêu đề cột mốc",
    description: "Mô tả cột mốc",
    milestoneOrder: "Thứ tự cột mốc",
    isCapstone: "Mốc tổng kết",
    assignmentId: "Bài tập nộp",
  },
  Material: {
    title: "Tiêu đề tài liệu",
    description: "Mô tả tài liệu",
    materialType: "Loại tài liệu",
    content: "Nội dung",
    url: "Tệp / liên kết",
    fileUrl: "Tệp",
  },
};

const COMMON_FIELD_LABELS: Record<string, string> = {
  name: "Tên",
  title: "Tiêu đề",
  code: "Mã",
  description: "Mô tả",
  order: "Thứ tự",
};

const DYNAMIC_FIELD_PREFIXES: { prefix: string; label: string }[] = [
  { prefix: "activityLinkRequired:", label: "Bắt buộc nộp ở hoạt động" },
  { prefix: "activityLink:", label: "Hoạt động liên kết" },
  { prefix: "skill:", label: "Kỹ năng" },
];

const ENUM_LABELS_BY_FIELD: Record<string, Record<string, string>> = {
  activityType: ACTIVITY_TYPE_LABELS,
  assignmentType: ASSIGNMENT_TYPE_LABELS,
  level: PROGRAM_LEVEL_LABELS,
  moduleType: MODULE_TYPE_LABELS,
  category: Object.fromEntries(
    Object.entries(PROGRAM_CATEGORY_META).map(([key, meta]) => [key, meta.label]),
  ),
};

export const CHANGE_KIND_LABELS: Record<CurriculumChangeItem["changeKind"], string> = {
  Created: "Thêm mới",
  Updated: "Chỉnh sửa",
  Deleted: "Đã xoá",
  Moved: "Di chuyển",
  Reordered: "Sắp xếp lại",
};

export const CHANGE_KIND_BADGE_CLASSES: Record<CurriculumChangeItem["changeKind"], string> = {
  Created: "bg-emerald-500/10 text-emerald-700",
  Updated: "bg-primary/10 text-primary",
  Deleted: "bg-destructive/10 text-destructive",
  Moved: "bg-amber-500/12 text-amber-800",
  Reordered: "bg-amber-500/12 text-amber-800",
};

/** Vietnamese label for a changed field (dynamic `skill:` / `activityLink:` keys keep the BE suffix). */
export function changeFieldLabel(
  field: CurriculumChangeField,
  targetType: CurriculumTargetType,
): string {
  const key = field.fieldKey;
  const dynamic = DYNAMIC_FIELD_PREFIXES.find((entry) => key.startsWith(entry.prefix));
  if (dynamic) {
    const suffix = labelSuffix(field.label);
    return suffix ? `${dynamic.label}: ${suffix}` : dynamic.label;
  }
  return (
    FIELD_LABELS_BY_TARGET[targetType]?.[key] ??
    COMMON_FIELD_LABELS[key] ??
    (field.label || key || "Trường dữ liệu")
  );
}

/** `LongText` fields render as a word diff; everything else as before → after. */
export function isLongTextField(field: CurriculumChangeField): boolean {
  return field.valueType === "LongText";
}

/** Display text for one scalar value, or `null` when empty. */
export function formatChangeValue(field: CurriculumChangeField, value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;

  switch (field.valueType) {
    case "Boolean":
      return toBoolean(value) ? "Có" : "Không";
    case "DurationMinutes": {
      const minutes = toNumber(value);
      return minutes === null ? stringify(value) : formatMinutes(minutes);
    }
    case "Number": {
      const number = toNumber(value);
      return number === null ? stringify(value) : number.toLocaleString("vi-VN");
    }
    case "Enum": {
      const raw = stringify(value);
      return ENUM_LABELS_BY_FIELD[field.fieldKey]?.[raw] ?? raw;
    }
    case "List":
      return toStringList(value).join(", ") || null;
    case "Media":
      return describeMedia(value);
    case "LongText":
      return toPlainText(value) || null;
    default:
      return stringify(value) || null;
  }
}

/** List items for `List` fields (strings or `{ name | label | title }` objects). */
export function toStringList(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.map(stringify).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/[\n,;]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [stringify(value)].filter(Boolean);
}

/** Plain text for long fields — rich-text HTML is flattened with paragraph breaks kept. */
export function toPlainText(value: unknown): string {
  const raw = stringify(value);
  if (!/<[a-z][\s\S]*>/i.test(raw)) return raw.trim();
  return decodeEntities(
    raw
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Media URL when the value carries one (for thumbnails), else `null`. */
export function mediaUrl(value: unknown): string | null {
  if (typeof value === "string") return /^https?:\/\//i.test(value) ? value : null;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const url = record.url ?? record.fileUrl ?? record.thumbnailUrl;
    return typeof url === "string" && /^https?:\/\//i.test(url) ? url : null;
  }
  return null;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} giờ` : `${hours} giờ ${rest} phút`;
}

function describeMedia(value: unknown): string | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const name = record.fileName ?? record.name ?? record.title;
    if (typeof name === "string" && name) return name;
  }
  if (typeof value === "string") {
    const fileName = value.split(/[?#]/)[0]?.split("/").pop();
    return fileName ? decodeURIComponent(fileName) : "Tệp đính kèm";
  }
  return "Tệp đính kèm";
}

function labelSuffix(label: string): string {
  const index = label.indexOf(":");
  return index >= 0 ? label.slice(index + 1).trim() : "";
}

function stringify(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const named = record.name ?? record.label ?? record.title;
    if (typeof named === "string") return named;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function toNumber(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}
