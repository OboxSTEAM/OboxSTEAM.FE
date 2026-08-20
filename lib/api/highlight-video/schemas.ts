import { z } from "zod";

import {
  highlightSourceMediaSchema,
  highlightVideoItemSchema,
  highlightVideoProgressSchema,
  highlightVideoStackSchema,
} from "@/lib/api/entities/highlight-video";
import {
  apiValueMessageOnlySchema,
  createApiResponseSchema,
} from "@/lib/api/schemas";

const valueEnvelope = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    code: z.string().nullish().transform((value) => value ?? "OK"),
    message: z.string().nullish().transform((value) => value ?? ""),
    data: dataSchema,
  });

export const highlightVideoStackValueSchema = valueEnvelope(
  highlightVideoStackSchema,
);
export const highlightVideoItemValueSchema = valueEnvelope(
  highlightVideoItemSchema,
);
export const highlightVideoStackListValueSchema = valueEnvelope(
  z
    .array(highlightVideoStackSchema)
    .nullish()
    .transform((value) => value ?? []),
);
export const highlightSourceMediaListValueSchema = valueEnvelope(
  z
    .array(highlightSourceMediaSchema)
    .nullish()
    .transform((value) => value ?? []),
);
export const highlightVideoProgressValueSchema = valueEnvelope(
  highlightVideoProgressSchema,
);

export const createHighlightStackResponseSchema = createApiResponseSchema(
  highlightVideoStackValueSchema,
);
export const getHighlightStacksResponseSchema = createApiResponseSchema(
  highlightVideoStackListValueSchema,
);
export const getHighlightStackByIdResponseSchema = createApiResponseSchema(
  highlightVideoStackValueSchema,
);
export const deleteHighlightStackResponseSchema = createApiResponseSchema(
  apiValueMessageOnlySchema,
);
export const regenerateHighlightStackResponseSchema = createApiResponseSchema(
  highlightVideoStackValueSchema,
);
export const getHighlightSourceMediaResponseSchema = createApiResponseSchema(
  highlightSourceMediaListValueSchema,
);
export const getHighlightVideoProgressResponseSchema = createApiResponseSchema(
  highlightVideoProgressValueSchema,
);
export const cancelHighlightVideoItemResponseSchema = createApiResponseSchema(
  highlightVideoItemValueSchema,
);
export const retryHighlightVideoItemResponseSchema = createApiResponseSchema(
  highlightVideoItemValueSchema,
);
export const trimHighlightVideoResponseSchema = createApiResponseSchema(
  highlightVideoItemValueSchema,
);
export const addHighlightSegmentResponseSchema = createApiResponseSchema(
  highlightVideoItemValueSchema,
);
export const deleteHighlightVideoItemResponseSchema = createApiResponseSchema(
  apiValueMessageOnlySchema,
);

export type CreateHighlightStackResponse = z.infer<
  typeof createHighlightStackResponseSchema
>;
export type CreateHighlightStackResult = CreateHighlightStackResponse["value"];

export type GetHighlightStacksResponse = z.infer<
  typeof getHighlightStacksResponseSchema
>;
export type GetHighlightStacksResult = GetHighlightStacksResponse["value"];

export type GetHighlightStackByIdResponse = z.infer<
  typeof getHighlightStackByIdResponseSchema
>;
export type GetHighlightStackByIdResult =
  GetHighlightStackByIdResponse["value"];

export type DeleteHighlightStackResponse = z.infer<
  typeof deleteHighlightStackResponseSchema
>;
export type DeleteHighlightStackResult = DeleteHighlightStackResponse["value"];

export type RegenerateHighlightStackResponse = z.infer<
  typeof regenerateHighlightStackResponseSchema
>;
export type RegenerateHighlightStackResult =
  RegenerateHighlightStackResponse["value"];

export type GetHighlightSourceMediaResponse = z.infer<
  typeof getHighlightSourceMediaResponseSchema
>;
export type GetHighlightSourceMediaResult =
  GetHighlightSourceMediaResponse["value"];

export type GetHighlightVideoProgressResponse = z.infer<
  typeof getHighlightVideoProgressResponseSchema
>;
export type GetHighlightVideoProgressResult =
  GetHighlightVideoProgressResponse["value"];

export type CancelHighlightVideoItemResponse = z.infer<
  typeof cancelHighlightVideoItemResponseSchema
>;
export type CancelHighlightVideoItemResult =
  CancelHighlightVideoItemResponse["value"];

export type RetryHighlightVideoItemResponse = z.infer<
  typeof retryHighlightVideoItemResponseSchema
>;
export type RetryHighlightVideoItemResult =
  RetryHighlightVideoItemResponse["value"];

export type TrimHighlightVideoResponse = z.infer<
  typeof trimHighlightVideoResponseSchema
>;
export type TrimHighlightVideoResult = TrimHighlightVideoResponse["value"];

export type AddHighlightSegmentResponse = z.infer<
  typeof addHighlightSegmentResponseSchema
>;
export type AddHighlightSegmentResult = AddHighlightSegmentResponse["value"];

export type DeleteHighlightVideoItemResponse = z.infer<
  typeof deleteHighlightVideoItemResponseSchema
>;
export type DeleteHighlightVideoItemResult =
  DeleteHighlightVideoItemResponse["value"];
