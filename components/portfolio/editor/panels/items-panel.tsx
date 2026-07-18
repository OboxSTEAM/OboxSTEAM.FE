"use client";

import { useMemo } from "react";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { PortfolioItem } from "@/lib/api/entities/portfolio";
import { PORTFOLIO_ITEM_TYPE_LABELS } from "@/lib/portfolio/constants";
import { cn } from "@/lib/utils";

type ItemsPanelProps = {
  items: PortfolioItem[];
  isSyncing: boolean;
  onSync: () => void;
  onAdd: () => void;
  onEdit: (item: PortfolioItem) => void;
  onDelete: (item: PortfolioItem) => void;
  onToggleVisibility: (item: PortfolioItem, visible: boolean) => void;
};

export function ItemsPanel({
  items,
  isSyncing,
  onSync,
  onAdd,
  onEdit,
  onDelete,
  onToggleVisibility,
}: ItemsPanelProps) {
  const orderedItems = useMemo(
    () => [...items].sort((a, b) => a.displayOrder - b.displayOrder),
    [items],
  );

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-[#6B6B6B]">
        Mục tự động nhập chỉ ẩn/hiện và chỉnh tường thuật; mục thủ công có thể
        xóa. Kéo thả trực tiếp trên trang để sắp xếp.
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
          onClick={onAdd}
        >
          <Plus className="size-4" />
          Thêm mục
        </Button>
      </div>

      {orderedItems.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#C9C9C2] bg-white/70 px-4 py-6 text-center text-sm text-[#6B6B6B]">
          Chưa có mục. Bấm Đồng bộ để nhập chứng chỉ/capstone, hoặc thêm thủ
          công.
        </p>
      ) : (
        <ul className="space-y-2">
          {orderedItems.map((item) => {
            const isAuto = item.source === "AutoImported";
            return (
              <li
                key={item.id}
                className="rounded-2xl border border-[#E5E5E0] bg-white p-3 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B]">
                    {PORTFOLIO_ITEM_TYPE_LABELS[item.itemType] ?? item.itemType}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium text-[#2D2D2D]",
                      isAuto ? "bg-[#4FC3F7]/15" : "bg-[#7CB342]/15",
                    )}
                  >
                    {isAuto ? "Tự động" : "Thủ công"}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-sm font-semibold text-[#2D2D2D]">
                  {item.title ?? "Không có tiêu đề"}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.isVisible}
                      onCheckedChange={(checked) =>
                        onToggleVisibility(item, Boolean(checked))
                      }
                    />
                    <span className="text-xs text-[#6B6B6B]">
                      {item.isVisible ? "Hiện" : "Ẩn"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-lg"
                      onClick={() => onEdit(item)}
                      aria-label="Sửa"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    {!isAuto ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-lg text-[#E94B3C]"
                        onClick={() => onDelete(item)}
                        aria-label="Xóa"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
