import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "a",
  "ul",
  "ol",
  "li",
  "blockquote",
  "h2",
  "h3",
  "span",
];

const ALLOWED_ATTR = ["href", "target", "rel", "class"];

/** Server-safe HTML sanitizer for portfolio rich text. */
export function sanitizePortfolioHtml(html: string | null | undefined): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}

export function isEmptyPortfolioHtml(html: string | null | undefined): boolean {
  if (!html) return true;
  const text = sanitizePortfolioHtml(html)
    .replace(/<br\s*\/?>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]+>/g, "")
    .trim();
  return text.length === 0;
}
