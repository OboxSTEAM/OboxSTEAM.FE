import { z } from "zod";

import {
  assignmentDetailSchema,
  assignmentListItemSchema,
} from "@/lib/api/entities/assignment";
import { createPaginatedSchema } from "@/lib/api/entities/pagination";
import {
  quizAttemptSchema,
  quizResultSchema,
  saveQuizDraftResultSchema,
} from "@/lib/api/entities/quiz";
import {
  retrospectiveAttemptSchema,
  saveRetrospectiveDraftResultSchema,
} from "@/lib/api/entities/retrospective";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const assignmentDetailValueSchema = createApiValueSchema(assignmentDetailSchema);

export const paginatedAssignmentsSchema = createPaginatedSchema(assignmentListItemSchema);
export const assignmentsListValueSchema = createApiValueSchema(paginatedAssignmentsSchema);
export const getAssignmentsResponseSchema = createApiResponseSchema(
  assignmentsListValueSchema,
);

/* ─── Manager CRUD ─────────────────────────────────────────────────────────── */
export const assignmentMutationValueSchema = createApiValueSchema(assignmentDetailSchema);
export const createAssignmentResponseSchema = createApiResponseSchema(
  assignmentMutationValueSchema,
);
export const updateAssignmentResponseSchema = createApiResponseSchema(
  assignmentMutationValueSchema,
);
export const deleteAssignmentResponseSchema = createApiResponseSchema(z.unknown());

export type CreateAssignmentResponse = z.infer<typeof createAssignmentResponseSchema>;
export type CreateAssignmentResult = CreateAssignmentResponse["value"];
export type UpdateAssignmentResponse = z.infer<typeof updateAssignmentResponseSchema>;
export type UpdateAssignmentResult = UpdateAssignmentResponse["value"];

export type GetAssignmentsResponse = z.infer<typeof getAssignmentsResponseSchema>;
export type GetAssignmentsResult = GetAssignmentsResponse["value"];

export const quizAttemptValueSchema = createApiValueSchema(quizAttemptSchema);

export const saveQuizDraftResultValueSchema = createApiValueSchema(saveQuizDraftResultSchema);

export const quizResultValueSchema = createApiValueSchema(quizResultSchema);

export const getAssignmentByIdResponseSchema = createApiResponseSchema(
  assignmentDetailValueSchema,
);

export const startQuizAttemptResponseSchema = createApiResponseSchema(quizAttemptValueSchema);

export const getInProgressQuizResponseSchema = createApiResponseSchema(quizAttemptValueSchema);

export const saveQuizDraftAnswersResponseSchema = createApiResponseSchema(
  saveQuizDraftResultValueSchema,
);

export const submitQuizResponseSchema = createApiResponseSchema(quizResultValueSchema);

export const getQuizResultResponseSchema = createApiResponseSchema(quizResultValueSchema);

export const retrospectiveAttemptValueSchema = createApiValueSchema(
  retrospectiveAttemptSchema,
);

export const saveRetrospectiveDraftResultValueSchema = createApiValueSchema(
  saveRetrospectiveDraftResultSchema,
);

export const startRetrospectiveAttemptResponseSchema = createApiResponseSchema(
  retrospectiveAttemptValueSchema,
);

export const getRetrospectiveSubmissionResponseSchema = createApiResponseSchema(
  retrospectiveAttemptValueSchema,
);

export const saveRetrospectiveDraftResponseSchema = createApiResponseSchema(
  saveRetrospectiveDraftResultValueSchema,
);

export const submitRetrospectiveResponseSchema = createApiResponseSchema(
  retrospectiveAttemptValueSchema,
);

export type GetAssignmentByIdResponse = z.infer<typeof getAssignmentByIdResponseSchema>;
export type GetAssignmentByIdResult = GetAssignmentByIdResponse["value"];

export type StartQuizAttemptResponse = z.infer<typeof startQuizAttemptResponseSchema>;
export type StartQuizAttemptResult = StartQuizAttemptResponse["value"];

export type GetInProgressQuizResponse = z.infer<typeof getInProgressQuizResponseSchema>;
export type GetInProgressQuizResult = GetInProgressQuizResponse["value"];

export type SaveQuizDraftAnswersResponse = z.infer<
  typeof saveQuizDraftAnswersResponseSchema
>;
export type SaveQuizDraftAnswersResult = SaveQuizDraftAnswersResponse["value"];

export type SubmitQuizResponse = z.infer<typeof submitQuizResponseSchema>;
export type SubmitQuizResult = SubmitQuizResponse["value"];

export type GetQuizResultResponse = z.infer<typeof getQuizResultResponseSchema>;
export type GetQuizResultResult = GetQuizResultResponse["value"];

export type StartRetrospectiveAttemptResponse = z.infer<
  typeof startRetrospectiveAttemptResponseSchema
>;
export type StartRetrospectiveAttemptResult = StartRetrospectiveAttemptResponse["value"];

export type GetRetrospectiveSubmissionResponse = z.infer<
  typeof getRetrospectiveSubmissionResponseSchema
>;
export type GetRetrospectiveSubmissionResult = GetRetrospectiveSubmissionResponse["value"];

export type SaveRetrospectiveDraftResponse = z.infer<
  typeof saveRetrospectiveDraftResponseSchema
>;
export type SaveRetrospectiveDraftResult = SaveRetrospectiveDraftResponse["value"];

export type SubmitRetrospectiveResponse = z.infer<typeof submitRetrospectiveResponseSchema>;
export type SubmitRetrospectiveResult = SubmitRetrospectiveResponse["value"];
