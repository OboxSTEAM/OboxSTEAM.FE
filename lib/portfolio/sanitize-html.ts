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

const ALLOWED_ATTR = ["href", "target", "rel", "class", "style"];

/** Allow only color / alignment / font-size inline styles from TipTap marks. */
function sanitizeInlineStyle(style: string): string {
  const allowed: string[] = [];
  for (const part of style.split(";")) {
    const [rawProp, ...rest] = part.split(":");
    if (!rawProp || rest.length === 0) continue;
    const prop = rawProp.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (!value) continue;
    if (
      prop === "color" &&
      /^(#[0-9a-f]{3,8}|rgb\(|rgba\(|hsl\(|hsla\()/i.test(value)
    ) {
      allowed.push(`color: ${value}`);
    } else if (
      prop === "text-align" &&
      /^(left|center|right|justify)$/i.test(value)
    ) {
      allowed.push(`text-align: ${value}`);
    } else if (
      prop === "font-size" &&
      /^\d+(\.\d+)?(px|em|rem|%)$/i.test(value)
    ) {
      allowed.push(`font-size: ${value}`);
    }
  }
  return allowed.join("; ");
}

let styleHookRegistered = false;

function ensureStyleHook() {
  if (styleHookRegistered) return;
  DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
    if (data.attrName !== "style") return;
    const cleaned = sanitizeInlineStyle(data.attrValue);
    if (cleaned) {
      data.attrValue = cleaned;
    } else {
      data.keepAttr = false;
    }
  });
  styleHookRegistered = true;
}

/** Server-safe HTML sanitizer for portfolio rich text. */
export function sanitizePortfolioHtml(html: string | null | undefined): string {
  if (!html) return "";
  ensureStyleHook();
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

/** True when the string contains HTML tags (rich-text payloads). */
export function hasPortfolioHtmlTags(value: string | null | undefined): boolean {
  if (!value) return false;
  return /<[^>]+>/.test(value);
}
