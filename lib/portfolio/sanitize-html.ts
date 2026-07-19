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

const ALLOWED_ATTR = ["href", "target", "rel", "class", "style", "align"];

const ALIGNMENTS = new Set(["left", "center", "right", "justify"]);

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

function alignmentFromStyle(style: string | null): string | null {
  if (!style) return null;
  const match = /text-align\s*:\s*(left|center|right|justify)/i.exec(style);
  return match ? match[1].toLowerCase() : null;
}

function sanitizeClassAttr(className: string): string {
  return className
    .split(/\s+/)
    .filter((token) => /^pf-align-(left|center|right|justify)$/i.test(token))
    .map((token) => token.toLowerCase())
    .join(" ");
}

let hooksRegistered = false;

function ensureSanitizeHooks() {
  if (hooksRegistered) return;

  DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
    if (data.attrName === "style") {
      const cleaned = sanitizeInlineStyle(data.attrValue);
      if (cleaned) {
        data.attrValue = cleaned;
      } else {
        data.keepAttr = false;
      }
      return;
    }
    if (data.attrName === "class") {
      const cleaned = sanitizeClassAttr(data.attrValue);
      if (cleaned) {
        data.attrValue = cleaned;
      } else {
        data.keepAttr = false;
      }
      return;
    }
    if (data.attrName === "align") {
      const value = data.attrValue.trim().toLowerCase();
      if (ALIGNMENTS.has(value)) {
        data.attrValue = value;
      } else {
        data.keepAttr = false;
      }
    }
  });

  // Prefer class-based alignment — BE strips inline style but often keeps class.
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.nodeType !== 1) return;
    const el = node as Element;
    if (!/^(P|H2|H3|LI|DIV)$/i.test(el.tagName)) return;

    const existingClass = sanitizeClassAttr(el.getAttribute("class") ?? "");
    if (existingClass) {
      el.setAttribute("class", existingClass);
      return;
    }

    const fromAlign = el.getAttribute("align")?.toLowerCase() ?? null;
    const fromStyle = alignmentFromStyle(el.getAttribute("style"));
    const align =
      fromAlign && ALIGNMENTS.has(fromAlign)
        ? fromAlign
        : fromStyle && ALIGNMENTS.has(fromStyle)
          ? fromStyle
          : null;

    if (!align) return;
    el.setAttribute("class", `pf-align-${align}`);
    el.removeAttribute("align");
    // Drop text-align from style so payload matches what TipTap emits.
    const style = el.getAttribute("style");
    if (style) {
      const next = style
        .split(";")
        .map((part) => part.trim())
        .filter((part) => part && !/^text-align\s*:/i.test(part))
        .join("; ");
      if (next) el.setAttribute("style", next);
      else el.removeAttribute("style");
    }
  });

  hooksRegistered = true;
}

/** Server-safe HTML sanitizer for portfolio rich text. */
export function sanitizePortfolioHtml(html: string | null | undefined): string {
  if (!html) return "";
  ensureSanitizeHooks();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}

export function isEmptyPortfolioHtml(html: string | null | undefined): boolean {
  if (!html) return true;
  return stripPortfolioHtmlText(html).length === 0;
}

/** Plain text from rich-text HTML (titles, list previews). */
export function stripPortfolioHtmlText(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when the string contains HTML tags (rich-text payloads). */
export function hasPortfolioHtmlTags(value: string | null | undefined): boolean {
  if (!value) return false;
  return /<[^>]+>/.test(value);
}

/** Empty rich-text HTML → null for API save (keeps safe alignment classes). */
export function nullIfEmptyHtml(html: string | null | undefined): string | null {
  if (html == null) return null;
  const cleaned = sanitizePortfolioHtml(html).trim();
  if (!cleaned || isEmptyPortfolioHtml(cleaned)) return null;
  return cleaned;
}

/** True when HTML encodes text alignment (class, align attr, or style). */
export function hasPortfolioTextAlign(html: string | null | undefined): boolean {
  if (!html) return false;
  return /pf-align-|text-align\s*:|\salign="/i.test(html);
}

/**
 * If the client sent alignment but the API response dropped it, keep the
 * sanitized client HTML so the editor does not snap back mid-session.
 */
export function preferAlignedHtml(
  sent: string | null | undefined,
  received: string | null | undefined,
): string | null {
  const cleanSent = nullIfEmptyHtml(sent);
  const cleanReceived = nullIfEmptyHtml(received);
  if (
    cleanSent &&
    hasPortfolioTextAlign(cleanSent) &&
    !hasPortfolioTextAlign(cleanReceived)
  ) {
    return cleanSent;
  }
  return cleanReceived;
}
