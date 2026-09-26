"use client";

import { Lock } from "lucide-react";

import { RichTextEditor } from "@/components/portfolio/editor/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetBody,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import type { PortfolioItem } from "@/lib/api/entities/portfolio";
import { parseEmbedSource, stripEmbedSource } from "@/lib/portfolio/embed-providers";

type PortfolioItemDetailSheetProps = {
  item: PortfolioItem | null;
  isDark: boolean;
  onOpenChange: (open: boolean) => void;
  onPatch: (itemId: string, patch: Partial<PortfolioItem>) => void;
};

function plain(value: string | null | undefined): string {
  return stripEmbedSource(value ?? "");
}

export function PortfolioItemDetailSheet({
  item,
  isDark,
  onOpenChange,
  onPatch,
}: PortfolioItemDetailSheetProps) {
  const open = item != null;
  const isAuto = item?.source === "AutoImported";
  const demo = item ? parseEmbedSource(item.externalUrl) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Chỉnh sửa chi tiết</SheetTitle>
        </SheetHeader>
        {item ? (
          <SheetBody className="space-y-4 overflow-y-auto px-4 pb-6">
            {isAuto ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="size-3.5" />
                Một số trường được đồng bộ từ chương trình.
              </p>
            ) : null}
            <Field label="Tiêu đề">
              <Input
                value={plain(item.title)}
                disabled={isAuto}
                maxLength={200}
                onChange={(event) => onPatch(item.id, { title: event.target.value })}
              />
            </Field>
            <Field label="Phụ đề">
              <Input
                value={plain(item.subtitle)}
                disabled={isAuto}
                maxLength={200}
                onChange={(event) => onPatch(item.id, { subtitle: event.target.value })}
              />
            </Field>
            <Field label="Tổ chức">
              <Input
                value={plain(item.organization)}
                disabled={isAuto}
                maxLength={200}
                onChange={(event) =>
                  onPatch(item.id, { organization: event.target.value })
                }
              />
            </Field>
            <Field label="URL ngoài">
              <Input
                type="url"
                value={item.externalUrl ?? ""}
                disabled={isAuto}
                placeholder="https://"
                onChange={(event) =>
                  onPatch(item.id, { externalUrl: event.target.value || null })
                }
              />
              {demo ? (
                <p className="text-xs text-[#0f7cad]">Hỗ trợ demo tương tác · {demo.label}</p>
              ) : null}
            </Field>
            <Field label="Nội dung tường thuật">
              <RichTextEditor
                mode="full"
                isDark={isDark}
                value={item.studentEditedBody ?? ""}
                onChange={(next) => onPatch(item.id, { studentEditedBody: next })}
                ariaLabel="Nội dung tường thuật"
                placeholder="Kể câu chuyện của bạn…"
              />
            </Field>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Xong
            </Button>
          </SheetBody>
        ) : null}
      </SheetPopup>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
