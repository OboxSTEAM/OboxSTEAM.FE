"use client";

import { useMemo } from "react";
import { Reorder } from "motion/react";
import { GripVertical } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { PortfolioTheme } from "@/lib/api/entities/portfolio";
import {
  getPortfolioLayoutStyleId,
  getPortfolioTemplateId,
  normalizeSectionOrder,
  PORTFOLIO_COLOR_SWATCHES,
  PORTFOLIO_FONTS,
  PORTFOLIO_LAYOUT_STYLES,
  PORTFOLIO_SECTIONS,
  PORTFOLIO_TEMPLATES,
  type PortfolioSectionId,
} from "@/lib/portfolio/constants";
import { cn } from "@/lib/utils";

const LIGHT_SELECT_TRIGGER =
  "h-10 w-full rounded-xl border-[#E5E5E0] bg-white text-[#2D2D2D]";
const LIGHT_SELECT_CONTENT =
  "rounded-xl border-[#E5E5E0] bg-white text-[#2D2D2D]";
const LIGHT_SELECT_ITEM = "rounded-lg focus:bg-[#F5F5F0]";

type DesignPanelProps = {
  theme: PortfolioTheme;
  onThemeChange: (theme: PortfolioTheme) => void;
};

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="size-10 cursor-pointer rounded-xl border border-[#E5E5E0] bg-white p-1"
          aria-label={label}
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 rounded-xl font-mono text-sm"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {PORTFOLIO_COLOR_SWATCHES.map((swatch) => (
          <button
            key={swatch.value}
            type="button"
            title={swatch.label}
            aria-label={swatch.label}
            onClick={() => onChange(swatch.value)}
            className={cn(
              "size-7 rounded-full border-2 transition hover:scale-105",
              value.toLowerCase() === swatch.value.toLowerCase()
                ? "border-[#2D2D2D]"
                : "border-transparent",
            )}
            style={{ backgroundColor: swatch.value }}
          />
        ))}
      </div>
    </div>
  );
}

export function DesignPanel({ theme, onThemeChange }: DesignPanelProps) {
  const templateId = getPortfolioTemplateId(theme.templateId);
  const fontId = theme.fontFamily || PORTFOLIO_FONTS[0].id;
  const layoutId = getPortfolioLayoutStyleId(theme.layoutStyle);
  const sectionOrder = useMemo(
    () => normalizeSectionOrder(theme.sectionOrder),
    [theme.sectionOrder],
  );
  const primary = theme.primaryColor || "#E94B3C";
  const secondary = theme.secondaryColor || "#4FC3F7";

  const patchTheme = (patch: Partial<PortfolioTheme>) => {
    onThemeChange({ ...theme, ...patch });
  };

  const sectionLabel = (id: PortfolioSectionId) =>
    PORTFOLIO_SECTIONS.find((section) => section.id === id)?.label ?? id;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Mẫu giao diện</Label>
        <div className="grid gap-2">
          {PORTFOLIO_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => patchTheme({ templateId: template.id })}
              className={cn(
                "rounded-xl border p-3 text-left transition",
                templateId === template.id
                  ? "border-[#4FC3F7] bg-[#4FC3F7]/10 shadow-sm"
                  : "border-[#E5E5E0] bg-[#FAFAF5] hover:border-[#C9C9C2]",
              )}
            >
              <p className="text-sm font-semibold text-[#2D2D2D]">
                {template.label}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#6B6B6B]">
                {template.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <ColorField
        label="Màu chính"
        value={primary}
        onChange={(next) => patchTheme({ primaryColor: next })}
      />
      <ColorField
        label="Màu phụ"
        value={secondary}
        onChange={(next) => patchTheme({ secondaryColor: next })}
      />

      <div className="space-y-2">
        <Label>Font chữ</Label>
        <Select
          value={fontId}
          onValueChange={(value) => {
            if (value) patchTheme({ fontFamily: value });
          }}
        >
          <SelectTrigger className={LIGHT_SELECT_TRIGGER}>
            <span className="truncate">
              {PORTFOLIO_FONTS.find((font) => font.id === fontId)?.label ??
                fontId}
            </span>
          </SelectTrigger>
          <SelectContent className={LIGHT_SELECT_CONTENT}>
            {PORTFOLIO_FONTS.map((font) => (
              <SelectItem
                key={font.id}
                value={font.id}
                className={LIGHT_SELECT_ITEM}
              >
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Kiểu bố cục</Label>
        <Select
          value={layoutId}
          onValueChange={(value) => {
            if (value) patchTheme({ layoutStyle: value });
          }}
        >
          <SelectTrigger className={LIGHT_SELECT_TRIGGER}>
            <span className="truncate">
              {PORTFOLIO_LAYOUT_STYLES.find((layout) => layout.id === layoutId)
                ?.label ?? layoutId}
            </span>
          </SelectTrigger>
          <SelectContent className={LIGHT_SELECT_CONTENT}>
            {PORTFOLIO_LAYOUT_STYLES.map((layout) => (
              <SelectItem
                key={layout.id}
                value={layout.id}
                className={LIGHT_SELECT_ITEM}
              >
                {layout.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Thứ tự phần</Label>
        <p className="text-xs text-[#6B6B6B]">
          Kéo thả tại đây hoặc kéo trực tiếp trên trang.
        </p>
        <Reorder.Group
          axis="y"
          values={sectionOrder}
          onReorder={(next) => patchTheme({ sectionOrder: next })}
          className="space-y-2"
        >
          {sectionOrder.map((sectionId) => (
            <Reorder.Item
              key={sectionId}
              value={sectionId}
              className="flex cursor-grab items-center gap-3 rounded-xl border border-[#E5E5E0] bg-[#FAFAF5] px-3 py-2.5 active:cursor-grabbing"
            >
              <GripVertical className="size-4 text-[#6B6B6B]" />
              <span className="text-sm font-medium text-[#2D2D2D]">
                {sectionLabel(sectionId)}
              </span>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>
    </div>
  );
}
