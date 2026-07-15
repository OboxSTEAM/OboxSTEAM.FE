import { getCourseById } from "@/lib/api/courses";
import type { ModuleCourse } from "@/lib/api/entities/module";
import type { ProgramWithModules } from "@/lib/api/entities/program";
import { getModuleById } from "@/lib/api/modules";

/**
 * Progressive curriculum hydration for the manager tree:
 * 1. `GET /api/programs/{id}` often returns modules with empty `courses`
 * 2. `GET /api/modules/{id}` fills courses (activities may still be empty)
 * 3. `GET /api/courses/{id}` fills nested activities for each course
 */
export async function hydrateProgramCurriculum(
  program: ProgramWithModules,
): Promise<ProgramWithModules> {
  const modules = program.modules ?? [];
  if (modules.length === 0) return program;

  const hydrated = await Promise.all(
    modules.map(async (mod) => {
      try {
        const result = await getModuleById(mod.id);
        const detail = result?.data;
        if (!detail) return mod;

        const courses = detail.courses ?? [];
        const coursesWithActivities = await hydrateCourseActivities(courses);

        return {
          ...mod,
          ...detail,
          courses: coursesWithActivities,
        };
      } catch {
        return mod;
      }
    }),
  );

  return { ...program, modules: hydrated };
}

async function hydrateCourseActivities(courses: ModuleCourse[]): Promise<ModuleCourse[]> {
  if (courses.length === 0) return courses;

  return Promise.all(
    courses.map(async (course) => {
      try {
        const result = await getCourseById(course.id);
        const detail = result?.data;
        if (!detail) return course;

        return {
          ...course,
          ...detail,
          activities: detail.activities ?? [],
        };
      } catch {
        return course;
      }
    }),
  );
}
