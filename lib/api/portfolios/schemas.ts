import { z } from "zod";

import {
  portfolioItemSchema,
  portfolioMediaUploadSchema,
  portfolioSchema,
  portfolioSectionSchema,
  publicPortfolioSchema,
  subdomainAvailabilitySchema,
} from "@/lib/api/entities/portfolio";
import {
  apiValueMessageOnlySchema,
  createApiResponseSchema,
  createApiValueSchema,
} from "@/lib/api/schemas";

export const portfolioValueSchema = createApiValueSchema(portfolioSchema);
export const portfolioItemValueSchema = createApiValueSchema(portfolioItemSchema);
export const portfolioSectionValueSchema = createApiValueSchema(portfolioSectionSchema);
export const portfolioMediaUploadValueSchema = createApiValueSchema(portfolioMediaUploadSchema);
export const portfolioMediaUploadListValueSchema = createApiValueSchema(
  z.array(portfolioMediaUploadSchema).nullable(),
);
export const publicPortfolioValueSchema = createApiValueSchema(publicPortfolioSchema);
export const subdomainAvailabilityValueSchema = createApiValueSchema(
  subdomainAvailabilitySchema,
);

export const getMyPortfolioResponseSchema = createApiResponseSchema(portfolioValueSchema);
export const createPortfolioResponseSchema = createApiResponseSchema(portfolioValueSchema);
export const updatePortfolioResponseSchema = createApiResponseSchema(portfolioValueSchema);
export const updatePortfolioSubdomainResponseSchema =
  createApiResponseSchema(portfolioValueSchema);
export const updatePortfolioPublicationResponseSchema =
  createApiResponseSchema(portfolioValueSchema);
export const syncPortfolioItemsResponseSchema = createApiResponseSchema(portfolioValueSchema);
export const reorderPortfolioItemsResponseSchema = createApiResponseSchema(portfolioValueSchema);
export const reorderPortfolioSectionsResponseSchema =
  createApiResponseSchema(portfolioValueSchema);

export const createPortfolioItemResponseSchema = createApiResponseSchema(
  portfolioItemValueSchema,
);
export const updatePortfolioItemResponseSchema = createApiResponseSchema(
  portfolioItemValueSchema,
);
export const deletePortfolioItemResponseSchema = createApiResponseSchema(
  apiValueMessageOnlySchema,
);

export const createPortfolioSectionResponseSchema = createApiResponseSchema(
  portfolioSectionValueSchema,
);
export const updatePortfolioSectionResponseSchema = createApiResponseSchema(
  portfolioSectionValueSchema,
);
export const deletePortfolioSectionResponseSchema = createApiResponseSchema(
  apiValueMessageOnlySchema,
);

export const uploadPortfolioMediaResponseSchema = createApiResponseSchema(
  portfolioMediaUploadValueSchema,
);
export const listPortfolioMediaResponseSchema = createApiResponseSchema(
  portfolioMediaUploadListValueSchema,
);
export const deletePortfolioMediaResponseSchema = createApiResponseSchema(
  apiValueMessageOnlySchema,
);

export const checkPortfolioSubdomainAvailabilityResponseSchema = createApiResponseSchema(
  subdomainAvailabilityValueSchema,
);
export const getPublicPortfolioBySubdomainResponseSchema = createApiResponseSchema(
  publicPortfolioValueSchema,
);

export type GetMyPortfolioResponse = z.infer<typeof getMyPortfolioResponseSchema>;
export type CreatePortfolioResponse = z.infer<typeof createPortfolioResponseSchema>;
export type UpdatePortfolioResponse = z.infer<typeof updatePortfolioResponseSchema>;
export type UpdatePortfolioSubdomainResponse = z.infer<
  typeof updatePortfolioSubdomainResponseSchema
>;
export type UpdatePortfolioPublicationResponse = z.infer<
  typeof updatePortfolioPublicationResponseSchema
