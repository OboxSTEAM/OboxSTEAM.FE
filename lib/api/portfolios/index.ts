import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { createApiPost } from "@/lib/api/create-endpoint";
import { ApiResponseError } from "@/lib/api/errors";
import {
  createPortfolioItemSchema,
  createPortfolioSectionSchema,
  importClassGalleryMediaSchema,
  importHighlightReelMediaSchema,
  portfolioItemIdParamSchema,
  portfolioMediaIdParamSchema,
  portfolioSectionIdParamSchema,
  portfolioSubdomainAvailabilityQuerySchema,
  portfolioSubdomainParamSchema,
  reorderPortfolioItemsSchema,
  reorderPortfolioSectionsSchema,
  updatePortfolioItemSchema,
  updatePortfolioPublicationSchema,
  updatePortfolioSchema,
  updatePortfolioSectionSchema,
  updatePortfolioSubdomainSchema,
} from "@/lib/validations/portfolios";
import type {
  CreatePortfolioItemInput,
  CreatePortfolioSectionInput,
  ImportClassGalleryMediaInput,
  ImportHighlightReelMediaInput,
  PortfolioSubdomainAvailabilityQuery,
  ReorderPortfolioItemsInput,
  ReorderPortfolioSectionsInput,
  UpdatePortfolioInput,
  UpdatePortfolioItemInput,
  UpdatePortfolioPublicationInput,
  UpdatePortfolioSectionInput,
  UpdatePortfolioSubdomainInput,
} from "@/lib/validations/portfolios";
import {
  themeToApiWire,
  toPortfolioEnumWire,
} from "@/lib/api/entities/portfolio";
import {
  checkPortfolioSubdomainAvailabilityResponseSchema,
  createPortfolioResponseSchema,
  createPortfolioSectionResponseSchema,
  createPortfolioItemResponseSchema,
  deletePortfolioItemResponseSchema,
  deletePortfolioMediaResponseSchema,
  deletePortfolioSectionResponseSchema,
  getMyPortfolioResponseSchema,
  getPublicPortfolioBySubdomainResponseSchema,
  importClassGalleryMediaResponseSchema,
  importHighlightReelMediaResponseSchema,
  listPortfolioMediaResponseSchema,
  portfolioSectionValueSchema,
  reorderPortfolioItemsResponseSchema,
  reorderPortfolioSectionsResponseSchema,
  syncPortfolioItemsResponseSchema,
  updatePortfolioItemResponseSchema,
  updatePortfolioPublicationResponseSchema,
  updatePortfolioResponseSchema,
  updatePortfolioSectionResponseSchema,
  updatePortfolioSubdomainResponseSchema,
  uploadPortfolioMediaResponseSchema,
  type CheckPortfolioSubdomainAvailabilityResult,
  type CreatePortfolioItemResult,
  type CreatePortfolioResult,
  type CreatePortfolioSectionResult,
  type DeletePortfolioItemResult,
  type DeletePortfolioMediaResult,
  type DeletePortfolioSectionResult,
  type GetMyPortfolioResult,
  type GetPublicPortfolioBySubdomainResult,
  type ImportClassGalleryMediaResult,
  type ImportHighlightReelMediaResult,
  type ListPortfolioMediaResult,
  type ReorderPortfolioItemsResult,
  type ReorderPortfolioSectionsResult,
  type SyncPortfolioItemsResult,
  type UpdatePortfolioItemResult,
  type UpdatePortfolioPublicationResult,
  type UpdatePortfolioResult,
  type UpdatePortfolioSectionResult,
  type UpdatePortfolioSubdomainResult,
  type UploadPortfolioMediaResult,
} from "./schemas";

