import type {
  FrameworkRuleFields,
  UpdateProgramFrameworkInput,
} from "@/lib/api";
import type { FrameworkEditorFormValues } from "@/lib/validations/program-frameworks";

import type { FrameworkRuleValues } from "./rule-labels";

export const NUMERIC_RULE_KEYS = [
  "minModules",
  "maxModules",
  "minCoursesPerModule",
  "maxCoursesPerModule",
  "minTotalHours",
  "maxTotalHours",
  "maxActivityMinutes",
  "minOfflineSessions",
  "minLiveSessions",
  "minOfflineRatioPercent",
  "minLiveRatioPercent",
  "minMaterialsPerActivity",
  "minDescriptionLength",
  "minSkillsGained",
] as const satisfies readonly (keyof FrameworkRuleFields)[];

export const BOOLEAN_RULE_KEYS = [
  "requireActivityDuration",
  "requireAssignmentPerModule",
  "requireAssignmentPassScore",
  "requireCategoryMatch",
  "requireThumbnail",
  "requireCapstoneResearchMilestone",
] as const satisfies readonly (keyof FrameworkRuleFields)[];

export type NumericRuleKey = (typeof NUMERIC_RULE_KEYS)[number];
export type BooleanRuleKey = (typeof BOOLEAN_RULE_KEYS)[number];

export type FrameworkRuleItem =
  | { kind: "number"; key: NumericRuleKey; label: string; hint: string; unit: string }
  | {
      kind: "range";
      minKey: NumericRuleKey;
      maxKey: NumericRuleKey;
      label: string;
      hint: string;
      unit: string;
    }
  | { kind: "boolean"; key: BooleanRuleKey; label: string; hint: string };

export type FrameworkRuleGroup = {
  id: string;
  title: string;
  items: FrameworkRuleItem[];
};

/** Editor layout; every rule key appears exactly once. */
export const FRAMEWORK_RULE_GROUPS: FrameworkRuleGroup[] = [
  {
    id: "structure",
    title: "Cấu trúc",
    items: [
      {
        kind: "range",
        minKey: "minModules",
        maxKey: "maxModules",
        label: "Số học phần",
        hint: "Tổng số học phần trong curriculum.",
        unit: "học phần",
      },
      {
        kind: "range",
        minKey: "minCoursesPerModule",
        maxKey: "maxCoursesPerModule",
        label: "Số khóa học mỗi học phần",
        hint: "Áp dụng riêng cho từng học phần.",
        unit: "khóa",
      },
    ],
  },
  {
    id: "duration",
    title: "Thời lượng",
    items: [
      {
        kind: "range",
        minKey: "minTotalHours",
        maxKey: "maxTotalHours",
        label: "Tổng thời lượng",
        hint: "Cộng dồn thời lượng của mọi hoạt động.",
        unit: "giờ",
      },
      {
        kind: "number",
        key: "maxActivityMinutes",
        label: "Thời lượng tối đa mỗi hoạt động",
        hint: "Tránh hoạt động quá dài so với khả năng tập trung của học viên.",
        unit: "phút",
      },
      {
        kind: "boolean",
        key: "requireActivityDuration",
        label: "Hoạt động online/offline phải có thời lượng",
        hint: "Hoạt động online/offline chưa nhập thời lượng sẽ bị đánh dấu chưa đạt. Hoạt động tự học được miễn.",
      },
    ],
  },
  {
    id: "delivery",
    title: "Hình thức học",
    items: [
      {
        kind: "number",
        key: "minOfflineSessions",
        label: "Hoạt động offline tối thiểu",
        hint: "Đếm hoạt động mẫu trong curriculum, không phải lịch lớp.",
        unit: "hoạt động",
      },
      {
        kind: "number",
        key: "minLiveSessions",
        label: "Hoạt động live tối thiểu",
        hint: "Đếm hoạt động mẫu trong curriculum, không phải lịch lớp.",
        unit: "hoạt động",
      },
      {
        kind: "number",
        key: "minOfflineRatioPercent",
        label: "Tỷ lệ offline tối thiểu",
        hint: "Phần trăm hoạt động offline trên tổng số hoạt động.",
        unit: "%",
      },
      {
        kind: "number",
        key: "minLiveRatioPercent",
        label: "Tỷ lệ live tối thiểu",
        hint: "Phần trăm hoạt động live trên tổng số hoạt động.",
        unit: "%",
      },
    ],
  },
  {
    id: "assessment",
    title: "Bài tập & tài liệu",
    items: [
      {
        kind: "boolean",
        key: "requireAssignmentPerModule",
        label: "Mỗi học phần có ít nhất một bài tập",
        hint: "Học viên cần được đánh giá ở từng học phần.",
      },
      {
        kind: "boolean",
        key: "requireAssignmentPassScore",
        label: "Bài tập phải có điểm đạt",
        hint: "Điểm đạt được nhập và không vượt quá điểm tối đa.",
      },
      {
        kind: "number",
        key: "minMaterialsPerActivity",
        label: "Tài liệu tối thiểu mỗi hoạt động",
        hint: "Học liệu đính kèm để học viên và mentor tham khảo.",
        unit: "tài liệu",
      },
      {
        kind: "boolean",
        key: "requireCapstoneResearchMilestone",
        label: "Bắt buộc có mốc nghiên cứu / capstone",
        hint: "Ít nhất một mốc tổng hợp để học viên vận dụng kiến thức.",
      },
    ],
  },
  {
    id: "profile",
    title: "Hồ sơ chương trình",
    items: [
      {
        kind: "number",
        key: "minDescriptionLength",
        label: "Độ dài mô tả tối thiểu",
        hint: "Mô tả học viên đọc trước khi đăng ký.",
        unit: "ký tự",
      },
      {
        kind: "number",
        key: "minSkillsGained",
        label: "Kỹ năng đạt được tối thiểu",
        hint: "Số kỹ năng gắn với chương trình.",
        unit: "kỹ năng",
      },
      {
        kind: "boolean",
        key: "requireCategoryMatch",
        label: "Lĩnh vực chương trình khớp với khung",
        hint: "Chương trình phải cùng lĩnh vực STEAM với bộ khung.",
      },
      {
        kind: "boolean",
        key: "requireThumbnail",
        label: "Bắt buộc có ảnh đại diện",
        hint: "Chương trình cần ảnh đại diện trước khi chấp thuận.",
      },
    ],
  },
];