>;
export type SyncPortfolioItemsResponse = z.infer<typeof syncPortfolioItemsResponseSchema>;
export type ReorderPortfolioItemsResponse = z.infer<typeof reorderPortfolioItemsResponseSchema>;
export type ReorderPortfolioSectionsResponse = z.infer<
  typeof reorderPortfolioSectionsResponseSchema
>;
export type CreatePortfolioItemResponse = z.infer<typeof createPortfolioItemResponseSchema>;
export type UpdatePortfolioItemResponse = z.infer<typeof updatePortfolioItemResponseSchema>;
export type DeletePortfolioItemResponse = z.infer<typeof deletePortfolioItemResponseSchema>;
export type CreatePortfolioSectionResponse = z.infer<typeof createPortfolioSectionResponseSchema>;
export type UpdatePortfolioSectionResponse = z.infer<typeof updatePortfolioSectionResponseSchema>;
export type DeletePortfolioSectionResponse = z.infer<typeof deletePortfolioSectionResponseSchema>;
export type UploadPortfolioMediaResponse = z.infer<typeof uploadPortfolioMediaResponseSchema>;
export type ListPortfolioMediaResponse = z.infer<typeof listPortfolioMediaResponseSchema>;
export type DeletePortfolioMediaResponse = z.infer<typeof deletePortfolioMediaResponseSchema>;
export type CheckPortfolioSubdomainAvailabilityResponse = z.infer<
  typeof checkPortfolioSubdomainAvailabilityResponseSchema
>;
export type GetPublicPortfolioBySubdomainResponse = z.infer<
  typeof getPublicPortfolioBySubdomainResponseSchema
>;

export type GetMyPortfolioResult = NonNullable<GetMyPortfolioResponse["value"]>;
export type CreatePortfolioResult = NonNullable<CreatePortfolioResponse["value"]>;
export type UpdatePortfolioResult = NonNullable<UpdatePortfolioResponse["value"]>;
export type UpdatePortfolioSubdomainResult = NonNullable<
  UpdatePortfolioSubdomainResponse["value"]
>;
export type UpdatePortfolioPublicationResult = NonNullable<
  UpdatePortfolioPublicationResponse["value"]
>;
export type SyncPortfolioItemsResult = NonNullable<SyncPortfolioItemsResponse["value"]>;
export type ReorderPortfolioItemsResult = NonNullable<
  ReorderPortfolioItemsResponse["value"]
>;
export type ReorderPortfolioSectionsResult = NonNullable<
  ReorderPortfolioSectionsResponse["value"]
>;
export type CreatePortfolioItemResult = NonNullable<
  CreatePortfolioItemResponse["value"]
>;
export type UpdatePortfolioItemResult = NonNullable<
  UpdatePortfolioItemResponse["value"]
>;
export type DeletePortfolioItemResult = NonNullable<
  DeletePortfolioItemResponse["value"]
>;
export type CreatePortfolioSectionResult = NonNullable<
  CreatePortfolioSectionResponse["value"]
>;
export type UpdatePortfolioSectionResult = NonNullable<
  UpdatePortfolioSectionResponse["value"]
>;
export type DeletePortfolioSectionResult = NonNullable<
  DeletePortfolioSectionResponse["value"]
>;
export type UploadPortfolioMediaResult = NonNullable<UploadPortfolioMediaResponse["value"]>;
export type ListPortfolioMediaResult = NonNullable<ListPortfolioMediaResponse["value"]>;
export type DeletePortfolioMediaResult = NonNullable<DeletePortfolioMediaResponse["value"]>;
export type CheckPortfolioSubdomainAvailabilityResult = NonNullable<
  CheckPortfolioSubdomainAvailabilityResponse["value"]
>;
export type GetPublicPortfolioBySubdomainResult = NonNullable<
  GetPublicPortfolioBySubdomainResponse["value"]
>;
