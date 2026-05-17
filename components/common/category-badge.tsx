import { cn } from "@/lib/utils";
import type { SteamCategory } from "@/lib/landing/content";

interface CategoryBadgeProps {
  category: SteamCategory;
  className?: string;
  size?: "sm" | "md";
}

const CATEGORY_STYLES: Record<
  SteamCategory,
  { bg: string; text: string; label: string }
> = {
  science: { bg: "bg-[#E94B3C]/10", text: "text-[#E94B3C]", label: "Science" },
  technology: { bg: "bg-[#7CB342]/10", text: "text-[#7CB342]", label: "Technology" },
  engineering: { bg: "bg-[#4FC3F7]/15", text: "text-[#2ea8d8]", label: "Engineering" },
  arts: { bg: "bg-[#FDD835]/15", text: "text-[#b89800]", label: "Arts" },
  mathematics: { bg: "bg-[#7E57C2]/10", text: "text-[#7E57C2]", label: "Mathematics" },
};

export function CategoryBadge({ category, className, size = "sm" }: CategoryBadgeProps) {
  const { bg, text, label } = CATEGORY_STYLES[category];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-mono font-medium tracking-wide uppercase",
        size === "sm" ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
        bg,
        text,
        className
      )}
    >
      {label}
    </span>
  );
}