export type {
  CheckPortfolioSubdomainAvailabilityResponse,
  CheckPortfolioSubdomainAvailabilityResult,
  CreatePortfolioItemResponse,
  CreatePortfolioItemResult,
  CreatePortfolioResponse,
  CreatePortfolioResult,
  CreatePortfolioSectionResponse,
  CreatePortfolioSectionResult,
  DeletePortfolioItemResponse,
  DeletePortfolioItemResult,
  DeletePortfolioMediaResponse,
  DeletePortfolioMediaResult,
  DeletePortfolioSectionResponse,
  DeletePortfolioSectionResult,
  GetMyPortfolioResponse,
  GetMyPortfolioResult,
  GetPublicPortfolioBySubdomainResponse,
  GetPublicPortfolioBySubdomainResult,
  ImportClassGalleryMediaResponse,
  ImportClassGalleryMediaResult,
  ImportHighlightReelMediaResponse,
  ImportHighlightReelMediaResult,
  ListPortfolioMediaResponse,
  ListPortfolioMediaResult,
  ReorderPortfolioItemsResponse,
  ReorderPortfolioItemsResult,
  ReorderPortfolioSectionsResponse,
  ReorderPortfolioSectionsResult,
  SyncPortfolioItemsResponse,
  SyncPortfolioItemsResult,
  UpdatePortfolioItemResponse,
  UpdatePortfolioItemResult,
  UpdatePortfolioPublicationResponse,
  UpdatePortfolioPublicationResult,
  UpdatePortfolioResponse,
  UpdatePortfolioResult,
  UpdatePortfolioSectionResponse,
  UpdatePortfolioSectionResult,
  UpdatePortfolioSubdomainResponse,
  UpdatePortfolioSubdomainResult,
  UploadPortfolioMediaResponse,
  UploadPortfolioMediaResult,
} from "./schemas";

export type {
  Portfolio,
  PortfolioAppendixItem,
  PortfolioBackgroundStyle,
  PortfolioCardStyle,
  PortfolioDensity,
  PortfolioFontScale,
  PortfolioItem,
  PortfolioItemSource,
  PortfolioItemSpan,
  PortfolioItemType,
  PortfolioLineHeight,
  PortfolioLink,
  PortfolioMediaAsset,
  PortfolioMediaType,
  PortfolioMediaUpload,
  PortfolioPlanType,
  PortfolioSection,
  PortfolioSectionKind,
  PortfolioSectionSettings,
  PortfolioTheme,
  PortfolioThemeSlotOverrides,
  PublicPortfolio,
  SubdomainAvailability,
  ImportClassGalleryMediaResultData,
} from "@/lib/api/entities/portfolio";

export {
  parseSectionSettingsJson,
  parseThemeSettingsJson,
  serializeSectionSettingsJson,
  serializeThemeSettingsJson,
} from "@/lib/api/entities/portfolio";

