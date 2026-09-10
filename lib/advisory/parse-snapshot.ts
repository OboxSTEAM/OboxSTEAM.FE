import type { ActivityType } from "@/lib/api/entities/activity";
import type { Module, ModuleType } from "@/lib/api/entities/module";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asModuleType(value: unknown): ModuleType {
  return value === "Theory" || value === "Experiential" || value === "Research"
    ? value
    : "Theory";
}

function asActivityType(value: unknown): ActivityType {
  return value === "LiveOnline" || value === "Offline" || value === "SelfPaced"
    ? value
    : "SelfPaced";
}

/**
 * Convert the immutable backend snapshot (`order/type`) into the advisory
 * reader shape (`moduleOrder/moduleType`). Never cast snapshot JSON to a live
 * curriculum entity: doing so silently shows the wrong ordering and content.
 */
export function parseCurriculumSnapshot(
  json: string | null | undefined,
): Module[] | null {
  if (!json?.trim()) return null;
  try {
    const parsed = JSON.parse(json) as unknown;
    const document = Array.isArray(parsed) ? null : asRecord(parsed);
    const rawModules = Array.isArray(parsed) ? parsed : asArray(document?.modules);
    const programId = asString(document?.programId, "snapshot");

    if (rawModules.some((value) => asRecord(value) == null)) return null;

    return rawModules.map((value, moduleIndex) => {
      const rawModule = asRecord(value)!;
      const moduleId = asString(rawModule.id, `snapshot-module-${moduleIndex}`);
      const rawActivities = asArray(rawModule.activities)
        .map(asRecord)
        .filter((item): item is JsonRecord => item != null);

      return {
        id: moduleId,
        code: null,
        programId,
        name: asString(rawModule.name, `Học phần ${moduleIndex + 1}`),
        moduleType: asModuleType(rawModule.type),
        moduleOrder: asNumber(rawModule.order, moduleIndex + 1),
        prerequisiteModuleId: null,
        isMandatory: true,
        learningOutcomes: asArray(rawModule.learningOutcomes).filter(
          (item): item is string => typeof item === "string",
        ),
        createdAt: "",
        updatedAt: null,
        courses: asArray(rawModule.courses)
          .map(asRecord)
          .filter((item): item is JsonRecord => item != null)
          .map((rawCourse, courseIndex) => {
            const courseId = asString(
              rawCourse.id,
              `snapshot-course-${moduleIndex}-${courseIndex}`,
            );
            return {
              id: courseId,
              code: null,
              moduleId,
              mentorId: null,
              name: asString(rawCourse.name, `Khóa ${courseIndex + 1}`),
              description: asString(rawCourse.description) || null,
              courseOrder: asNumber(rawCourse.order, courseIndex + 1),
              createdAt: null,
              updatedAt: null,
              activities: rawActivities
                .filter((activity) => asString(activity.courseId) === courseId)
                .map((activity, activityIndex) => ({
                  id: asString(
                    activity.id,
                    `snapshot-activity-${moduleIndex}-${courseIndex}-${activityIndex}`,
                  ),
                  code: null,
                  courseId,
                  name: asString(activity.name, `Hoạt động ${activityIndex + 1}`),
                  activityType: asActivityType(activity.type),
                  description: asString(activity.description) || null,
                  activityOrder: asNumber(activity.order, activityIndex + 1),
                  durationMinutes: null,
                  requireQrCheckin: false,
                  requireMediaEvidence: false,
                  createdAt: null,
                  updatedAt: null,
                  material: null,
                  learningProgress: null,
                })),
            };
          }),
      } satisfies Module;
    });
  } catch {
    return null;
  }
}

export type RubricSnapshotCriterion = {
  id: string;
  name: string;
  description?: string;
  evidenceGuidance?: string;
  maxScore: number;
  displayOrder: number;
};

/** Parse rubric snapshot JSON from a review submission. */
export function parseRubricSnapshot(
  json: string | null | undefined,
): RubricSnapshotCriterion[] {
  if (!json?.trim()) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    const criteria = Array.isArray(parsed)
      ? parsed
      : parsed &&
          typeof parsed === "object" &&
          "criteria" in parsed &&
          Array.isArray((parsed as { criteria: unknown }).criteria)
        ? (parsed as { criteria: RubricSnapshotCriterion[] }).criteria
        : [];
    return [...criteria].sort(
      (left, right) => left.displayOrder - right.displayOrder,
    );
  } catch {
    return [];
  }
}
