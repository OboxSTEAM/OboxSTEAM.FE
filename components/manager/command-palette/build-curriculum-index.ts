import type { ProgramWithModules } from "@/lib/api";

export type CurriculumSearchKind =
  | "program"
  | "module"
  | "course"
  | "activity";

export type CurriculumSearchItem = {
  id: string;
  kind: CurriculumSearchKind;
  name: string;
  code: string | null;
  parentPath: string;
  issueHint: string | null;
  programId: string;
  moduleId?: string;
  courseId?: string;
  href: string;
};

function nodeHref(
  programId: string,
  kind: CurriculumSearchKind,
  id: string,
  moduleId?: string,
  courseId?: string,
): string {
  const params = new URLSearchParams({ node: kind, id });
  if (moduleId) params.set("moduleId", moduleId);
  if (courseId) params.set("courseId", courseId);
  return `/manager/programs/${programId}?${params.toString()}`;
}

function issueForModule(courseCount: number, code: string | null | undefined): string | null {
  if (!code) return "Thiếu mã";
  if (courseCount === 0) return "Chưa có khóa học";
  return null;
}

function issueForCourse(activityCount: number, code: string | null | undefined): string | null {
  if (!code) return "Thiếu mã";
  if (activityCount === 0) return "Chưa có hoạt động";
  return null;
}

function issueForActivity(
  activityType: string,
  hasMaterial: boolean,
  code: string | null | undefined,
): string | null {
  if (!code) return "Thiếu mã";
  if (activityType === "SelfPaced" && !hasMaterial) return "Thiếu tài liệu";
  return null;
}

/** Flatten nested curriculum trees into searchable command-palette rows. */
export function buildCurriculumIndex(
  programs: ProgramWithModules[],
): CurriculumSearchItem[] {
  const items: CurriculumSearchItem[] = [];

  for (const program of programs) {
    const modules = [...(program.modules || [])].sort(
      (a, b) => a.moduleOrder - b.moduleOrder,
    );

    items.push({
      id: program.id,
      kind: "program",
      name: program.name,
      code: program.code,
      parentPath: "Platform",
      issueHint: modules.length === 0 ? "Chưa có học phần" : null,
      programId: program.id,
      href: `/manager/programs/${program.id}`,
    });

    for (const mod of modules) {
      const courses = [...(mod.courses || [])];
      items.push({
        id: mod.id,
        kind: "module",
        name: mod.name,
        code: mod.code ?? null,
        parentPath: program.name,
        issueHint: issueForModule(courses.length, mod.code),
        programId: program.id,
        moduleId: mod.id,
        href: nodeHref(program.id, "module", mod.id),
      });

      for (const course of courses) {
        const activities = [...(course.activities || [])].sort(
          (a, b) => a.activityOrder - b.activityOrder,
        );
        items.push({
          id: course.id,
          kind: "course",
          name: course.name,
          code: course.code ?? null,
          parentPath: `${program.name} › ${mod.name}`,
          issueHint: issueForCourse(activities.length, course.code),
          programId: program.id,
          moduleId: mod.id,
          courseId: course.id,
          href: nodeHref(program.id, "course", course.id, mod.id),
        });

        for (const activity of activities) {
          items.push({
            id: activity.id,
            kind: "activity",
            name: activity.name,
            code: activity.code ?? null,
            parentPath: `${program.name} › ${mod.name} › ${course.name}`,
            issueHint: issueForActivity(
              activity.activityType,
              !!activity.material,
              activity.code,
            ),
            programId: program.id,
            moduleId: mod.id,
            courseId: course.id,
            href: nodeHref(
              program.id,
              "activity",
              activity.id,
              mod.id,
              course.id,
            ),
          });
        }
      }
    }
  }

  return items;
}

export const SEARCH_KIND_LABELS: Record<CurriculumSearchKind, string> = {
  program: "Chương trình",
  module: "Module",
  course: "Khóa học",
  activity: "Hoạt động",
};

export const SEARCH_KIND_ORDER: CurriculumSearchKind[] = [
  "program",
  "module",
  "course",
  "activity",
];
