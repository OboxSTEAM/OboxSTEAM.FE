"use client";

import { Plus, Trash2 } from "lucide-react";

import { PortfolioLinkIcon } from "@/components/portfolio/links/portfolio-link-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PortfolioLink } from "@/lib/api/entities/portfolio";
import {
  createPortfolioLinkFromPlatform,
  PORTFOLIO_LINK_PLATFORMS,
  resolvePortfolioLinkPlatform,
  type PortfolioLinkPlatformId,
} from "@/lib/portfolio/links";
import { cn } from "@/lib/utils";

type LinksPanelProps = {
  links: PortfolioLink[];
  onLinksChange: (links: PortfolioLink[]) => void;
};

export function LinksPanel({ links, onLinksChange }: LinksPanelProps) {
  const updateLink = (index: number, patch: Partial<PortfolioLink>) => {
    onLinksChange(
      links.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    );
  };

  const addBlankLink = () => {
    onLinksChange([...links, { label: "", url: "" }]);
  };

  const addFromPlatform = (platformId: PortfolioLinkPlatformId) => {
    const seed = createPortfolioLinkFromPlatform(platformId);
    onLinksChange([...links, seed]);
  };

  const removeLink = (index: number) => {
    onLinksChange(links.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-[#6B6B6B]">
        Chọn nền tảng — icon tự nhận từ URL. Liên kết trống sẽ bị loại khi lưu.
      </p>

      <div className="grid grid-cols-3 gap-2">
        {PORTFOLIO_LINK_PLATFORMS.filter(
          (platform) => platform.id !== "website",
        ).map((platform) => (
          <button
            key={platform.id}
            type="button"
            onClick={() => addFromPlatform(platform.id)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-2xl border border-[#E5E5E0] bg-white px-2 py-3",
              "shadow-[0_1px_0_rgba(45,45,45,0.04)] transition-colors",
              "hover:border-[#C9C9C2] hover:bg-[#FAFAF5]",
              "outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50",
            )}
          >
            <span
              className="flex size-10 items-center justify-center rounded-xl bg-[#FAFAF5]"
              style={{ color: platform.accent }}
            >
              <PortfolioLinkIcon platformId={platform.id} size={18} />
            </span>
            <span className="truncate text-xs font-semibold text-[#2D2D2D]">
              {platform.label}
            </span>
          </button>
        ))}
      </div>

      {links.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#C9C9C2] bg-white/70 px-4 py-6 text-center text-sm text-[#6B6B6B]">
          Chưa có liên kết — chọn một nền tảng ở trên.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {links.map((link, index) => {
            const platform = resolvePortfolioLinkPlatform(link.url, link.label);
            return (
              <li
                key={`link-${index}`}
                className="rounded-2xl border border-[#E5E5E0] bg-white p-3.5 shadow-[0_1px_0_rgba(45,45,45,0.04)]"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className="flex size-8 items-center justify-center rounded-lg bg-[#FAFAF5]"
                    style={{ color: platform.accent }}
                  >
                    <PortfolioLinkIcon
                      url={link.url}
                      label={link.label}
                      size={16}
                    />
                  </span>
                  <span className="rounded-lg bg-[#F0F0EA] px-2.5 py-1 text-xs font-semibold tracking-wide text-[#5C5C5C]">
                    {platform.label}
                  </span>
                </div>

                <div className="mt-2.5 space-y-2">
                  <Input
                    value={link.label ?? ""}
                    onChange={(event) =>
                      updateLink(index, { label: event.target.value })
                    }
                    className="h-10 rounded-xl border-[#E5E5E0] bg-[#FAFAF5] text-[15px] font-semibold"
                    placeholder={platform.label}
                    aria-label={`Nhãn liên kết ${index + 1}`}
                  />
                  <Input
                    value={link.url ?? ""}
                    onChange={(event) =>
                      updateLink(index, { url: event.target.value })
                    }
                    className="h-10 rounded-xl border-[#E5E5E0] bg-[#FAFAF5] font-mono text-sm"
                    placeholder={platform.urlHint}
                    aria-label={`URL liên kết ${index + 1}`}
                  />
                </div>

                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-lg text-[#E94B3C] hover:bg-[#E94B3C]/10 hover:text-[#E94B3C]"
                    aria-label={`Xóa liên kết ${index + 1}`}
                    onClick={() => removeLink(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        className="h-10 w-full rounded-xl border-[#E5E5E0] bg-white"
        onClick={addBlankLink}
      >
        <Plus className="size-4" />
        Thêm liên kết tùy chỉnh
      </Button>
    </div>
  );
}
