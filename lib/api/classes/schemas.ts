import { z } from "zod";

import { classSchema, classWithSessionsSchema } from "@/lib/api/entities/class";
import {
  classSessionSchema,
  classSessionWithStudentsSchema,
} from "@/lib/api/entities/class-session";
import { createPaginatedSchema } from "@/lib/api/entities/pagination";
import { sessionAttendanceSchema } from "@/lib/api/entities/session-attendance";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const paginatedClassesSchema = createPaginatedSchema(classSchema);
export const paginatedClassSessionsSchema = createPaginatedSchema(classSessionSchema);
export const paginatedSessionAttendanceSchema =
  createPaginatedSchema(sessionAttendanceSchema);

export const classesListValueSchema = createApiValueSchema(paginatedClassesSchema);
export const classValueSchema = createApiValueSchema(classSchema);
export const classWithStudentsValueSchema = createApiValueSchema(classSchema);
export const classWithSessionsValueSchema = createApiValueSchema(classWithSessionsSchema);
export const classSessionsListValueSchema = createApiValueSchema(paginatedClassSessionsSchema);
export const classSessionValueSchema = createApiValueSchema(classSessionSchema);
export const classSessionWithStudentsValueSchema = createApiValueSchema(
  classSessionWithStudentsSchema,
);
export const deleteClassSessionValueSchema = createApiValueSchema(z.boolean());
export const sessionAttendanceListValueSchema = createApiValueSchema(
  paginatedSessionAttendanceSchema,
);
export const sessionAttendanceValueSchema = createApiValueSchema(sessionAttendanceSchema);

export const getClassesResponseSchema = createApiResponseSchema(classesListValueSchema);
export const classResponseSchema = createApiResponseSchema(classValueSchema);
export const getClassWithStudentsResponseSchema = createApiResponseSchema(
  classWithStudentsValueSchema,
);
export const getClassWithSessionsResponseSchema = createApiResponseSchema(
  classWithSessionsValueSchema,
);
export const getClassSessionsResponseSchema = createApiResponseSchema(
  classSessionsListValueSchema,
);
export const classSessionResponseSchema = createApiResponseSchema(classSessionValueSchema);
export const getClassSessionWithStudentsResponseSchema = createApiResponseSchema(
  classSessionWithStudentsValueSchema,
);
export const deleteClassSessionResponseSchema = createApiResponseSchema(
  deleteClassSessionValueSchema,
);
export const getSessionAttendanceResponseSchema = createApiResponseSchema(
  sessionAttendanceListValueSchema,
);
export const sessionAttendanceResponseSchema = createApiResponseSchema(
  sessionAttendanceValueSchema,
);

export type GetClassesResponse = z.infer<typeof getClassesResponseSchema>;
export type GetClassesResult = GetClassesResponse["value"];

export type ClassResponse = z.infer<typeof classResponseSchema>;
export type ClassResult = ClassResponse["value"];

export type GetClassWithStudentsResponse = z.infer<
  typeof getClassWithStudentsResponseSchema
>;
export type GetClassWithStudentsResult = GetClassWithStudentsResponse["value"];

export type GetClassWithSessionsResponse = z.infer<
  typeof getClassWithSessionsResponseSchema
>;
export type GetClassWithSessionsResult = GetClassWithSessionsResponse["value"];

export type GetClassSessionsResponse = z.infer<typeof getClassSessionsResponseSchema>;
export type GetClassSessionsResult = GetClassSessionsResponse["value"];

export type ClassSessionResponse = z.infer<typeof classSessionResponseSchema>;
export type ClassSessionResult = ClassSessionResponse["value"];

export type GetClassSessionWithStudentsResponse = z.infer<
  typeof getClassSessionWithStudentsResponseSchema
>;
export type GetClassSessionWithStudentsResult =
  GetClassSessionWithStudentsResponse["value"];

export type DeleteClassSessionResponse = z.infer<typeof deleteClassSessionResponseSchema>;
export type DeleteClassSessionResult = DeleteClassSessionResponse["value"];

export type GetSessionAttendanceResponse = z.infer<
  typeof getSessionAttendanceResponseSchema
>;
export type GetSessionAttendanceResult = GetSessionAttendanceResponse["value"];

export type SessionAttendanceResponse = z.infer<typeof sessionAttendanceResponseSchema>;
export type SessionAttendanceResult = SessionAttendanceResponse["value"];
