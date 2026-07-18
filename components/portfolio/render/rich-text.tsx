import { cn } from "@/lib/utils";
import { sanitizePortfolioHtml } from "@/lib/portfolio/sanitize-html";

type RichTextProps = {
  html: string | null | undefined;
  className?: string;
  as?: "div" | "section" | "article";
};

/** Server-safe rich text renderer (sanitized HTML). */
export function RichText({ html, className, as: Tag = "div" }: RichTextProps) {
  const clean = sanitizePortfolioHtml(html);
  if (!clean) return null;

  return (
    <Tag
      className={cn(
        "portfolio-rich-text prose prose-sm max-w-none min-w-0 break-words text-inherit [overflow-wrap:anywhere]",
        "prose-p:my-2 prose-headings:font-heading prose-a:text-[#0f7cad]",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
