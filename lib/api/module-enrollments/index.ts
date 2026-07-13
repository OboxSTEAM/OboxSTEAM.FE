import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import { moduleEnrollmentIdParamSchema } from "@/lib/validations/module-enrollments";

import {
  getModuleEnrollmentResearchMilestoneProgressResponseSchema,
  type GetModuleEnrollmentResearchMilestoneProgressResult,
} from "./schemas";

export type {
  GetModuleEnrollmentResearchMilestoneProgressResponse,
  GetModuleEnrollmentResearchMilestoneProgressResult,
} from "./schemas";

export type {
  StudentMilestoneActivityProgress,
  StudentMilestoneItemProgress,
  StudentMilestoneProgress,
} from "@/lib/api/entities/research-milestone-progress";

export type { ModuleEnrollmentIdParam } from "@/lib/validations/module-enrollments";

const MODULE_ENROLLMENTS_BASE = "/api/module-enrollments";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

/** `GET /api/module-enrollments/{moduleEnrollmentId}/research-milestones/progress` */
export async function getModuleEnrollmentResearchMilestoneProgress(
  moduleEnrollmentId: string,
): Promise<GetModuleEnrollmentResearchMilestoneProgressResult> {
  const { moduleEnrollmentId: parsedModuleEnrollmentId } =
    moduleEnrollmentIdParamSchema.parse({ moduleEnrollmentId });

  const response = await apiFetchParsed(
    `${MODULE_ENROLLMENTS_BASE}/${parsedModuleEnrollmentId}/research-milestones/progress`,
    getModuleEnrollmentResearchMilestoneProgressResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
