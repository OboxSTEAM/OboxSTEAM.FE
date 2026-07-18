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
  getPortfolioFontCss,
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
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0f7cad]">
      {children}
    </p>
  );
}

/** Selected-box card used across visual pickers (cyan border, no glow). */
function SelectBox({
  selected,
  onClick,
  className,
  children,
  ariaLabel,
}: {
  selected: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-white p-2.5 text-left transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/45",
        selected
          ? "border-[#4FC3F7] bg-[rgba(79,195,247,0.07)]"
          : "border-[#E5E5E0] hover:border-[#C9C9C2] hover:bg-[#FAFAF5]",
        className,
      )}
    >
      {children}
    </button>
  );
}

function LayoutPreview({ id }: { id: string }) {
  if (id === "bento") {
    return (
      <div className="grid h-10 grid-cols-3 gap-0.5">
        <span className="col-span-2 rounded-sm bg-[#4FC3F7]/35" />
        <span className="rounded-sm bg-[#4FC3F7]/20" />
        <span className="rounded-sm bg-[#4FC3F7]/20" />
        <span className="col-span-2 rounded-sm bg-[#4FC3F7]/30" />
      </div>
    );
  }
  if (id === "timeline") {
    return (
      <div className="flex h-10 items-stretch gap-1.5 pl-1">
        <span className="w-0.5 rounded-full bg-[#4FC3F7]/50" />
        <div className="flex flex-1 flex-col justify-center gap-1">
          <span className="h-2 w-full rounded-sm bg-[#4FC3F7]/30" />
          <span className="h-2 w-[80%] rounded-sm bg-[#4FC3F7]/20" />
          <span className="h-2 w-[60%] rounded-sm bg-[#4FC3F7]/15" />
        </div>
      </div>
    );
  }
  if (id === "masonry") {
    return (
      <div className="flex h-10 gap-0.5">
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="h-5 rounded-sm bg-[#4FC3F7]/30" />
          <span className="h-3 rounded-sm bg-[#4FC3F7]/18" />
        </div>
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="h-3 rounded-sm bg-[#4FC3F7]/22" />
          <span className="h-5 rounded-sm bg-[#4FC3F7]/28" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-10 flex-col justify-center gap-1">
      <span className="h-2 w-full rounded-sm bg-[#4FC3F7]/30" />
      <span className="h-2 w-full rounded-sm bg-[#4FC3F7]/22" />
      <span className="h-2 w-[80%] rounded-sm bg-[#4FC3F7]/15" />
    </div>
  );
}

function SlotPreview({
  kind,
  id,
}: {
  kind: "background" | "hero" | "card" | "reveal";
  id: string;
}) {
  if (kind === "background") {
    const styles: Record<string, string> = {
      Aurora: "bg-gradient-to-br from-[#4FC3F7]/50 via-[#7E57C2]/30 to-[#E94B3C]/25",
      Waves: "bg-[repeating-linear-gradient(90deg,#4FC3F733_0_2px,transparent_2px_8px)] bg-[#FAFAF5]",
      DotGrid: "bg-[radial-gradient(#2D2D2D_1px,transparent_1px)] bg-[size:6px_6px] bg-[#F5F5F0]",
      GradientSoft: "bg-gradient-to-br from-[#E94B3C]/25 to-[#4FC3F7]/30",
      None: "bg-[#F5F5F0]",
    };
    return <div className={cn("h-8 w-full rounded-md", styles[id] ?? styles.None)} />;
  }
  if (kind === "hero") {
    return (
      <div className="flex h-8 items-center justify-center rounded-md bg-[#F5F5F0] px-2">
        <span
          className={cn(
            "text-xs font-bold text-[#2D2D2D]",
            id === "Decrypted" && "font-mono tracking-wider",
            id === "SplitGradient" &&
              "bg-gradient-to-r from-[#E94B3C] to-[#4FC3F7] bg-clip-text text-transparent",
            id === "BlurShiny" && "italic text-[#4A4A4A]",
            id === "TrueFocus" && "tracking-tight",
          )}
        >
          Aa
        </span>
      </div>
    );
  }
  if (kind === "card") {
    return (
      <div
        className={cn(
          "h-8 w-full rounded-md border bg-white",
          id === "Spotlight" && "border-[#4FC3F7]/40 shadow-sm",
          id === "Tilted" && "rotate-1 border-[#E5E5E0]",
          id === "Bounce" && "border-[#7CB342]/40",
          id === "StarBorder" && "border-[#4FC3F7]",
          id === "Soft" && "border-0 bg-[#F0F0EA]",
        )}
      />
    );
  }
  return (
    <div className="flex h-8 items-end gap-0.5 rounded-md bg-[#F5F5F0] px-2 pb-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "w-2 rounded-sm bg-[#4FC3F7]/40",
            id === "None" ? "h-2 opacity-40" : "animate-pulse",
          )}
          style={{ height: `${10 + i * 4}px`, animationDelay: `${i * 120}ms` }}
        />
      ))}
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
      <p className="text-xs font-semibold text-[#2D2D2D]">{label}</p>
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
                ? "border-[#4FC3F7]"
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

  const bgSlot = (slotOverrides.background as BackgroundSlotId | undefined) ?? preset.background;
  const heroSlot = (slotOverrides.heroText as HeroTextSlotId | undefined) ?? preset.heroText;
  const cardSlot = (slotOverrides.card as CardSlotId | undefined) ?? preset.card;
  const revealSlot = (slotOverrides.reveal as RevealSlotId | undefined) ?? preset.reveal;

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
              <SelectBox
                key={presetOption.id}
                selected={selected}
                onClick={() =>
                  onThemeChange(
                    applyPresetToTheme(theme, presetOption.id as PortfolioTemplateId),
                  )
                }
                className="p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold tracking-tight text-[#2D2D2D]">
                    {presetOption.label}
                  </p>
                  {selected ? (
                    <span className="text-[10px] font-semibold text-[#0f7cad]">
                      Đang dùng
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#5C5C5C]">
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
                      className="size-4 rounded-full border border-[#E5E5E0]"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </SelectBox>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <PanelLabel>Thành phần</PanelLabel>
        <div className="space-y-4 rounded-xl border border-[#E5E5E0] bg-white p-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#2D2D2D]">Nền hiệu ứng</p>
            <div className="grid grid-cols-2 gap-2">
              {BACKGROUND_SLOT_OPTIONS.map((option) => (
                <SelectBox
                  key={option.id}
                  selected={bgSlot === option.id}
                  onClick={() =>
                    patchSlotOverride(
                      "background",
                      option.id === preset.background ? undefined : option.id,
                    )
                  }
                >
                  <SlotPreview kind="background" id={option.id} />
                  <p className="mt-1.5 text-[11px] font-semibold text-[#2D2D2D]">
                    {option.label}
                  </p>
                </SelectBox>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#2D2D2D]">Tiêu đề hero</p>
            <div className="grid grid-cols-2 gap-2">
              {HERO_TEXT_SLOT_OPTIONS.map((option) => (
                <SelectBox
                  key={option.id}
                  selected={heroSlot === option.id}
                  onClick={() =>
                    patchSlotOverride(
                      "heroText",
                      option.id === preset.heroText ? undefined : option.id,
                    )
                  }
                >
                  <SlotPreview kind="hero" id={option.id} />
                  <p className="mt-1.5 text-[11px] font-semibold text-[#2D2D2D]">
                    {option.label}
                  </p>
                </SelectBox>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#2D2D2D]">Kiểu thẻ hiệu ứng</p>
            <div className="grid grid-cols-2 gap-2">
              {CARD_SLOT_OPTIONS.map((option) => (
                <SelectBox
                  key={option.id}
                  selected={cardSlot === option.id}
                  onClick={() =>
                    patchSlotOverride(
                      "card",
                      option.id === preset.card ? undefined : option.id,
                    )
                  }
                >
                  <SlotPreview kind="card" id={option.id} />
                  <p className="mt-1.5 text-[11px] font-semibold text-[#2D2D2D]">
                    {option.label}
                  </p>
                </SelectBox>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#2D2D2D]">Xuất hiện</p>
            <div className="grid grid-cols-3 gap-2">
              {REVEAL_SLOT_OPTIONS.map((option) => (
                <SelectBox
                  key={option.id}
                  selected={revealSlot === option.id}
                  onClick={() =>
                    patchSlotOverride(
                      "reveal",
                      option.id === preset.reveal ? undefined : option.id,
                    )
                  }
                >
                  <SlotPreview kind="reveal" id={option.id} />
                  <p className="mt-1.5 text-[11px] font-semibold text-[#2D2D2D]">
                    {option.label}
                  </p>
                </SelectBox>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <PanelLabel>Màu sắc</PanelLabel>
        <div className="space-y-4 rounded-xl border border-[#E5E5E0] bg-white p-3">
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
        <div className="space-y-3 rounded-xl border border-[#E5E5E0] bg-white p-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#2D2D2D]">Nội dung</p>
            <div className="grid grid-cols-2 gap-2">
              {PORTFOLIO_FONTS.map((font) => (
                <SelectBox
                  key={`body-${font.id}`}
                  selected={fontFamily === font.id}
                  onClick={() => patchTheme({ fontFamily: font.id })}
                >
                  <p
                    className="text-2xl font-semibold leading-none text-[#2D2D2D]"
                    style={{ fontFamily: getPortfolioFontCss(font.id) }}
                  >
                    Aa
                  </p>
                  <p className="mt-1.5 text-[11px] font-medium text-[#5C5C5C]">
                    {font.label}
                  </p>
                </SelectBox>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#2D2D2D]">Tiêu đề</p>
            <div className="grid grid-cols-2 gap-2">
              {PORTFOLIO_FONTS.map((font) => (
                <SelectBox
                  key={`heading-${font.id}`}
                  selected={headingFontFamily === font.id}
                  onClick={() => patchTheme({ headingFontFamily: font.id })}
                >
                  <p
                    className="text-2xl font-bold leading-none text-[#2D2D2D]"
                    style={{ fontFamily: getPortfolioFontCss(font.id) }}
                  >
                    Aa
                  </p>
                  <p className="mt-1.5 text-[11px] font-medium text-[#5C5C5C]">
                    {font.label}
                  </p>
                </SelectBox>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <PanelLabel>Typography</PanelLabel>
        <div className="space-y-3 rounded-xl border border-[#E5E5E0] bg-white p-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#2D2D2D]">Cỡ chữ</p>
            <div className="grid grid-cols-4 gap-1.5">
              {PORTFOLIO_FONT_SCALES.map((scale) => (
                <SelectBox
                  key={scale.id}
                  selected={fontScale === scale.id}
                  onClick={() => patchTheme({ fontScale: scale.id })}
                  className="flex flex-col items-center py-2"
                >
                  <span
                    className="font-bold text-[#2D2D2D]"
                    style={{
                      fontSize:
                        scale.id === "Sm"
                          ? 12
                          : scale.id === "Base"
                            ? 14
                            : scale.id === "Lg"
                              ? 17
                              : 20,
                    }}
                  >
                    Aa
                  </span>
                  <span className="mt-1 text-[10px] font-medium text-[#5C5C5C]">
                    {scale.label}
                  </span>
                </SelectBox>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#2D2D2D]">Giãn dòng</p>
            <div className="grid grid-cols-3 gap-1.5">
              {PORTFOLIO_LINE_HEIGHTS.map((option) => (
                <SelectBox
                  key={option.id}
                  selected={lineHeight === option.id}
                  onClick={() => patchTheme({ lineHeight: option.id })}
                  className="text-center"
                >
                  <p
                    className={cn(
                      "text-[11px] font-medium text-[#2D2D2D]",
                      option.id === "Tight" && "leading-none",
                      option.id === "Normal" && "leading-snug",
                      option.id === "Relaxed" && "leading-loose",
                    )}
                  >
                    Dòng
                    <br />
                    chữ
                  </p>
                  <p className="mt-1 text-[10px] text-[#5C5C5C]">{option.label}</p>
                </SelectBox>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#2D2D2D]">Mật độ khoảng cách</p>
            <div className="grid grid-cols-3 gap-1.5">
              {PORTFOLIO_DENSITIES.map((option) => (
                <SelectBox
                  key={option.id}
                  selected={density === option.id}
                  onClick={() => patchTheme({ density: option.id })}
                  className="text-center"
                >
                  <div
                    className={cn(
                      "mx-auto flex w-8 flex-col",
                      option.id === "Compact" && "gap-0.5",
                      option.id === "Cozy" && "gap-1.5",
                      option.id === "Spacious" && "gap-2.5",
                    )}
                  >
                    <span className="h-1.5 rounded-sm bg-[#4FC3F7]/45" />
                    <span className="h-1.5 rounded-sm bg-[#4FC3F7]/35" />
                    <span className="h-1.5 rounded-sm bg-[#4FC3F7]/25" />
                  </div>
                  <p className="mt-1.5 text-[10px] font-medium text-[#5C5C5C]">
                    {option.label}
                  </p>
                </SelectBox>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <PanelLabel>Nền trang</PanelLabel>
        <div className="space-y-3 rounded-xl border border-[#E5E5E0] bg-white p-3">
          <div className="grid grid-cols-2 gap-2">
            {PORTFOLIO_BACKGROUND_STYLES.map((option) => (
              <SelectBox
                key={option.id}
                selected={backgroundStyle === option.id}
                onClick={() => patchTheme({ backgroundStyle: option.id })}
              >
                <div
                  className={cn(
                    "h-8 w-full rounded-md",
                    option.id === "Plain" && "bg-[#F5F5F0]",
                    option.id === "Gradient" &&
                      "bg-gradient-to-br from-[#4FC3F7]/40 to-[#E94B3C]/25",
                    option.id === "Pattern" &&
                      "bg-[radial-gradient(#4FC3F7_1px,transparent_1px)] bg-[size:8px_8px] bg-[#FAFAF5]",
                    option.id === "Image" &&
                      "bg-[linear-gradient(45deg,#E5E5E0_25%,transparent_25%),linear-gradient(-45deg,#E5E5E0_25%,transparent_25%)] bg-[size:10px_10px] bg-[#F5F5F0]",
                  )}
                />
                <p className="mt-1.5 text-[11px] font-semibold text-[#2D2D2D]">
                  {option.label}
                </p>
              </SelectBox>
            ))}
          </div>
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
        <div className="space-y-3 rounded-xl border border-[#E5E5E0] bg-white p-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#2D2D2D]">Bề mặt thẻ</p>
            <div className="grid grid-cols-3 gap-1.5">
              {PORTFOLIO_CARD_STYLES.map((option) => (
                <SelectBox
                  key={option.id}
                  selected={cardStyle === option.id}
                  onClick={() => patchTheme({ cardStyle: option.id })}
                >
                  <div
                    className={cn(
                      "h-8 w-full rounded-md bg-white",
                      option.id === "Outline" && "border-2 border-[#D8D8D0]",
                      option.id === "Soft" && "border-0 bg-[#F0F0EA]",
                      option.id === "Elevated" &&
                        "border border-[#E5E5E0] shadow-[0_6px_14px_rgba(45,45,45,0.14)]",
                    )}
                  />
                  <p className="mt-1.5 text-center text-[10px] font-semibold text-[#2D2D2D]">
                    {option.label}
                  </p>
                </SelectBox>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#2D2D2D]">Kiểu bố cục mục</p>
            <div className="grid grid-cols-2 gap-2">
              {PORTFOLIO_LAYOUT_STYLES.map((layout) => (
                <SelectBox
                  key={layout.id}
                  selected={layoutId === layout.id}
                  onClick={() => patchTheme({ layoutStyle: layout.id })}
                >
                  <LayoutPreview id={layout.id} />
                  <p className="mt-1.5 text-[11px] font-semibold text-[#2D2D2D]">
                    {layout.label}
                  </p>
                  <p className="text-[10px] leading-snug text-[#5C5C5C]">
                    {layout.description}
                  </p>
                </SelectBox>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
