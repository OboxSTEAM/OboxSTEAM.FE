import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { createApiPost } from "@/lib/api/create-endpoint";
import { ApiResponseError } from "@/lib/api/errors";
import {
  createPortfolioItemSchema,
  portfolioItemIdParamSchema,
  portfolioSubdomainAvailabilityQuerySchema,
  portfolioSubdomainParamSchema,
  reorderPortfolioItemsSchema,
  updatePortfolioItemSchema,
  updatePortfolioPublicationSchema,
  updatePortfolioSchema,
  updatePortfolioSubdomainSchema,
} from "@/lib/validations/portfolios";
import type {
  CreatePortfolioItemInput,
  PortfolioSubdomainAvailabilityQuery,
  ReorderPortfolioItemsInput,
  UpdatePortfolioInput,
  UpdatePortfolioItemInput,
  UpdatePortfolioPublicationInput,
  UpdatePortfolioSubdomainInput,
} from "@/lib/validations/portfolios";

import {
  checkPortfolioSubdomainAvailabilityResponseSchema,
  createPortfolioResponseSchema,
  deletePortfolioItemResponseSchema,
  getMyPortfolioResponseSchema,
  getPublicPortfolioBySubdomainResponseSchema,
  portfolioItemValueSchema,
  reorderPortfolioItemsResponseSchema,
  syncPortfolioItemsResponseSchema,
  updatePortfolioItemResponseSchema,
  updatePortfolioPublicationResponseSchema,
  updatePortfolioResponseSchema,
  updatePortfolioSubdomainResponseSchema,
  type CheckPortfolioSubdomainAvailabilityResult,
  type CreatePortfolioItemResult,
  type CreatePortfolioResult,
  type DeletePortfolioItemResult,
  type GetMyPortfolioResult,
  type GetPublicPortfolioBySubdomainResult,
  type ReorderPortfolioItemsResult,
  type SyncPortfolioItemsResult,
  type UpdatePortfolioItemResult,
  type UpdatePortfolioPublicationResult,
  type UpdatePortfolioResult,
  type UpdatePortfolioSubdomainResult,
} from "./schemas";

export type {
  CheckPortfolioSubdomainAvailabilityResponse,
  CheckPortfolioSubdomainAvailabilityResult,
  CreatePortfolioItemResponse,
  CreatePortfolioItemResult,
  CreatePortfolioResponse,
  CreatePortfolioResult,
  DeletePortfolioItemResponse,
  DeletePortfolioItemResult,
  GetMyPortfolioResponse,
  GetMyPortfolioResult,
  GetPublicPortfolioBySubdomainResponse,
  GetPublicPortfolioBySubdomainResult,
  ReorderPortfolioItemsResponse,
  ReorderPortfolioItemsResult,
  SyncPortfolioItemsResponse,
  SyncPortfolioItemsResult,
  UpdatePortfolioItemResponse,
  UpdatePortfolioItemResult,
  UpdatePortfolioPublicationResponse,
  UpdatePortfolioPublicationResult,
  UpdatePortfolioResponse,
  UpdatePortfolioResult,
  UpdatePortfolioSubdomainResponse,
  UpdatePortfolioSubdomainResult,
} from "./schemas";

export type {
  Portfolio,
  PortfolioAppendixItem,
  PortfolioItem,
  PortfolioItemSource,
  PortfolioItemType,
  PortfolioLink,
  PortfolioPlanType,
  PortfolioTheme,
  PublicPortfolio,
  SubdomainAvailability,
} from "@/lib/api/entities/portfolio";

export type {
  CreatePortfolioItemInput,
  PortfolioItemIdParam,
  PortfolioSubdomainAvailabilityQuery,
  PortfolioSubdomainParam,
  ReorderPortfolioItemsInput,
  UpdatePortfolioInput,
  UpdatePortfolioItemInput,
  UpdatePortfolioPublicationInput,
  UpdatePortfolioSubdomainInput,
} from "@/lib/validations/portfolios";

const PORTFOLIOS_BASE = "/api/portfolios";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

