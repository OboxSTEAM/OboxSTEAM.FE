import { z } from "zod";

/** Body for `POST /api/activity-progresses/force-complete` (Mentor/Manager). */
export const forceCompleteActivitySchema = z.object({
  studentId: z.string().uuid("ID học viên không hợp lệ."),
  activityId: z.string().uuid("ID hoạt động không hợp lệ."),
});

export type ForceCompleteActivityInput = z.infer<typeof forceCompleteActivitySchema>;
