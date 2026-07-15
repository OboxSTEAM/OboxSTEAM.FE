/** Curriculum focus kind mirrored in Platform sidebar under Chương trình học. */
export type PlatformCurriculumFocus =
  | "program"
  | "module"
  | "course"
  | "activity";

export type CurriculumUrlNode =
  | "program"
  | "module"
  | "module-new"
  | "course"
  | "course-new"
  | "activity"
  | "activity-new";

const PROGRAM_DETAIL_RE =
  /^\/manager\/programs\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

export function matchProgramDetailId(pathname: string): string | null {
  return pathname.match(PROGRAM_DETAIL_RE)?.[1] ?? null;
}

export function platformFocusFromNode(
  node: string | null,
): PlatformCurriculumFocus | null {
  if (!node || node === "program") return "program";
  if (node === "module" || node === "module-new") return "module";
  if (node === "course" || node === "course-new") return "course";
  if (node === "activity" || node === "activity-new") return "activity";
  return null;
}

export function platformFocusFromPath(
  pathname: string,
  node: string | null,
): PlatformCurriculumFocus | null {
  if (!matchProgramDetailId(pathname)) return null;
  return platformFocusFromNode(node);
}

/** Map Platform sub-nav title → focus kind for program-detail sync. */
export function focusFromNavTitle(title: string): PlatformCurriculumFocus | null {
  switch (title) {
    case "Chương trình":
      return "program";
    case "Module":
      return "module";
    case "Khóa học":
      return "course";
    case "Hoạt động":
      return "activity";
    default:
      return null;
  }
}