export type {
  CreatePortfolioItemInput,
  CreatePortfolioSectionInput,
  ImportClassGalleryMediaInput,
  ImportHighlightReelMediaInput,
  PortfolioItemIdParam,
  PortfolioMediaAssetRef,
  PortfolioMediaIdParam,
  PortfolioSectionIdParam,
  PortfolioSubdomainAvailabilityQuery,
  PortfolioSubdomainParam,
  ReorderPortfolioItemsInput,
  ReorderPortfolioSectionsInput,
  UpdatePortfolioInput,
  UpdatePortfolioItemInput,
  UpdatePortfolioPublicationInput,
  UpdatePortfolioSectionInput,
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
  const wireBody = {
    ...body,
    theme: body.theme ? themeToApiWire(body.theme) : undefined,
  };

  const response = await apiFetchParsed(
    `${PORTFOLIOS_BASE}/me`,
    updatePortfolioResponseSchema,
    { method: "PUT", body: wireBody },
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
export async function createPortfolioItem(
  input: CreatePortfolioItemInput,
): Promise<CreatePortfolioItemResult> {
  const body = createPortfolioItemSchema.parse(input);
  const wireBody = {
    ...body,
    span:
      body.span == null || body.span === undefined
        ? body.span
        : toPortfolioEnumWire(body.span),
  };

  const response = await apiFetchParsed(
    `${PORTFOLIOS_BASE}/me/items`,
    createPortfolioItemResponseSchema,
    { method: "POST", body: wireBody },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `PUT /api/portfolios/me/items/{itemId}` */
export async function updatePortfolioItem(
  itemId: string,
  input: UpdatePortfolioItemInput,
): Promise<UpdatePortfolioItemResult> {
  const { itemId: parsedItemId } = portfolioItemIdParamSchema.parse({ itemId });
  const body = updatePortfolioItemSchema.parse(input);
  const wireBody = {
    ...body,
    span:
      body.span === undefined
        ? undefined
        : body.span == null
          ? null
          : toPortfolioEnumWire(body.span),
  };

  const response = await apiFetchParsed(
    `${PORTFOLIOS_BASE}/me/items/${parsedItemId}`,
    updatePortfolioItemResponseSchema,
    { method: "PUT", body: wireBody },
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

/** `POST /api/portfolios/me/sync` — idempotently imports certificates and graded capstone projects (not highlight reels). */
export async function syncPortfolioItems(): Promise<SyncPortfolioItemsResult> {
  const response = await apiFetchParsed(
    `${PORTFOLIOS_BASE}/me/sync`,
    syncPortfolioItemsResponseSchema,
    { method: "POST" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/portfolios/me/media` — multipart upload (jpg/png ≤ 5 MB, mp4/mov ≤ 2 GB). */
export async function uploadPortfolioMedia(file: File): Promise<UploadPortfolioMediaResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiFetchParsed(
    `${PORTFOLIOS_BASE}/me/media`,
    uploadPortfolioMediaResponseSchema,
    { method: "POST", body: formData },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/portfolios/me/media` */
export async function listPortfolioMedia(): Promise<ListPortfolioMediaResult> {
  const response = await apiFetchParsed(
    `${PORTFOLIOS_BASE}/me/media`,
    listPortfolioMediaResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `DELETE /api/portfolios/me/media/{mediaId}` */
export async function deletePortfolioMedia(
  mediaId: string,
): Promise<DeletePortfolioMediaResult> {
  const { mediaId: parsedMediaId } = portfolioMediaIdParamSchema.parse({ mediaId });

  const response = await apiFetchParsed(
    `${PORTFOLIOS_BASE}/me/media/${parsedMediaId}`,
    deletePortfolioMediaResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/**
 * `POST /api/portfolios/me/media/from-class-gallery` — copy ready class-gallery
 * media into independent portfolio assets. Optionally append to an item or section.
 */
export async function importClassGalleryMedia(
  input: ImportClassGalleryMediaInput,
): Promise<ImportClassGalleryMediaResult> {
  const body = importClassGalleryMediaSchema.parse(input);

  const response = await apiFetchParsed(
    `${PORTFOLIOS_BASE}/me/media/from-class-gallery`,
    importClassGalleryMediaResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/**
 * `POST /api/portfolios/me/media/from-highlight-reel` — copy a completed highlight
 * video into a portfolio Video asset and append it to a Gallery section.
 * Idempotent by highlight video item id; does not create HighlightReel items.
 */
export async function importHighlightReelMedia(
  input: ImportHighlightReelMediaInput,
): Promise<ImportHighlightReelMediaResult> {
  const body = importHighlightReelMediaSchema.parse(input);

  const response = await apiFetchParsed(
    `${PORTFOLIOS_BASE}/me/media/from-highlight-reel`,
    importHighlightReelMediaResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/portfolios/me/sections` */
export const createPortfolioSection = createApiPost({
  path: `${PORTFOLIOS_BASE}/me/sections`,
  input: createPortfolioSectionSchema,
  value: portfolioSectionValueSchema,
});

/** `PUT /api/portfolios/me/sections/{sectionId}` */
export async function updatePortfolioSection(
  sectionId: string,
  input: UpdatePortfolioSectionInput,
): Promise<UpdatePortfolioSectionResult> {
  const { sectionId: parsedSectionId } = portfolioSectionIdParamSchema.parse({ sectionId });
  const body = updatePortfolioSectionSchema.parse(input);

  const response = await apiFetchParsed(
    `${PORTFOLIOS_BASE}/me/sections/${parsedSectionId}`,
    updatePortfolioSectionResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `DELETE /api/portfolios/me/sections/{sectionId}` */
export async function deletePortfolioSection(
  sectionId: string,
): Promise<DeletePortfolioSectionResult> {
  const { sectionId: parsedSectionId } = portfolioSectionIdParamSchema.parse({ sectionId });

  const response = await apiFetchParsed(
    `${PORTFOLIOS_BASE}/me/sections/${parsedSectionId}`,
    deletePortfolioSectionResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `PUT /api/portfolios/me/sections/reorder` */
export async function reorderPortfolioSections(
  input: ReorderPortfolioSectionsInput,
): Promise<ReorderPortfolioSectionsResult> {
  const body = reorderPortfolioSectionsSchema.parse(input);

  const response = await apiFetchParsed(
    `${PORTFOLIOS_BASE}/me/sections/reorder`,
    reorderPortfolioSectionsResponseSchema,
    { method: "PUT", body },
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
