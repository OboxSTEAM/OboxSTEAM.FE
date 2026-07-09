function isSameOriginUrl(fileUrl: string): boolean {
  try {
    return new URL(fileUrl, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Fetch cross-origin PDFs into a blob URL for same-origin loading in the
 * browser's native PDF iframe viewer.
 */
export async function resolvePdfEmbedUrl(fileUrl: string): Promise<{
  embedUrl: string;
  revoke?: () => void;
}> {
  if (isSameOriginUrl(fileUrl)) {
    return { embedUrl: fileUrl };
  }

  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error("Failed to fetch PDF for embedded viewing.");
  }

  const blob = await response.blob();
  const embedUrl = URL.createObjectURL(blob);

  return {
    embedUrl,
    revoke: () => URL.revokeObjectURL(embedUrl),
  };
}
