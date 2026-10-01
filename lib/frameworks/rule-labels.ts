/**
 * Vietnamese copy for automatic framework rules — shared by the manager banner,
 * the approve dialog and the framework editor preview.
 */

export const FRAMEWORK_CHECK_CODES = [
  "MinModules",
  "MaxModules",
  "CoursesPerModule",
  "TotalHours",
  "MaxActivityDuration",
  "ActivityDurationSet",
  "MinOfflineSessions",
  "MinLiveSessions",
  "OfflineRatio",
  "LiveRatio",
  "AssignmentPerModule",
  "AssignmentPassScore",
  "MaterialsPerActivity",
  "CategoryMatch",
  "DescriptionLength",
  "SkillsGained",
  "ThumbnailSet",
  "RequireCapstoneResearchMilestone",
] as const;

export type FrameworkCheckCode = (typeof FRAMEWORK_CHECK_CODES)[number];

/** Rule values on a framework version; `null`/`false`/missing = rule off. */
export type FrameworkRuleValues = {
  minModules?: number | null;
  maxModules?: number | null;
  minCoursesPerModule?: number | null;
  maxCoursesPerModule?: number | null;
  minTotalHours?: number | null;
  maxTotalHours?: number | null;
  maxActivityMinutes?: number | null;
  requireActivityDuration?: boolean | null;
  minOfflineSessions?: number | null;
  minLiveSessions?: number | null;
  minOfflineRatioPercent?: number | null;
  minLiveRatioPercent?: number | null;
  requireAssignmentPerModule?: boolean | null;
  requireAssignmentPassScore?: boolean | null;
  minMaterialsPerActivity?: number | null;
  requireCategoryMatch?: boolean | null;
  minDescriptionLength?: number | null;
  minSkillsGained?: number | null;
  requireThumbnail?: boolean | null;
  requireCapstoneResearchMilestone?: boolean | null;
};

type CheckLike = {
  code?: string | null;
  label?: string | null;
  expected?: string | null;
  actual?: string | null;
  passed: boolean;
};

/** Pass/fail rules — progress is shown as Đạt/Chưa đạt, not a count. */
const BINARY_CODES = new Set<string>([
  "ActivityDurationSet",
  "AssignmentPerModule",
  "AssignmentPassScore",
  "CategoryMatch",
  "ThumbnailSet",
  "RequireCapstoneResearchMilestone",
]);

/** "At least N" rules — progress reads `actual/expected`. */
const MIN_COUNT_CODES = new Set<string>([
  "MinModules",
  "MinOfflineSessions",
  "MinLiveSessions",
  "DescriptionLength",
  "SkillsGained",
]);

const CHECK_TITLES: Record<FrameworkCheckCode, (expected: string) => string> = {
  MinModules: (e) => `Tối thiểu ${e} học phần`,
  MaxModules: (e) => `Tối đa ${e} học phần`,
  CoursesPerModule: (e) => withExpected("Số khóa học mỗi học phần", e),
  TotalHours: (e) => withExpected("Tổng thời lượng (giờ)", e),
  MaxActivityDuration: (e) => `Mỗi hoạt động tối đa ${e} phút`,
  ActivityDurationSet: () => "Mọi hoạt động đều có thời lượng",
  MinOfflineSessions: (e) => `Tối thiểu ${e} hoạt động offline`,
  MinLiveSessions: (e) => `Tối thiểu ${e} hoạt động live`,
  OfflineRatio: (e) => `Tỷ lệ hoạt động offline tối thiểu ${stripPercent(e)}%`,
  LiveRatio: (e) => `Tỷ lệ hoạt động live tối thiểu ${stripPercent(e)}%`,
  AssignmentPerModule: () => "Mỗi học phần có ít nhất một bài tập",
  AssignmentPassScore: () => "Bài tập có điểm đạt và không vượt điểm tối đa",
  MaterialsPerActivity: (e) => `Mỗi hoạt động có tối thiểu ${e} tài liệu`,
  CategoryMatch: () => "Thể loại chương trình khớp với khung",
  DescriptionLength: (e) => `Mô tả chương trình tối thiểu ${e} ký tự`,
  SkillsGained: (e) => `Tối thiểu ${e} kỹ năng đạt được`,
  ThumbnailSet: () => "Có ảnh đại diện chương trình",
  RequireCapstoneResearchMilestone: () => "Có mốc nghiên cứu / dự án tổng kết",
};

