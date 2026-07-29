import { z } from "zod";

import { mediaAssetSchema, mediaTagSchema } from "@/lib/api/entities/media";
import {
  apiValueMessageOnlySchema,
  createApiResponseSchema,
  createApiValueSchema,
} from "@/lib/api/schemas";

export const mediaAssetValueSchema = createApiValueSchema(mediaAssetSchema);
export const mediaTagValueSchema = createApiValueSchema(mediaTagSchema);
export const mediaAssetListValueSchema = createApiValueSchema(
  z
    .array(mediaAssetSchema)
    .nullish()
    .transform((value) => value ?? []),
);

export const getMediaListResponseSchema = createApiResponseSchema(
  mediaAssetListValueSchema,
);
export const getMediaByIdResponseSchema =
  createApiResponseSchema(mediaAssetValueSchema);
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
