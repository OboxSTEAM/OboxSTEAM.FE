import type { ProgramWithModules } from "@/lib/api/entities/program";

export type MaterialActivityOption = {
  activityId: string;
  label: string;
  /** `Module › Khóa học` breadcrumb. */
  path: string;
};

/**
 * Activities that can receive a material from a chat attachment: self-paced
 * and without a material yet (the server rejects anything else).
 */
export function buildMaterialActivityOptions(
  modules: ProgramWithModules["modules"],
): MaterialActivityOption[] {
  const options: MaterialActivityOption[] = [];
  const sortedModules = [...modules].sort((a, b) => a.moduleOrder - b.moduleOrder);

  for (const programModule of sortedModules) {
    const courses = [...programModule.courses].sort((a, b) => a.courseOrder - b.courseOrder);
    for (const course of courses) {
      const activities = [...course.activities].sort((a, b) => a.activityOrder - b.activityOrder);
      for (const activity of activities) {
        if (activity.activityType !== "SelfPaced" || activity.material) continue;
        options.push({
          activityId: activity.id,
          label: activity.name,
          path: `${programModule.name} › ${course.name}`,
        });
      }
    }
  }
  return options;
}
