import { z } from "zod";

import {
  portfolioItemSchema,
  portfolioSchema,
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
export const publicPortfolioValueSchema = createApiValueSchema(publicPortfolioSchema);
export const subdomainAvailabilityValueSchema = createApiValueSchema(
  subdomainAvailabilitySchema,
);

export const getMyPortfolioResponseSchema = createApiResponseSchema(portfolioValueSchema);
export const createPortfolioResponseSchema = createApiResponseSchema(portfolioValueSchema);
export const updatePortfolioResponseSchema = createApiResponseSchema(portfolioValueSchema);
export const syncPortfolioItemsResponseSchema = createApiResponseSchema(portfolioValueSchema);
export const reorderPortfolioItemsResponseSchema = createApiResponseSchema(portfolioValueSchema);

export const createPortfolioItemResponseSchema = createApiResponseSchema(
  portfolioItemValueSchema,
);
export const updatePortfolioItemResponseSchema = createApiResponseSchema(
  portfolioItemValueSchema,
);
export const deletePortfolioItemResponseSchema = createApiResponseSchema(
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
export type SyncPortfolioItemsResponse = z.infer<typeof syncPortfolioItemsResponseSchema>;
export type ReorderPortfolioItemsResponse = z.infer<typeof reorderPortfolioItemsResponseSchema>;
export type CreatePortfolioItemResponse = z.infer<typeof createPortfolioItemResponseSchema>;
export type UpdatePortfolioItemResponse = z.infer<typeof updatePortfolioItemResponseSchema>;
export type DeletePortfolioItemResponse = z.infer<typeof deletePortfolioItemResponseSchema>;
export type CheckPortfolioSubdomainAvailabilityResponse = z.infer<
  typeof checkPortfolioSubdomainAvailabilityResponseSchema
>;
export type GetPublicPortfolioBySubdomainResponse = z.infer<
  typeof getPublicPortfolioBySubdomainResponseSchema
>;

export type GetMyPortfolioResult = GetMyPortfolioResponse["value"];
export type CreatePortfolioResult = CreatePortfolioResponse["value"];
export type UpdatePortfolioResult = UpdatePortfolioResponse["value"];
export type SyncPortfolioItemsResult = SyncPortfolioItemsResponse["value"];
export type ReorderPortfolioItemsResult = ReorderPortfolioItemsResponse["value"];
export type CreatePortfolioItemResult = CreatePortfolioItemResponse["value"];
export type UpdatePortfolioItemResult = UpdatePortfolioItemResponse["value"];
export type DeletePortfolioItemResult = DeletePortfolioItemResponse["value"];
export type CheckPortfolioSubdomainAvailabilityResult =
  CheckPortfolioSubdomainAvailabilityResponse["value"];
export type GetPublicPortfolioBySubdomainResult =
  GetPublicPortfolioBySubdomainResponse["value"];
