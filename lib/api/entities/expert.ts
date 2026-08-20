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

const optionalYearResponseSchema = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null || value === "") return null;
    const year = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(year) || !Number.isInteger(year) || year === 0) {
      return null;
    }
    return year;
  });

const optionalExpertIdSchema = z
  .union([z.string().uuid(), z.literal(""), z.null(), z.undefined()])
  .transform((value) => value || "");

export const expertDegreeSchema = z.object({
  id: z.string().uuid(),
  expertId: optionalExpertIdSchema,
  title: nullableStringSchema,
  institution: nullableStringSchema,
  year: optionalYearResponseSchema,
});

export type ExpertDegree = z.infer<typeof expertDegreeSchema>;

export const expertPublicationSchema = z.object({
  id: z.string().uuid(),
  expertId: optionalExpertIdSchema,
  title: nullableStringSchema,
  venue: nullableStringSchema,
  year: optionalYearResponseSchema,
  url: nullableStringSchema,
});

export type ExpertPublication = z.infer<typeof expertPublicationSchema>;

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
  specialization: z
    .array(z.string())
    .nullish()
    .transform((value) => value ?? []),
  createdAt: z.string(),
  updatedAt: nullableStringSchema,
  programs: z.array(expertProgramSchema).nullish().transform((value) => value ?? []),
  degrees: z.array(expertDegreeSchema).nullish().transform((value) => value ?? []),
  publications: z
    .array(expertPublicationSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export type Expert = z.infer<typeof expertSchema>;
