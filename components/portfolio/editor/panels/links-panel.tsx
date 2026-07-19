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
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs leading-relaxed text-[#6B6B6B]">
          Chọn nền tảng — icon tự nhận từ URL. Liên kết trống sẽ bị loại khi lưu.
        </p>
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
          {PORTFOLIO_LINK_PLATFORMS.filter((platform) => platform.id !== "website").map(
            (platform) => (
              <button
                key={platform.id}
                type="button"
                onClick={() => addFromPlatform(platform.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border border-[#E5E5E0] bg-white px-1.5 py-2.5",
                  "text-[10px] font-semibold text-[#2D2D2D] transition-colors",
                  "hover:border-[#C9C9C2] hover:bg-[#FAFAF5]",
                  "outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50",
                )}
              >
                <span
                  className="flex size-8 items-center justify-center rounded-lg bg-[#FAFAF5]"
                  style={{ color: platform.accent }}
                >
                  <PortfolioLinkIcon platformId={platform.id} size={16} />
                </span>
                <span className="truncate">{platform.label}</span>
              </button>
            ),
          )}
        </div>
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
                className="rounded-2xl border border-[#E5E5E0] bg-white p-3 shadow-[0_1px_0_rgba(45,45,45,0.04)]"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FAFAF5]"
                    style={{ color: platform.accent }}
                    title={platform.label}
                  >
                    <PortfolioLinkIcon
                      url={link.url}
                      label={link.label}
                      size={18}
                    />
                  </span>

                  <div className="min-w-0 flex-1 space-y-2">
                    <Input
                      value={link.label ?? ""}
                      onChange={(event) =>
                        updateLink(index, { label: event.target.value })
                      }
                      className="h-9 rounded-xl border-[#E5E5E0] bg-[#FAFAF5] text-sm"
                      placeholder={platform.label}
                      aria-label={`Nhãn liên kết ${index + 1}`}
                    />
                    <Input
                      value={link.url ?? ""}
                      onChange={(event) =>
                        updateLink(index, { url: event.target.value })
                      }
                      className="h-9 rounded-xl border-[#E5E5E0] bg-[#FAFAF5] font-mono text-xs"
                      placeholder={platform.urlHint}
                      aria-label={`URL liên kết ${index + 1}`}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="mt-0.5 shrink-0 text-[#E94B3C] hover:bg-[#E94B3C]/10 hover:text-[#E94B3C]"
                    aria-label={`Xóa liên kết ${index + 1}`}
                    onClick={() => removeLink(index)}
                  >
                    <Trash2 className="size-3.5" />
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
