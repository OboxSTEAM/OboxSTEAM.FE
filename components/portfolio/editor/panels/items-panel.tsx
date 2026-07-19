"use client";

import { useMemo } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { PortfolioItem } from "@/lib/api/entities/portfolio";
import { PORTFOLIO_ITEM_TYPE_LABELS } from "@/lib/portfolio/constants";
import { stripPortfolioHtmlText } from "@/lib/portfolio/sanitize-html";
import { cn } from "@/lib/utils";

type ItemsPanelProps = {
  items: PortfolioItem[];
  isSyncing: boolean;
  isAdding?: boolean;
  onSync: () => void;
  onAdd: () => void;
  onDelete: (item: PortfolioItem) => void;
  onToggleVisibility: (item: PortfolioItem, visible: boolean) => void;
};

function itemTitlePreview(title: string | null | undefined): string {
  const plain = stripPortfolioHtmlText(title);
  return plain || "Không có tiêu đề";
}

export function ItemsPanel({
  items,
  isSyncing,
  isAdding = false,
  onSync,
  onAdd,
  onDelete,
  onToggleVisibility,
}: ItemsPanelProps) {
  const orderedItems = useMemo(
    () => [...items].sort((a, b) => a.displayOrder - b.displayOrder),
    [items],
  );

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-[#6B6B6B]">
        Mục tự động nhập chỉ ẩn/hiện và chỉnh tường thuật; mục thủ công chỉnh
        trực tiếp trên thẻ. Kéo thả trên trang để sắp xếp. Bấm Thêm mục để tạo
        thẻ trống.
      </p>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-10 flex-1 rounded-xl border-[#E5E5E0] bg-white"
          disabled={isSyncing}
          onClick={onSync}
        >
          <RefreshCw className={cn("size-4", isSyncing && "animate-spin")} />
          Đồng bộ
        </Button>
        <Button
          type="button"
          className="h-10 flex-1 rounded-xl bg-[#E94B3C] text-white hover:bg-[#E94B3C]/90"
          disabled={isAdding}
          onClick={onAdd}
        >
          <Plus className="size-4" />
          {isAdding ? "Đang thêm…" : "Thêm mục"}
        </Button>
      </div>

      {orderedItems.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#C9C9C2] bg-white/70 px-4 py-6 text-center text-sm text-[#6B6B6B]">
          Chưa có mục. Bấm Đồng bộ để nhập chứng chỉ/capstone, hoặc thêm thủ
          công.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {orderedItems.map((item) => {
            const isAuto = item.source === "AutoImported";
            return (
              <li
                key={item.id}
                className={cn(
                  "rounded-2xl border bg-white p-3.5 shadow-[0_1px_0_rgba(45,45,45,0.04)]",
                  item.isVisible
                    ? "border-[#E5E5E0]"
                    : "border-dashed border-[#C9C9C2] opacity-90",
                )}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-lg bg-[#F0F0EA] px-2.5 py-1 text-xs font-semibold tracking-wide text-[#5C5C5C]">
                    {PORTFOLIO_ITEM_TYPE_LABELS[item.itemType] ?? item.itemType}
                  </span>
                  <span
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-semibold",
                      isAuto
                        ? "bg-[#4FC3F7]/18 text-[#0f7cad]"
                        : "bg-[#7CB342]/18 text-[#558B2F]",
                    )}
                  >
                    {isAuto ? "Tự động" : "Thủ công"}
                  </span>
                  {!item.isVisible ? (
                    <span className="rounded-lg bg-[#2D2D2D]/8 px-2.5 py-1 text-xs font-semibold text-[#2D2D2D]">
                      Đang ẩn
                    </span>
                  ) : null}
                </div>

                <p className="mt-2.5 line-clamp-2 text-[15px] font-semibold leading-snug text-[#2D2D2D]">
                  {itemTitlePreview(item.title)}
                </p>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-full border border-[#E5E5E0] bg-[#FAFAF5] py-1 pr-3 pl-1.5 transition-colors hover:border-[#C9C9C2]">
                    <Switch
                      checked={item.isVisible}
                      onCheckedChange={(checked) =>
                        onToggleVisibility(item, Boolean(checked))
                      }
                      className={cn(
                        "h-5 w-9 border border-[#E5E5E0] shadow-none",
                        "data-checked:border-transparent data-checked:bg-[#E94B3C]",
                        "data-unchecked:bg-[#E5E5E0]",
                      )}
                      aria-label={
                        item.isVisible
                          ? `Ẩn ${itemTitlePreview(item.title)}`
                          : `Hiện ${itemTitlePreview(item.title)}`
                      }
                    />
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        item.isVisible ? "text-[#2D2D2D]" : "text-[#6B6B6B]",
                      )}
                    >
                      {item.isVisible ? "Hiện" : "Ẩn"}
                    </span>
                  </label>

                  {!isAuto ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-lg text-[#E94B3C] hover:bg-[#E94B3C]/10 hover:text-[#E94B3C]"
                      onClick={() => onDelete(item)}
                      aria-label="Xóa"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
