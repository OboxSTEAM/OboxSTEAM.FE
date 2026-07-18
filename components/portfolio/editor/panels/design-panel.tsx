"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaUploader } from "@/components/portfolio/editor/media-uploader";
import type {
  PortfolioTheme,
  PortfolioThemeSlotOverrides,
} from "@/lib/api/entities/portfolio";
import {
  parseThemeSettingsJson,
  serializeThemeSettingsJson,
} from "@/lib/api/entities/portfolio";
import {
  getPortfolioLayoutStyleId,
  getPortfolioTemplateId,
  PORTFOLIO_BACKGROUND_STYLES,
  PORTFOLIO_CARD_STYLES,
  PORTFOLIO_COLOR_SWATCHES,
  PORTFOLIO_DENSITIES,
  PORTFOLIO_FONTS,
  PORTFOLIO_FONT_SCALES,
  PORTFOLIO_LAYOUT_STYLES,
  PORTFOLIO_LINE_HEIGHTS,
  type PortfolioTemplateId,
} from "@/lib/portfolio/constants";
import {
  applyPresetToTheme,
  BACKGROUND_SLOT_OPTIONS,
  CARD_SLOT_OPTIONS,
  HERO_TEXT_SLOT_OPTIONS,
  REVEAL_SLOT_OPTIONS,
  THEME_PRESETS,
  type BackgroundSlotId,
  type CardSlotId,
  type HeroTextSlotId,
  type RevealSlotId,
} from "@/lib/portfolio/theme-presets";
import { cn } from "@/lib/utils";

type DesignPanelProps = {
  theme: PortfolioTheme;
  onThemeChange: (theme: PortfolioTheme) => void;
};

function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6B6B6B]">
      {children}
    </p>
  );
}

function OptionChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "rounded-xl border px-2.5 py-1.5 text-left text-xs font-semibold transition-all duration-150 outline-none",
        "focus-visible:ring-2 focus-visible:ring-[#4FC3F7] active:scale-[0.98]",
        selected
          ? "border-[#4FC3F7]/55 bg-[#4FC3F7]/12 text-[#0f7cad] shadow-sm"
          : "border-[#E5E5E0] bg-white text-[#2D2D2D] hover:border-[#C9C9C2] hover:bg-[#F5F5F0]",
      )}
    >
      {label}
    </button>
  );
}

function ChipGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  allowClear,
  clearLabel = "Theo preset",
}: {
  label: string;
  value: T | undefined;
  options: Array<{ id: T; label: string }>;
  onChange: (next: T | undefined) => void;
  allowClear?: boolean;
  clearLabel?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-[#2D2D2D]">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {allowClear ? (
          <OptionChip
            label={clearLabel}
            selected={value == null}
            onClick={() => onChange(undefined)}
          />
        ) : null}
        {options.map((option) => (
          <OptionChip
            key={option.id}
            label={option.label}
            selected={value === option.id}
            onClick={() => onChange(option.id)}
          />
        ))}
      </div>
    </div>
  );
}

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
      <p className="text-xs font-medium text-[#2D2D2D]">{label}</p>
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
          className="h-10 rounded-xl border-[#E5E5E0] bg-white font-mono text-sm"
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
                ? "border-[#2D2D2D] ring-2 ring-[#4FC3F7]/40"
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
  const preset = THEME_PRESETS[templateId];
  const slotOverrides = parseThemeSettingsJson(theme.settingsJson) ?? {};

  const fontFamily = theme.fontFamily ?? preset.fontFamily;
  const headingFontFamily = theme.headingFontFamily ?? preset.headingFontFamily;
  const fontScale = theme.fontScale ?? preset.fontScale;
  const lineHeight = theme.lineHeight ?? preset.lineHeight;
  const density = theme.density ?? preset.density;
  const backgroundStyle = theme.backgroundStyle ?? preset.backgroundStyle;
  const cardStyle = theme.cardStyle ?? preset.cardStyle;
  const layoutId = getPortfolioLayoutStyleId(theme.layoutStyle ?? preset.layoutStyle);

  const primary = theme.primaryColor ?? preset.primaryColor;
  const secondary = theme.secondaryColor ?? preset.secondaryColor;
  const accent = theme.accentColor ?? preset.accentColor;

  const showBackgroundUploader =
    backgroundStyle === "Image" || Boolean(theme.backgroundImageUrl);

  const patchTheme = (patch: Partial<PortfolioTheme>) => {
    onThemeChange({ ...theme, ...patch });
  };

  const patchSlotOverride = <K extends keyof PortfolioThemeSlotOverrides>(
    slot: K,
    value: PortfolioThemeSlotOverrides[K] | undefined,
  ) => {
    const current = parseThemeSettingsJson(theme.settingsJson) ?? {};
    const next = { ...current };
    if (value == null || value === "") {
      delete next[slot];
    } else {
      next[slot] = value;
    }
    patchTheme({ settingsJson: serializeThemeSettingsJson(next) });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2.5">
        <PanelLabel>Preset giao diện</PanelLabel>
        <div className="grid gap-2">
          {Object.values(THEME_PRESETS).map((presetOption) => {
            const selected = templateId === presetOption.id;
            return (
              <button
                key={presetOption.id}
                type="button"
                onClick={() =>
                  onThemeChange(
                    applyPresetToTheme(theme, presetOption.id as PortfolioTemplateId),
                  )
                }
                className={cn(
                  "rounded-2xl border p-3 text-left transition-all duration-200 outline-none",
                  "focus-visible:ring-2 focus-visible:ring-[#4FC3F7] active:scale-[0.99]",
                  selected
                    ? "border-[#4FC3F7] bg-white shadow-[0_8px_20px_rgba(79,195,247,0.18)]"
                    : "border-[#E5E5E0] bg-white/70 hover:border-[#C9C9C2] hover:bg-white",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-[#2D2D2D]">
                    {presetOption.label}
                  </p>
                  {selected ? (
                    <span className="rounded-full bg-[#4FC3F7]/15 px-2 py-0.5 text-[10px] font-semibold text-[#0f7cad]">
                      Đang dùng
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#6B6B6B]">
                  {presetOption.description}
                </p>
                <div className="mt-2.5 flex gap-1.5">
                  {[
                    presetOption.primaryColor,
                    presetOption.secondaryColor,
                    presetOption.accentColor,
                  ].map((color) => (
                    <span
                      key={`${presetOption.id}-${color}`}
                      className="size-4 rounded-full ring-1 ring-[#E5E5E0]"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <PanelLabel>Tùy chỉnh thành phần</PanelLabel>
        <div className="space-y-3 rounded-2xl border border-[#E5E5E0] bg-white/80 p-3">
          <ChipGroup<BackgroundSlotId>
            label="Nền"
            value={slotOverrides.background as BackgroundSlotId | undefined}
            options={BACKGROUND_SLOT_OPTIONS}
            onChange={(next) => patchSlotOverride("background", next)}
            allowClear
          />
          <ChipGroup<HeroTextSlotId>
            label="Tiêu đề hero"
            value={slotOverrides.heroText as HeroTextSlotId | undefined}
            options={HERO_TEXT_SLOT_OPTIONS}
            onChange={(next) => patchSlotOverride("heroText", next)}
            allowClear
          />
          <ChipGroup<CardSlotId>
            label="Thẻ"
            value={slotOverrides.card as CardSlotId | undefined}
            options={CARD_SLOT_OPTIONS}
            onChange={(next) => patchSlotOverride("card", next)}
            allowClear
          />
          <ChipGroup<RevealSlotId>
            label="Hiệu ứng xuất hiện"
            value={slotOverrides.reveal as RevealSlotId | undefined}
            options={REVEAL_SLOT_OPTIONS}
            onChange={(next) => patchSlotOverride("reveal", next)}
            allowClear
          />
        </div>
      </div>

      <div className="space-y-3">
        <PanelLabel>Màu sắc</PanelLabel>
        <div className="space-y-4 rounded-2xl border border-[#E5E5E0] bg-white/80 p-3">
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
          <ColorField
            label="Màu nhấn"
            value={accent}
            onChange={(next) => patchTheme({ accentColor: next })}
          />
        </div>
      </div>

      <div className="space-y-3">
        <PanelLabel>Font chữ</PanelLabel>
        <div className="space-y-3 rounded-2xl border border-[#E5E5E0] bg-white/80 p-3">
          <ChipGroup
            label="Nội dung"
            value={fontFamily}
            options={PORTFOLIO_FONTS.map((font) => ({
              id: font.id,
              label: font.label,
            }))}
            onChange={(next) => {
              if (next) patchTheme({ fontFamily: next });
            }}
          />
          <ChipGroup
            label="Tiêu đề"
            value={headingFontFamily}
            options={PORTFOLIO_FONTS.map((font) => ({
              id: font.id,
              label: font.label,
            }))}
            onChange={(next) => {
              if (next) patchTheme({ headingFontFamily: next });
            }}
          />
        </div>
      </div>

      <div className="space-y-3">
        <PanelLabel>Typography</PanelLabel>
        <div className="space-y-3 rounded-2xl border border-[#E5E5E0] bg-white/80 p-3">
          <ChipGroup
            label="Cỡ chữ"
            value={fontScale}
            options={PORTFOLIO_FONT_SCALES}
            onChange={(next) => {
              if (next) patchTheme({ fontScale: next });
            }}
          />
          <ChipGroup
            label="Giãn dòng"
            value={lineHeight}
            options={PORTFOLIO_LINE_HEIGHTS}
            onChange={(next) => {
              if (next) patchTheme({ lineHeight: next });
            }}
          />
          <ChipGroup
            label="Mật độ"
            value={density}
            options={PORTFOLIO_DENSITIES}
            onChange={(next) => {
              if (next) patchTheme({ density: next });
            }}
          />
        </div>
      </div>

      <div className="space-y-3">
        <PanelLabel>Nền trang</PanelLabel>
        <div className="space-y-3 rounded-2xl border border-[#E5E5E0] bg-white/80 p-3">
          <ChipGroup
            label="Kiểu nền"
            value={backgroundStyle}
            options={PORTFOLIO_BACKGROUND_STYLES}
            onChange={(next) => {
              if (next) patchTheme({ backgroundStyle: next });
            }}
          />
          {showBackgroundUploader ? (
            <div className="space-y-2">
              {theme.backgroundImageUrl ? (
                <div className="flex items-center gap-3 rounded-xl border border-[#E5E5E0] bg-[#FAFAF5] p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={theme.backgroundImageUrl}
                    alt=""
                    className="size-14 rounded-lg object-cover"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 rounded-xl text-xs text-[#E94B3C]"
                    onClick={() => patchTheme({ backgroundImageUrl: null })}
                  >
                    Xóa ảnh nền
                  </Button>
                </div>
              ) : null}
              <MediaUploader
                label="ảnh nền"
                onUploadedUrl={(url) => patchTheme({ backgroundImageUrl: url })}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        <PanelLabel>Bố cục</PanelLabel>
        <div className="space-y-3 rounded-2xl border border-[#E5E5E0] bg-white/80 p-3">
          <ChipGroup
            label="Kiểu thẻ"
            value={cardStyle}
            options={PORTFOLIO_CARD_STYLES}
            onChange={(next) => {
              if (next) patchTheme({ cardStyle: next });
            }}
          />
          <ChipGroup
            label="Kiểu bố cục"
            value={layoutId}
            options={PORTFOLIO_LAYOUT_STYLES.map((layout) => ({
              id: layout.id,
              label: layout.label,
            }))}
            onChange={(next) => {
              if (next) patchTheme({ layoutStyle: next });
            }}
          />
        </div>
      </div>
    </div>
  );
}