function buildQueryString<T extends Record<string, unknown>>(
  params: T,
  schema: z.ZodType<T>,
): string {
  const parsed = schema.parse(params);
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

/** `GET /api/portfolios/me` */
export async function getMyPortfolio(): Promise<GetMyPortfolioResult> {
  const response = await apiFetchParsed(
    `${PORTFOLIOS_BASE}/me`,
    getMyPortfolioResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `PUT /api/portfolios/me` — profile, theme, and links only. */
export async function updateMyPortfolio(
  input: UpdatePortfolioInput,
): Promise<UpdatePortfolioResult> {
  const body = updatePortfolioSchema.parse(input);

  const response = await apiFetchParsed(
    `${PORTFOLIOS_BASE}/me`,
    updatePortfolioResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `PUT /api/portfolios/me/subdomain` — claim, change, or clear subdomain. */
export async function updateMyPortfolioSubdomain(
  input: UpdatePortfolioSubdomainInput,
): Promise<UpdatePortfolioSubdomainResult> {
  const body = updatePortfolioSubdomainSchema.parse(input);

  const response = await apiFetchParsed(
    `${PORTFOLIOS_BASE}/me/subdomain`,
    updatePortfolioSubdomainResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `PUT /api/portfolios/me/publication` — publish or unpublish. Requires a valid subdomain to publish. */
export async function updateMyPortfolioPublication(
  input: UpdatePortfolioPublicationInput,
): Promise<UpdatePortfolioPublicationResult> {
  const body = updatePortfolioPublicationSchema.parse(input);

  const response = await apiFetchParsed(
    `${PORTFOLIOS_BASE}/me/publication`,
    updatePortfolioPublicationResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/portfolios` — creates an unpublished portfolio without a subdomain. */
export async function createPortfolio(): Promise<CreatePortfolioResult> {
  const response = await apiFetchParsed(
    PORTFOLIOS_BASE,
    createPortfolioResponseSchema,
    { method: "POST" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/portfolios/subdomain-available` */
export async function checkPortfolioSubdomainAvailability(
  params: PortfolioSubdomainAvailabilityQuery,
): Promise<CheckPortfolioSubdomainAvailabilityResult> {
  const response = await apiFetchParsed(
    `${PORTFOLIOS_BASE}/subdomain-available${buildQueryString(
      params,
      portfolioSubdomainAvailabilityQuerySchema,
    )}`,
    checkPortfolioSubdomainAvailabilityResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/portfolios/me/items` */
export const createPortfolioItem = createApiPost({
  path: `${PORTFOLIOS_BASE}/me/items`,
  input: createPortfolioItemSchema,
  value: portfolioItemValueSchema,
});

/** `PUT /api/portfolios/me/items/{itemId}` */
export async function updatePortfolioItem(
  itemId: string,
  input: UpdatePortfolioItemInput,
): Promise<UpdatePortfolioItemResult> {
  const { itemId: parsedItemId } = portfolioItemIdParamSchema.parse({ itemId });
  const body = updatePortfolioItemSchema.parse(input);

  const response = await apiFetchParsed(
    `${PORTFOLIOS_BASE}/me/items/${parsedItemId}`,
    updatePortfolioItemResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `DELETE /api/portfolios/me/items/{itemId}` */
export async function deletePortfolioItem(
  itemId: string,
): Promise<DeletePortfolioItemResult> {
  const { itemId: parsedItemId } = portfolioItemIdParamSchema.parse({ itemId });

  const response = await apiFetchParsed(
    `${PORTFOLIOS_BASE}/me/items/${parsedItemId}`,
    deletePortfolioItemResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `PUT /api/portfolios/me/items/reorder` */
export async function reorderPortfolioItems(
  input: ReorderPortfolioItemsInput,
): Promise<ReorderPortfolioItemsResult> {
  const body = reorderPortfolioItemsSchema.parse(input);

  const response = await apiFetchParsed(
    `${PORTFOLIOS_BASE}/me/items/reorder`,
    reorderPortfolioItemsResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/portfolios/me/sync` — idempotently imports certificates and graded capstone projects. */
export async function syncPortfolioItems(): Promise<SyncPortfolioItemsResult> {
  const response = await apiFetchParsed(
    `${PORTFOLIOS_BASE}/me/sync`,
    syncPortfolioItemsResponseSchema,
    { method: "POST" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/portfolios/by-subdomain/{subdomain}` — anonymous public portfolio page. */
export async function getPublicPortfolioBySubdomain(
  subdomain: string,
): Promise<GetPublicPortfolioBySubdomainResult> {
  const { subdomain: parsedSubdomain } = portfolioSubdomainParamSchema.parse({ subdomain });

  const response = await apiFetchParsed(
    `${PORTFOLIOS_BASE}/by-subdomain/${encodeURIComponent(parsedSubdomain)}`,
    getPublicPortfolioBySubdomainResponseSchema,
    { method: "GET", skipAuth: true },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
