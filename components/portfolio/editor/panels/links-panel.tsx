"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PortfolioLink } from "@/lib/api/entities/portfolio";

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

  const addLink = () => {
    onLinksChange([...links, { label: "", url: "" }]);
  };

  const removeLink = (index: number) => {
    onLinksChange(links.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-[#6B6B6B]">
        Thêm GitHub, Behance, LinkedIn… Liên kết trống sẽ bị loại khi lưu.
      </p>

      {links.length === 0 ? (
        <p className="rounded-xl bg-[#FAFAF5] px-4 py-6 text-center text-sm text-[#6B6B6B]">
          Chưa có liên kết.
        </p>
      ) : (
        <div className="space-y-3">
          {links.map((link, index) => (
            <div
              key={`link-${index}`}
              className="space-y-2 rounded-xl border border-[#E5E5E0] bg-[#FAFAF5] p-3"
            >
              <div className="space-y-1.5">
                <Label className="text-xs">Nhãn</Label>
                <Input
                  value={link.label ?? ""}
                  onChange={(event) =>
                    updateLink(index, { label: event.target.value })
                  }
                  className="h-10 rounded-xl bg-white"
                  placeholder="GitHub"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">URL</Label>
                <Input
                  value={link.url ?? ""}
                  onChange={(event) =>
                    updateLink(index, { url: event.target.value })
                  }
                  className="h-10 rounded-xl bg-white"
                  placeholder="https://"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                className="h-8 w-full rounded-lg text-xs text-[#E94B3C]"
                onClick={() => removeLink(index)}
              >
                <Trash2 className="size-3.5" />
                Xóa liên kết
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="h-10 w-full rounded-xl"
        onClick={addLink}
      >
        <Plus className="size-4" />
        Thêm liên kết
      </Button>
    </div>
  );
}
