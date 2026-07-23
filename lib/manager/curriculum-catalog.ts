import type { ProgramWithModules } from "@/lib/api";

export type CurriculumCourseRef = {
  programId: string;
  programName: string;
  moduleId: string;
  moduleName: string;
  courseId: string;
  courseName: string;
};

export type CurriculumModuleRef = {
  programId: string;
  programName: string;
  moduleId: string;
  moduleName: string;
  moduleType: string;
};

/** Flatten courses across hydrated programs for catalog deep-links. */
export function buildCourseIndex(
  programs: ProgramWithModules[],
): Map<string, CurriculumCourseRef> {
  const map = new Map<string, CurriculumCourseRef>();
  for (const program of programs) {
    for (const mod of program.modules ?? []) {
      for (const course of mod.courses ?? []) {
        map.set(course.id, {
          programId: program.id,
          programName: program.name,
          moduleId: mod.id,
          moduleName: mod.name,
          courseId: course.id,
          courseName: course.name,
        });
      }
    }
  }
  return map;
}

export function buildModuleIndex(
  programs: ProgramWithModules[],
): Map<string, CurriculumModuleRef> {
  const map = new Map<string, CurriculumModuleRef>();
  for (const program of programs) {
    for (const mod of program.modules ?? []) {
      map.set(mod.id, {
        programId: program.id,
        programName: program.name,
        moduleId: mod.id,
        moduleName: mod.name,
        moduleType: mod.moduleType,
      });
    }
  }
  return map;
}

export function courseEditHref(ref: CurriculumCourseRef): string {
  const params = new URLSearchParams({
    node: "course",
    id: ref.courseId,
    moduleId: ref.moduleId,
  });
  return `/manager/programs/${ref.programId}?${params.toString()}`;
}

/** Deep-link from question-bank list row into curriculum course editor. */
export function questionBankEditHref(row: {
  programId: string;
  courseId: string;
  moduleId: string;
}): string {
  return courseEditHref({
    programId: row.programId,
    programName: "",
    moduleId: row.moduleId,
    moduleName: "",
    courseId: row.courseId,
    courseName: "",
  });
}

export function assignmentEditHref(
  programId: string,
  moduleId: string,
  assignmentId: string,
): string {
  const params = new URLSearchParams({
    node: "assignment",
    id: assignmentId,
    moduleId,
  });
  return `/manager/programs/${programId}?${params.toString()}`;
}

export function milestoneEditHref(
  programId: string,
  moduleId: string,
  milestoneId: string,
): string {
  const params = new URLSearchParams({
    node: "milestone",
    id: milestoneId,
    moduleId,
  });
  return `/manager/programs/${programId}?${params.toString()}`;
}
