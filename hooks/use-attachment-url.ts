"use client";

import { useEffect, useMemo, useState } from "react";

import { getDiscussionAttachmentUrl } from "@/lib/api";
import { parseApiDateTime } from "@/lib/api/datetime";

/** Refresh signed URLs this long before they expire. */
const URL_EXPIRY_MARGIN_MS = 60_000;
const FALLBACK_URL_LIFETIME_MS = 5 * 60_000;

type CachedUrl = { url: string; expiresAtMs: number };

const urlCache = new Map<string, CachedUrl>();
const inFlight = new Map<string, Promise<string>>();

function readCachedUrl(attachmentId: string): string | null {
  const cached = urlCache.get(attachmentId);
  if (!cached) return null;
  if (cached.expiresAtMs - Date.now() > URL_EXPIRY_MARGIN_MS) return cached.url;
  urlCache.delete(attachmentId);
  return null;
}

/** Signed download URL for a chat attachment, shared across components until it nears expiry. */
export function resolveAttachmentUrl(programId: string, attachmentId: string): Promise<string> {
  const cached = readCachedUrl(attachmentId);
  if (cached) return Promise.resolve(cached);

  const existing = inFlight.get(attachmentId);
  if (existing) return existing;

  const request = getDiscussionAttachmentUrl(programId, attachmentId)
    .then(({ url, expiresAt }) => {
      const expiresAtMs =
        parseApiDateTime(expiresAt)?.getTime() ?? Date.now() + FALLBACK_URL_LIFETIME_MS;
      urlCache.set(attachmentId, { url, expiresAtMs });
      return url;
    })
    .finally(() => {
      inFlight.delete(attachmentId);
    });
  inFlight.set(attachmentId, request);
  return request;
}

/** Open an attachment in a new tab; the tab opens synchronously so popup blockers allow it. */
export async function openAttachmentInNewTab(
  programId: string,
  attachmentId: string,
): Promise<void> {
  const tab = window.open("about:blank", "_blank");
  if (tab) tab.opener = null;
  try {
    const url = await resolveAttachmentUrl(programId, attachmentId);
    if (tab) tab.location.href = url;
    else window.location.assign(url);
  } catch (error) {
    tab?.close();
    throw error;
  }
}

type ResolvedUrls = Record<string, string | null>;

/** Signed URLs for image thumbnails; `null` entries are loading or failed. */
export function useAttachmentUrls(programId: string, attachmentIds: string[]): ResolvedUrls {
  const idsKey = attachmentIds.join(",");
  const [resolved, setResolved] = useState<ResolvedUrls>({});

  useEffect(() => {
    if (!idsKey) return;
    let isCancelled = false;
    for (const attachmentId of idsKey.split(",")) {
      resolveAttachmentUrl(programId, attachmentId).then(
        (url) => {
          if (!isCancelled) setResolved((prev) => ({ ...prev, [attachmentId]: url }));
        },
        () => {
          /* Thumbnail falls back to the file card. */
        },
      );
    }
    return () => {
      isCancelled = true;
    };
  }, [idsKey, programId]);

  return useMemo(() => {
    const result: ResolvedUrls = {};
    for (const attachmentId of attachmentIds) result[attachmentId] = resolved[attachmentId] ?? null;
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by ids, not array identity
  }, [idsKey, resolved]);
}
