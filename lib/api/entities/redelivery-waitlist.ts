import { z } from "zod";

/** `RedeliveryWaitlistModuleGroupDto` */
export const redeliveryWaitlistModuleGroupSchema = z.object({
  moduleId: z.string().uuid(),
  moduleCode: z.string().nullable(),
  moduleName: z.string().nullable(),
  waitingCount: z.number().int(),
  oldestWaitingDays: z.number().int(),
});

/** `RedeliveryWaitlistProgramGroupDto` */
export const redeliveryWaitlistProgramGroupSchema = z.object({
  programId: z.string().uuid(),
  programCode: z.string().nullable(),
  programName: z.string().nullable(),
  modules: z
    .array(redeliveryWaitlistModuleGroupSchema)
    .nullish()
    .transform((value) => value ?? []),
});

/** `OpenRemedialClassResponseDto` */
export const openRemedialClassResultSchema = z.object({
  classId: z.string().uuid(),
  classCode: z.string().nullable(),
  className: z.string().nullable(),
  offeredRequestCount: z.number().int(),
});

export type RedeliveryWaitlistModuleGroup = z.infer<
  typeof redeliveryWaitlistModuleGroupSchema
>;
export type RedeliveryWaitlistProgramGroup = z.infer<
  typeof redeliveryWaitlistProgramGroupSchema
>;
export type OpenRemedialClassResult = z.infer<typeof openRemedialClassResultSchema>;
