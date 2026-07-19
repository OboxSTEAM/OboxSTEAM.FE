import { cn } from "@/lib/utils";
import { sanitizePortfolioHtml } from "@/lib/portfolio/sanitize-html";

type RichTextProps = {
  html: string | null | undefined;
  className?: string;
  as?: "div" | "section" | "article" | "span";
  /**
   * Keep compact fields (subtitle / org) on one line — TipTap wraps in `<p>`,
   * which must render inline on review pages.
   */
  inline?: boolean;
};

/** Strip block wrappers so compact TipTap HTML can sit on one meta line. */
function flattenForInline(html: string): string {
  return html
    .replace(/<\/p>\s*<p[^>]*>/gi, " ")
    .replace(/<\/?p[^>]*>/gi, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Server-safe rich text renderer (sanitized HTML). */
export function RichText({
  html,
  className,
  as,
  inline = false,
}: RichTextProps) {
  let clean = sanitizePortfolioHtml(html);
  if (!clean) return null;
  if (inline) {
    clean = flattenForInline(clean);
    if (!clean) return null;
  }

  const Tag = as ?? (inline ? "span" : "div");

  return (
    <Tag
      className={cn(
        "portfolio-rich-text prose prose-sm max-w-none min-w-0 break-words text-inherit [overflow-wrap:anywhere]",
        "prose-headings:font-heading prose-a:text-[#0f7cad]",
        inline
          ? "inline !max-w-none [&_p]:m-0 [&_p]:inline [&_br]:hidden"
          : "prose-p:my-2",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
