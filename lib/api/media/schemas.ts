import { z } from "zod";

import {
  mediaAssetSchema,
  mediaProgressSchema,
  mediaTagSchema,
} from "@/lib/api/entities/media";
import { createPaginatedSchema } from "@/lib/api/entities/pagination";
import {
  apiValueMessageOnlySchema,
  createApiResponseSchema,
} from "@/lib/api/schemas";

export const mediaAssetValueSchema = z.object({
  code: z.string().nullish().transform((value) => value ?? "OK"),
  message: z.string().nullish().transform((value) => value ?? ""),
  data: mediaAssetSchema,
});
export const mediaTagValueSchema = z.object({
  code: z.string().nullish().transform((value) => value ?? "OK"),
  message: z.string().nullish().transform((value) => value ?? ""),
  data: mediaTagSchema,
});
export const mediaProgressValueSchema = z.object({
  code: z.string().nullish().transform((value) => value ?? "OK"),
  message: z.string().nullish().transform((value) => value ?? ""),
  data: mediaProgressSchema,
});

/** Paginated list (`GET /api/media`). */
export const paginatedMediaAssetsSchema = createPaginatedSchema(
  mediaAssetSchema,
).extend({
  items: z
    .array(mediaAssetSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export const mediaAssetPaginationValueSchema = z.object({
  code: z.string().nullish().transform((value) => value ?? "OK"),
  message: z.string().nullish().transform((value) => value ?? ""),
  data: paginatedMediaAssetsSchema,
});

export const getMediaListResponseSchema = createApiResponseSchema(
  mediaAssetPaginationValueSchema,
);
export const getMediaByIdResponseSchema =
  createApiResponseSchema(mediaAssetValueSchema);
export const getMediaProgressResponseSchema = createApiResponseSchema(
  mediaProgressValueSchema,
);
export const uploadMediaResponseSchema =
  createApiResponseSchema(mediaAssetValueSchema);
export const processMediaTagsResponseSchema =
  createApiResponseSchema(mediaAssetValueSchema);
export const addMediaTagResponseSchema =
  createApiResponseSchema(mediaTagValueSchema);
export const updateMediaTagVerificationResponseSchema =
  createApiResponseSchema(mediaTagValueSchema);
export const deleteMediaResponseSchema = createApiResponseSchema(
  apiValueMessageOnlySchema,
);
export const deleteMediaTagResponseSchema = createApiResponseSchema(
  apiValueMessageOnlySchema,
);

export type GetMediaListResponse = z.infer<typeof getMediaListResponseSchema>;
export type GetMediaListResult = GetMediaListResponse["value"];

export type GetMediaByIdResponse = z.infer<typeof getMediaByIdResponseSchema>;
export type GetMediaByIdResult = GetMediaByIdResponse["value"];

export type GetMediaProgressResponse = z.infer<
  typeof getMediaProgressResponseSchema
>;
export type GetMediaProgressResult = GetMediaProgressResponse["value"];

export type UploadMediaResponse = z.infer<typeof uploadMediaResponseSchema>;
export type UploadMediaResult = UploadMediaResponse["value"];

export type ProcessMediaTagsResponse = z.infer<
  typeof processMediaTagsResponseSchema
>;
export type ProcessMediaTagsResult = ProcessMediaTagsResponse["value"];

export type AddMediaTagResponse = z.infer<typeof addMediaTagResponseSchema>;
export type AddMediaTagResult = AddMediaTagResponse["value"];

export type UpdateMediaTagVerificationResponse = z.infer<
  typeof updateMediaTagVerificationResponseSchema
>;
export type UpdateMediaTagVerificationResult =
  UpdateMediaTagVerificationResponse["value"];

export type DeleteMediaResponse = z.infer<typeof deleteMediaResponseSchema>;
export type DeleteMediaResult = DeleteMediaResponse["value"];

export type DeleteMediaTagResponse = z.infer<typeof deleteMediaTagResponseSchema>;
export type DeleteMediaTagResult = DeleteMediaTagResponse["value"];