type FrameworkRuleFormValues = Pick<
  FrameworkEditorFormValues,
  NumericRuleKey | BooleanRuleKey
>;

/** Seed editor inputs from a saved framework version (`""` = rule off). */
export function toFrameworkRuleFormValues(
  rules: FrameworkRuleValues,
): FrameworkRuleFormValues {
  const values = {} as FrameworkRuleFormValues;
  for (const key of NUMERIC_RULE_KEYS) {
    values[key] = rules[key] != null ? String(rules[key]) : "";
  }
  for (const key of BOOLEAN_RULE_KEYS) {
    values[key] = rules[key] === true;
  }
  return values;
}

/** Rule values from (possibly mid-edit) form inputs; unparseable text counts as off. */
export function toFrameworkRuleValues(
  values: Partial<FrameworkRuleFormValues>,
): FrameworkRuleValues {
  const rules: FrameworkRuleValues = {};
  for (const key of NUMERIC_RULE_KEYS) rules[key] = toRuleNumber(values[key]);
  for (const key of BOOLEAN_RULE_KEYS) rules[key] = values[key] === true;
  return rules;
}

/** Update payload: blank numeric rules send `clear<Field>: true`, since `null` means "unchanged". */
export function toFrameworkRuleUpdate(
  values: FrameworkRuleFormValues,
): Partial<UpdateProgramFrameworkInput> {
  const payload: Record<string, number | boolean | null> = {};
  for (const key of NUMERIC_RULE_KEYS) {
    const value = toRuleNumber(values[key]);
    payload[key] = value;
    payload[`clear${key.charAt(0).toUpperCase()}${key.slice(1)}`] = value == null;
  }
  for (const key of BOOLEAN_RULE_KEYS) payload[key] = values[key];
  return payload as Partial<UpdateProgramFrameworkInput>;
}

function toRuleNumber(value: string | undefined): number | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
}
