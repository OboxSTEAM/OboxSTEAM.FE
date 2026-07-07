import { z } from "zod";

import { classSchema } from "@/lib/api/entities/class";
import { classSessionSchema } from "@/lib/api/entities/class-session";
import { createPaginatedSchema } from "@/lib/api/entities/pagination";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const paginatedClassesSchema = createPaginatedSchema(classSchema);
export const paginatedClassSessionsSchema = createPaginatedSchema(classSessionSchema);

export const classesListValueSchema = createApiValueSchema(paginatedClassesSchema);
export const classWithStudentsValueSchema = createApiValueSchema(classSchema);
export const classSessionsListValueSchema = createApiValueSchema(paginatedClassSessionsSchema);

export const getClassesResponseSchema = createApiResponseSchema(classesListValueSchema);
export const getClassWithStudentsResponseSchema = createApiResponseSchema(
  classWithStudentsValueSchema,
);
export const getClassSessionsResponseSchema = createApiResponseSchema(
  classSessionsListValueSchema,
);

export type GetClassesResponse = z.infer<typeof getClassesResponseSchema>;
export type GetClassesResult = GetClassesResponse["value"];

export type GetClassWithStudentsResponse = z.infer<
  typeof getClassWithStudentsResponseSchema
>;
export type GetClassWithStudentsResult = GetClassWithStudentsResponse["value"];

export type GetClassSessionsResponse = z.infer<typeof getClassSessionsResponseSchema>;
export type GetClassSessionsResult = GetClassSessionsResponse["value"];
