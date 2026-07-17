import { z } from "zod";

/** Path param for module-scoped milestone routes. */
export const milestoneModuleParamSchema = z.object({
  moduleId: z.string().uuid("ID module không hợp lệ."),
});

/** Path param for `/api/research-milestones/{milestoneId}`. */
export const milestoneIdParamSchema = z.object({
  milestoneId: z.string().uuid("ID milestone không hợp lệ."),
});

const milestoneAssignmentTypeSchema = z.enum(["Retrospective", "FileUpload", "Quiz"]);

/** Body for `POST /api/modules/{moduleId}/research-milestones`. Dates use `dd/MM/yyyy HH:mm:ss`. */
export const createResearchMilestoneSchema = z.object({
  code: z.string().min(1, "Mã milestone là bắt buộc.").max(50, "Mã tối đa 50 ký tự."),
  title: z.string().min(1, "Tiêu đề milestone là bắt buộc.").max(255, "Tiêu đề tối đa 255 ký tự."),
  description: z.string().nullable().optional(),
  milestoneOrder: z.number().int().min(1, "Thứ tự phải lớn hơn 0."),
  isCapstone: z.boolean().default(false),
  assignmentCode: z.string().min(1, "Mã sản phẩm nộp là bắt buộc.").max(50, "Mã tối đa 50 ký tự."),
  assignmentTitle: z
    .string()
    .min(1, "Tiêu đề sản phẩm nộp là bắt buộc.")
    .max(255, "Tiêu đề tối đa 255 ký tự."),
  assignmentDescription: z.string().nullable().optional(),
  assignmentType: milestoneAssignmentTypeSchema,
  maxPoints: z.number().int().min(0, "Điểm tối đa không được âm."),
  passScore: z.number().min(0, "Điểm đạt không được âm."),
  dueDate: z.string().nullable().optional(),
  availableFrom: z.string().nullable().optional(),
  availableUntil: z.string().nullable().optional(),
  maxAttempts: z.number().int().min(1, "Số lần nộp tối thiểu là 1."),
});

/** Body for `PUT /api/research-milestones/{milestoneId}`. */
export const updateResearchMilestoneSchema = z.object({
  title: z.string().max(255, "Tiêu đề tối đa 255 ký tự.").nullable().optional(),
  description: z.string().nullable().optional(),
  milestoneOrder: z.number().int().min(1, "Thứ tự phải lớn hơn 0.").nullable().optional(),
  isCapstone: z.boolean().nullable().optional(),
  assignmentTitle: z.string().max(255, "Tiêu đề tối đa 255 ký tự.").nullable().optional(),
  assignmentDescription: z.string().nullable().optional(),
  maxPoints: z.number().int().min(0, "Điểm tối đa không được âm.").nullable().optional(),
  passScore: z.number().min(0, "Điểm đạt không được âm.").nullable().optional(),
  dueDate: z.string().nullable().optional(),
  availableFrom: z.string().nullable().optional(),
  availableUntil: z.string().nullable().optional(),
});

/** Body for `POST /api/research-milestones/{milestoneId}/activities`. */
export const linkMilestoneActivitySchema = z.object({
  activityId: z.string().uuid("ID hoạt động không hợp lệ."),
  isRequiredForSubmission: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
  classId: z.string().uuid("ID lớp không hợp lệ.").nullable().optional(),
});

export type MilestoneModuleParam = z.infer<typeof milestoneModuleParamSchema>;
export type MilestoneIdParam = z.infer<typeof milestoneIdParamSchema>;
export type CreateResearchMilestoneInput = z.infer<typeof createResearchMilestoneSchema>;
export type UpdateResearchMilestoneInput = z.infer<typeof updateResearchMilestoneSchema>;
export type LinkMilestoneActivityInput = z.infer<typeof linkMilestoneActivitySchema>;