export function isFrameworkCheckCode(code: string | null | undefined): code is FrameworkCheckCode {
  return code != null && (FRAMEWORK_CHECK_CODES as readonly string[]).includes(code);
}

/** Rule title in Vietnamese; unknown codes fall back to the server label. */
export function frameworkCheckTitle(item: CheckLike): string {
  const expected = item.expected?.trim() ?? "";
  if (isFrameworkCheckCode(item.code)) return CHECK_TITLES[item.code](expected);
  return item.label?.trim() || "Yêu cầu khung";
}

/** Short progress text (`3/5`, `Đạt`, `12 giờ`), or `null` when nothing useful to show. */
export function frameworkCheckProgress(item: CheckLike): string | null {
  const actual = item.actual?.trim() ?? "";
  const expected = item.expected?.trim() ?? "";
  if (item.code && BINARY_CODES.has(item.code)) return item.passed ? "Đạt" : "Chưa đạt";
  if (item.code && MIN_COUNT_CODES.has(item.code)) {
    return expected ? `${actual || "0"}/${expected}` : actual || null;
  }
  return actual ? `Hiện tại: ${actual}` : null;
}

/** Human-readable list of the rules a framework version enforces. */
export function buildFrameworkRules(rules: FrameworkRuleValues): string[] {
  const lines: string[] = [];
  const range = (min?: number | null, max?: number | null) =>
    min != null && max != null ? `${min}–${max}` : min != null ? `≥ ${min}` : `≤ ${max}`;

  if (rules.minModules != null) lines.push(`Tối thiểu ${rules.minModules} học phần`);
  if (rules.maxModules != null) lines.push(`Tối đa ${rules.maxModules} học phần`);
  if (rules.minCoursesPerModule != null || rules.maxCoursesPerModule != null) {
    lines.push(
      `Mỗi học phần có ${range(rules.minCoursesPerModule, rules.maxCoursesPerModule)} khóa học`,
    );
  }
  if (rules.minTotalHours != null || rules.maxTotalHours != null) {
    lines.push(`Tổng thời lượng ${range(rules.minTotalHours, rules.maxTotalHours)} giờ`);
  }
  if (rules.maxActivityMinutes != null) {
    lines.push(`Mỗi hoạt động tối đa ${rules.maxActivityMinutes} phút`);
  }
  if (rules.requireActivityDuration) lines.push("Mọi hoạt động phải có thời lượng");
  if (rules.minOfflineSessions != null) {
    lines.push(`Tối thiểu ${rules.minOfflineSessions} hoạt động offline trong curriculum`);
  }
  if (rules.minLiveSessions != null) {
    lines.push(`Tối thiểu ${rules.minLiveSessions} hoạt động live trong curriculum`);
  }
  if (rules.minOfflineRatioPercent != null) {
    lines.push(`Tỷ lệ hoạt động offline tối thiểu ${rules.minOfflineRatioPercent}%`);
  }
  if (rules.minLiveRatioPercent != null) {
    lines.push(`Tỷ lệ hoạt động live tối thiểu ${rules.minLiveRatioPercent}%`);
  }
  if (rules.requireAssignmentPerModule) lines.push("Mỗi học phần có ít nhất một bài tập");
  if (rules.requireAssignmentPassScore) {
    lines.push("Bài tập phải có điểm đạt, không vượt điểm tối đa");
  }
  if (rules.minMaterialsPerActivity != null) {
    lines.push(`Mỗi hoạt động có tối thiểu ${rules.minMaterialsPerActivity} tài liệu`);
  }
  if (rules.requireCategoryMatch) lines.push("Thể loại chương trình phải khớp với khung");
  if (rules.minDescriptionLength != null) {
    lines.push(`Mô tả chương trình tối thiểu ${rules.minDescriptionLength} ký tự`);
  }
  if (rules.minSkillsGained != null) {
    lines.push(`Tối thiểu ${rules.minSkillsGained} kỹ năng đạt được`);
  }
  if (rules.requireThumbnail) lines.push("Bắt buộc có ảnh đại diện chương trình");
  if (rules.requireCapstoneResearchMilestone) {
    lines.push("Bắt buộc có mốc nghiên cứu / dự án tổng kết");
  }
  return lines;
}

function withExpected(title: string, expected: string): string {
  return expected ? `${title}: ${expected}` : title;
}

function stripPercent(value: string): string {
  return value.replace(/\s*%$/, "");
}
