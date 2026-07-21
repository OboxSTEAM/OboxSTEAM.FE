import { z } from "zod";

/** Backend may send null for optional text fields. */
const nullableStringSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => value ?? "");

const programExpertInputSchema = z.object({
  /** Program board payload uses `expertId`; some endpoints may send `id`. */
  expertId: z.string().uuid().nullish(),
  id: z.string().uuid().nullish(),
  code: nullableStringSchema,
  fullName: nullableStringSchema,
  title: nullableStringSchema,
  organization: nullableStringSchema,
  avatarUrl: nullableStringSchema,
  linkedInUrl: nullableStringSchema,
  roleInBoard: nullableStringSchema,
});

export const programExpertSchema = programExpertInputSchema.transform(
  (expert) => {
    const expertId = expert.expertId ?? expert.id;
    if (!expertId) {
      throw new z.ZodError([
        {
          code: "custom",
          message: "Thiếu mã chuyên gia (expertId hoặc id).",
          path: ["expertId"],
        },
      ]);
    }

    return {
      expertId,
      code: expert.code,
      fullName: expert.fullName,
      title: expert.title,
      organization: expert.organization,
      avatarUrl: expert.avatarUrl,
      linkedInUrl: expert.linkedInUrl,
      roleInBoard: expert.roleInBoard,
    };
  },
);

export type ProgramExpert = z.infer<typeof programExpertSchema>;

export const expertProgramSchema = z.object({
  programId: z.string().uuid(),
  code: nullableStringSchema,
  name: nullableStringSchema,
  roleInBoard: nullableStringSchema,
});

export type ExpertProgram = z.infer<typeof expertProgramSchema>;

export const expertSchema = z.object({
  id: z.string().uuid(),
  code: nullableStringSchema,
  userId: nullableStringSchema,
  fullName: nullableStringSchema,
  title: nullableStringSchema,
  organization: nullableStringSchema,
  bio: nullableStringSchema,
  avatarUrl: nullableStringSchema,
  linkedInUrl: nullableStringSchema,
  achievements: nullableStringSchema,
  createdAt: z.string(),
  updatedAt: nullableStringSchema,
  programs: z.array(expertProgramSchema).nullish().transform((value) => value ?? []),
});

export type Expert = z.infer<typeof expertSchema>;
