import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  addHighlightSegmentSchema,
  createHighlightStackSchema,
  highlightStackIdParamSchema,
  highlightStackItemParamsSchema,
  highlightStacksQuerySchema,
  trimHighlightVideoSchema,
  type AddHighlightSegmentInput,
  type CreateHighlightStackInput,
  type HighlightStacksQuery,
  type TrimHighlightVideoInput,
} from "@/lib/validations/highlight-video";

import {
  addHighlightSegmentResponseSchema,
  createHighlightStackResponseSchema,
  deleteHighlightStackResponseSchema,
  deleteHighlightVideoItemResponseSchema,
  getHighlightStackByIdResponseSchema,
  getHighlightStacksResponseSchema,
  trimHighlightVideoResponseSchema,
  type AddHighlightSegmentResult,
  type CreateHighlightStackResult,
  type DeleteHighlightStackResult,
  type DeleteHighlightVideoItemResult,
  type GetHighlightStackByIdResult,
  type GetHighlightStacksResult,
  type TrimHighlightVideoResult,
} from "./schemas";

export type {
  HighlightGenerationKind,
  HighlightSourceClip,
  HighlightSourceSegment,
  HighlightTimeRange,
  HighlightVideoItem,
  HighlightVideoItemStatus,
  HighlightVideoStack,
} from "@/lib/api/entities/highlight-video";

export type {
  AddHighlightSegmentResponse,
  AddHighlightSegmentResult,
  CreateHighlightStackResponse,
  CreateHighlightStackResult,
  DeleteHighlightStackResponse,
  DeleteHighlightStackResult,
  DeleteHighlightVideoItemResponse,
  DeleteHighlightVideoItemResult,
  GetHighlightStackByIdResponse,
  GetHighlightStackByIdResult,
  GetHighlightStacksResponse,
  GetHighlightStacksResult,
  TrimHighlightVideoResponse,
  TrimHighlightVideoResult,
} from "./schemas";

export type {
  AddHighlightSegmentInput,
  CreateHighlightStackInput,
  HighlightStackIdParam,
  HighlightStackItemParams,
  HighlightStacksQuery,
  TrimHighlightVideoInput,
} from "@/lib/validations/highlight-video";

const HIGHLIGHT_VIDEO_BASE = "/api/highlight-video";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

function buildQueryString(params: HighlightStacksQuery): string {
  const parsed = highlightStacksQuerySchema.parse(params);
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

/**
 * `POST /api/highlight-video/stacks` — create stack and start first video job.
 * Omitting studentId uses the authenticated user from the JWT.
 */
export async function createHighlightStack(
  input: CreateHighlightStackInput,
): Promise<CreateHighlightStackResult> {
  const body = createHighlightStackSchema.parse(input);

  const response = await apiFetchParsed(
    `${HIGHLIGHT_VIDEO_BASE}/stacks`,
    createHighlightStackResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/**
 * `GET /api/highlight-video/stacks` — list stacks for a class (and optional student).
 * Omitting studentId uses the authenticated user from the JWT.
 */
export async function getHighlightStacks(
  params: HighlightStacksQuery,
): Promise<GetHighlightStacksResult> {
  const response = await apiFetchParsed(
    `${HIGHLIGHT_VIDEO_BASE}/stacks${buildQueryString(params)}`,
    getHighlightStacksResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/highlight-video/stacks/{stackId}` — one stack with its video items. */
export async function getHighlightStackById(
  stackId: string,
): Promise<GetHighlightStackByIdResult> {
  const { stackId: parsedId } = highlightStackIdParamSchema.parse({ stackId });

  const response = await apiFetchParsed(
    `${HIGHLIGHT_VIDEO_BASE}/stacks/${parsedId}`,
    getHighlightStackByIdResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `DELETE /api/highlight-video/stacks/{stackId}` — soft-delete stack and items. */
export async function deleteHighlightStack(
  stackId: string,
): Promise<DeleteHighlightStackResult> {
  const { stackId: parsedId } = highlightStackIdParamSchema.parse({ stackId });

  const response = await apiFetchParsed(
    `${HIGHLIGHT_VIDEO_BASE}/stacks/${parsedId}`,
    deleteHighlightStackResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/**
 * `POST /api/highlight-video/stacks/{stackId}/items/{itemId}/trim` —
 * start a trim job that excludes the given time ranges.
 */
export async function trimHighlightVideo(
  stackId: string,
  itemId: string,
  input: TrimHighlightVideoInput,
): Promise<TrimHighlightVideoResult> {
  const parsed = highlightStackItemParamsSchema.parse({ stackId, itemId });
  const body = trimHighlightVideoSchema.parse(input);

  const response = await apiFetchParsed(
    `${HIGHLIGHT_VIDEO_BASE}/stacks/${parsed.stackId}/items/${parsed.itemId}/trim`,
    trimHighlightVideoResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/**
 * `POST /api/highlight-video/stacks/{stackId}/items/{itemId}/add-segment` —
 * insert a source media segment and re-encode.
 */
export async function addHighlightSegment(
  stackId: string,
  itemId: string,
  input: AddHighlightSegmentInput,
): Promise<AddHighlightSegmentResult> {
  const parsed = highlightStackItemParamsSchema.parse({ stackId, itemId });
  const body = addHighlightSegmentSchema.parse(input);

  const response = await apiFetchParsed(
    `${HIGHLIGHT_VIDEO_BASE}/stacks/${parsed.stackId}/items/${parsed.itemId}/add-segment`,
    addHighlightSegmentResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/**
 * `DELETE /api/highlight-video/stacks/{stackId}/items/{itemId}` —
 * soft-delete one item so another can be generated in the stack.
 */
export async function deleteHighlightVideoItem(
  stackId: string,
  itemId: string,
): Promise<DeleteHighlightVideoItemResult> {
  const parsed = highlightStackItemParamsSchema.parse({ stackId, itemId });

  const response = await apiFetchParsed(
    `${HIGHLIGHT_VIDEO_BASE}/stacks/${parsed.stackId}/items/${parsed.itemId}`,
    deleteHighlightVideoItemResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
