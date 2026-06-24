export type EmbeddedFrameProgress = {
  page: number;
  scrollRatio: number;
};

export function getScrollRatio(element: HTMLElement): number {
  if (element.scrollHeight <= element.clientHeight) return 1;
  return element.scrollTop / (element.scrollHeight - element.clientHeight);
}

export function parsePdfPageFromHash(hash: string): number {
  const match = hash.match(/page=(\d+)/i);
  return match ? Math.max(1, Number.parseInt(match[1], 10)) : 1;
}

export function buildPdfSrc(fileUrl: string, page: number): string {
  const base = fileUrl.split("#")[0] ?? fileUrl;
  return page > 1 ? `${base}#page=${page}` : base;
}

/** Read page + in-document scroll from an embedded PDF/DOC iframe (same-origin only). */
export function readEmbeddedFrameProgress(
  iframe: HTMLIFrameElement | null,
): EmbeddedFrameProgress | null {
  if (!iframe) return null;

  try {
    const win = iframe.contentWindow;
    const doc = win?.document;
    if (!win || !doc) return null;

    const pdfViewer = (
      win as Window & { PDFViewerApplication?: { page: number; pagesCount: number } }
    ).PDFViewerApplication;

    if (pdfViewer?.page) {
      const pagesCount = pdfViewer.pagesCount || pdfViewer.page;
      return {
        page: pdfViewer.page,
        scrollRatio: pagesCount > 1 ? pdfViewer.page / pagesCount : 1,
      };
    }

    const page = parsePdfPageFromHash(win.location.hash);
    const scrollRoot = (doc.scrollingElement ?? doc.documentElement) as HTMLElement;
    return {
      page,
      scrollRatio: getScrollRatio(scrollRoot),
    };
  } catch {
    return null;
  }
}

export function restoreEmbeddedFrameScroll(
  iframe: HTMLIFrameElement | null,
  scrollRatio: number,
): void {
  if (!iframe || scrollRatio <= 0) return;

  try {
    const doc = iframe.contentWindow?.document;
    const scrollRoot = (doc?.scrollingElement ?? doc?.documentElement) as
      | HTMLElement
      | undefined;
    if (!scrollRoot) return;

    const maxScroll = scrollRoot.scrollHeight - scrollRoot.clientHeight;
    scrollRoot.scrollTop = maxScroll * scrollRatio;
  } catch {
    // Cross-origin embed — restore via #page only.
  }
}
