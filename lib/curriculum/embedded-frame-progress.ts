import { SCROLL_COMPLETE_EPSILON } from "@/lib/curriculum/constants";

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

function getPdfViewerContainer(doc: Document): HTMLElement | null {
  return (
    doc.getElementById("viewerContainer") ??
    doc.getElementById("viewer") ??
    null
  );
}

type PdfViewerApplicationShape = {
  page?: number;
  pagesCount?: number;
  pdfViewer?: {
    currentPageNumber?: number;
    pagesCount?: number;
  };
};

function getPdfViewerApplication(
  win: Window,
): { page: number; pagesCount: number } | null {
  const pdfViewer = (win as Window & { PDFViewerApplication?: PdfViewerApplicationShape })
    .PDFViewerApplication;

  if (!pdfViewer) return null;

  const page = pdfViewer.page ?? pdfViewer.pdfViewer?.currentPageNumber;
  const pagesCount = pdfViewer.pagesCount ?? pdfViewer.pdfViewer?.pagesCount;

  if (page == null || pagesCount == null || pagesCount < 1) return null;

  return {
    page: Math.min(Math.max(page, 1), pagesCount),
    pagesCount,
  };
}

/** Combines page index with in-page scroll for paginated PDF viewers. */
export function computePaginatedPdfScrollRatio(
  page: number,
  pagesCount: number,
  innerScrollRatio: number,
): number {
  if (pagesCount <= 1) {
    return innerScrollRatio;
  }

  return Math.min(1, ((page - 1) + innerScrollRatio) / pagesCount);
}

export function isScrollComplete(scrollRatio: number): boolean {
  return scrollRatio >= 1 - SCROLL_COMPLETE_EPSILON;
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

    const viewerContainer = getPdfViewerContainer(doc);
    const pdfViewer = getPdfViewerApplication(win);
    const page = pdfViewer?.page ?? parsePdfPageFromHash(win.location.hash);

    if (viewerContainer && viewerContainer.scrollHeight > viewerContainer.clientHeight) {
      const containerScrollRatio = getScrollRatio(viewerContainer);

      if (pdfViewer) {
        const paginatedRatio = computePaginatedPdfScrollRatio(
          pdfViewer.page,
          pdfViewer.pagesCount,
          containerScrollRatio,
        );

        const scrollRatio =
          pdfViewer.page >= pdfViewer.pagesCount && isScrollComplete(containerScrollRatio)
            ? 1
            : Math.max(containerScrollRatio, paginatedRatio);

        return { page, scrollRatio };
      }

      return { page, scrollRatio: containerScrollRatio };
    }

    if (pdfViewer) {
      const scrollRatio =
        pdfViewer.pagesCount <= 1
          ? 1
          : pdfViewer.page / pdfViewer.pagesCount;

      return { page, scrollRatio };
    }

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
    if (!doc) return;

    const viewerContainer = getPdfViewerContainer(doc);
    const scrollRoot = (viewerContainer ??
      doc.scrollingElement ??
      doc.documentElement) as HTMLElement | undefined;

    if (!scrollRoot) return;

    const maxScroll = scrollRoot.scrollHeight - scrollRoot.clientHeight;
    scrollRoot.scrollTop = maxScroll * scrollRatio;
  } catch {
    // Cross-origin embed — restore via #page only.
  }
}
