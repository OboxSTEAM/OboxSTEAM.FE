"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { MediaUploader } from "@/components/portfolio/editor/media-uploader";
import { PortfolioColorPicker } from "@/components/portfolio/editor/portfolio-color-picker";
import type {
  PortfolioTheme,
  PortfolioThemeSlotOverrides,
} from "@/lib/api/entities/portfolio";
import {
  parseThemeSettingsJson,
  serializeThemeSettingsJson,
} from "@/lib/api/entities/portfolio";
import { deriveCompanionColors } from "@/lib/portfolio/color-utils";
import {
  getPortfolioFontCss,
  getPortfolioLayoutStyleId,
  getPortfolioTemplateId,
  PORTFOLIO_BACKGROUND_STYLES,
  PORTFOLIO_CARD_STYLES,
  PORTFOLIO_DENSITIES,
  PORTFOLIO_FONTS,
  PORTFOLIO_LAYOUT_STYLES,
  type PortfolioTemplateId,
} from "@/lib/portfolio/constants";
import {
  applyPresetToTheme,
  BACKGROUND_SLOT_OPTIONS,
  CARD_SLOT_OPTIONS,
  FONT_SCALE_STEPS,
  fontScaleEnumFromStep,
  HERO_TEXT_SLOT_OPTIONS,
  LINE_HEIGHT_STEPS,
  lineHeightEnumFromStep,
  REVEAL_SLOT_OPTIONS,
  resolvePortfolioTheme,
  THEME_PRESETS,
  type BackgroundSlotId,
  type CardSlotId,
  type HeroTextSlotId,
  type RevealSlotId,
} from "@/lib/portfolio/theme-presets";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

type DesignPanelProps = {
  theme: PortfolioTheme;
  onThemeChange: (theme: PortfolioTheme) => void;
};

type BackgroundStage = "page" | "effect";

function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5C5C5C]">
      {children}
    </p>
  );
}

/** Selected-box card used across visual pickers. */
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
        "rounded-2xl border bg-white p-3 text-left shadow-[0_1px_0_rgba(45,45,45,0.04)] transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50",
        selected
          ? "border-[#4FC3F7] bg-[rgba(79,195,247,0.08)]"
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
        <span className="col-span-2 rounded-sm bg-[#7CB342]/35" />
        <span className="rounded-sm bg-[#7CB342]/20" />
        <span className="rounded-sm bg-[#7CB342]/20" />
        <span className="col-span-2 rounded-sm bg-[#7CB342]/30" />
      </div>
    );
  }
  if (id === "timeline") {
    return (
      <div className="flex h-10 items-stretch gap-1.5 pl-1">
        <span className="w-0.5 rounded-full bg-[#7CB342]/50" />
        <div className="flex flex-1 flex-col justify-center gap-1">
          <span className="h-2 w-full rounded-sm bg-[#7CB342]/30" />
          <span className="h-2 w-[80%] rounded-sm bg-[#7CB342]/20" />
          <span className="h-2 w-[60%] rounded-sm bg-[#7CB342]/15" />
        </div>
      </div>
    );
  }
  if (id === "masonry") {
    return (
      <div className="flex h-10 gap-0.5">
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="h-5 rounded-sm bg-[#7CB342]/30" />
          <span className="h-3 rounded-sm bg-[#7CB342]/18" />
        </div>
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="h-3 rounded-sm bg-[#7CB342]/22" />
          <span className="h-5 rounded-sm bg-[#7CB342]/28" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-10 flex-col justify-center gap-1">
      <span className="h-2 w-full rounded-sm bg-[#7CB342]/30" />
      <span className="h-2 w-full rounded-sm bg-[#7CB342]/22" />
      <span className="h-2 w-[80%] rounded-sm bg-[#7CB342]/15" />
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
      Waves:
        "bg-[repeating-linear-gradient(90deg,#4FC3F733_0_2px,transparent_2px_8px)] bg-[#FAFAF5]",
      DotGrid:
        "bg-[radial-gradient(#2D2D2D_1px,transparent_1px)] bg-[size:6px_6px] bg-[#F5F5F0]",
      GradientSoft: "bg-gradient-to-br from-[#E94B3C]/25 to-[#4FC3F7]/30",
      None: "bg-[#F5F5F0]",
    };
    return <div className={cn("h-8 w-full rounded-full", styles[id] ?? styles.None)} />;
  }
  if (kind === "hero") {
    return (
      <div className="flex h-8 items-center justify-center rounded-full bg-[#F5F5F0] px-2">
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
          "flex h-10 w-full items-center justify-center rounded-2xl",
          id === "Soft" ? "bg-[#F0F0EA]" : "bg-white",
        )}
      >
        <div
          className={cn(
            "h-6 w-[85%] rounded-md bg-white",
            id === "Spotlight" && "shadow-[0_0_0_2px_#7CB342]",
            id === "Tilted" && "rotate-6 shadow-[4px_4px_0_0_#7CB34233]",
            id === "Bounce" && "shadow-[0_6px_0_0_#7CB34266]",
            id === "StarBorder" && "border-2 border-dashed border-[#7CB342]",
            id === "Soft" && "border-0 bg-[#E8E8E0]",
          )}
        />
      </div>
    );
  }
  return (
    <div className="flex h-8 items-end gap-0.5 rounded-full bg-[#F5F5F0] px-2 pb-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "w-2 rounded-sm bg-[#7CB342]/40",
            id === "None" ? "h-2 opacity-40" : "animate-pulse",
          )}
          style={{ height: `${10 + i * 4}px`, animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

function ThemeSlider({
  label,
  value,
  steps,
  onChange,
  leftHint,
  centerHint,
  rightHint,
  accent = "#4FC3F7",
}: {
  label: string;
  value: number;
  steps: number;
  onChange: (next: number) => void;
  leftHint: string;
  centerHint?: string;
  rightHint: string;
  accent?: string;
}) {
  const max = Math.max(1, steps - 1);
  const clamped = Math.max(0, Math.min(max, value));
  const fillPct = (clamped / max) * 100;

  return (
    <div className="space-y-3">
      <PanelLabel>{label}</PanelLabel>
      <div className="relative px-1 pt-1 pb-0.5">
        <div className="relative h-2 w-full rounded-full bg-[#E8E8E0]">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${fillPct}%`, backgroundColor: accent }}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-0.5">
            {Array.from({ length: steps }, (_, index) => (
              <span
                key={index}
                className={cn(
                  "size-1.5 rounded-full",
                  index <= clamped ? "bg-white/90" : "bg-[#C9C9C2]",
                )}
              />
            ))}
          </div>
          <span
            className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-sm"
            style={{
              left: `${fillPct}%`,
              backgroundColor: accent,
              boxShadow: `0 0 0 1px ${accent}`,
            }}
          />
        </div>
        <Slider
          min={0}
          max={max}
          step={1}
          value={[clamped]}
          onValueChange={(next) => {
            const index = Array.isArray(next) ? next[0] : next;
            if (typeof index === "number") onChange(index);
          }}
          className={cn(
            "absolute inset-x-1 top-1 h-2 opacity-0",
            "**:data-[slot=slider-track]:h-2 **:data-[slot=slider-track]:bg-transparent",
            "**:data-[slot=slider-range]:bg-transparent",
            "**:data-[slot=slider-thumb]:size-5 **:data-[slot=slider-thumb]:opacity-0",
          )}
          aria-label={label}
        />
      </div>
      <div className="flex items-center justify-between text-xs font-semibold text-[#6B6B6B]">
        <span>{leftHint}</span>
        {centerHint ? <span>{centerHint}</span> : <span />}
        <span>{rightHint}</span>
      </div>
    </div>
  );
}

function PresetIdentityPreview({
  preset,
}: {
  preset: (typeof THEME_PRESETS)[PortfolioTemplateId];
}) {
  const heroHint =
    preset.heroText === "SplitGradient"
      ? "bg-gradient-to-r from-[var(--p)] to-[var(--a)] bg-clip-text text-transparent font-extrabold"
      : preset.heroText === "Decrypted"
        ? "font-mono tracking-wider"
        : preset.heroText === "BlurShiny"
          ? "italic"
          : preset.heroText === "TrueFocus"
            ? "tracking-tighter underline decoration-2"
            : "font-semibold";

  const bgClass =
    preset.background === "Aurora"
      ? "from-[#4FC3F7]/40 via-[#7E57C2]/25 to-[#E94B3C]/20"
      : preset.background === "Waves"
        ? "from-[#7E57C2]/20 to-[#FDD835]/25"
        : preset.background === "DotGrid"
          ? "from-[#1a1a1a] to-[#2a2a2a]"
          : preset.background === "GradientSoft"
            ? "from-[#2D2D2D]/10 to-[#E94B3C]/15"
            : "from-[#F5F5F0] to-[#FAFAF5]";

  return (
    <div
      className={cn(
        "relative mt-2.5 overflow-hidden rounded-xl border border-[#E5E5E0] p-2",
        preset.isDark ? "bg-[#121212] text-[#FAFAF5]" : "bg-white text-[#2D2D2D]",
      )}
      style={
        {
          ["--p" as string]: preset.primaryColor,
          ["--s" as string]: preset.secondaryColor,
          ["--a" as string]: preset.accentColor,
        } as CSSProperties
      }
    >
      <div
        className={cn(
          "mb-1.5 h-5 w-full rounded-md bg-gradient-to-br",
          bgClass,
        )}
      />
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-xs font-semibold leading-tight", heroHint)}>
            Aa Name
          </p>
          <p
            className="mt-0.5 truncate text-xs opacity-70"
            style={{
              fontFamily:
                preset.headingFontFamily === "georgia"
                  ? "Georgia, serif"
                  : preset.headingFontFamily === "mono"
                    ? "ui-monospace, monospace"
                    : undefined,
            }}
          >
            Headline
          </p>
        </div>
        <div
          className={cn(
            "size-7 shrink-0",
            preset.card === "Tilted" && "rotate-6 rounded-md",
            preset.card === "Bounce" && "rounded-xl shadow-[0_3px_0_0_var(--a)]",
            preset.card === "StarBorder" &&
              "rounded-md border border-dashed border-[var(--p)]",
            preset.card === "Spotlight" && "rounded-lg ring-2 ring-[var(--p)]",
            preset.card === "Soft" && "rounded-2xl",
            preset.isDark ? "bg-[#2a2a2a]" : "bg-[#F0F0EA]",
          )}
          style={{ backgroundColor: `${preset.primaryColor}33` }}
        />
      </div>
    </div>
  );
}

export function DesignPanel({ theme, onThemeChange }: DesignPanelProps) {
  const templateId = getPortfolioTemplateId(theme.templateId);
  const preset = THEME_PRESETS[templateId];
  const resolved = resolvePortfolioTheme(theme);
  const slotOverrides = parseThemeSettingsJson(theme.settingsJson) ?? {};

  const fontFamily = theme.fontFamily ?? preset.fontFamily;
  const headingFontFamily = theme.headingFontFamily ?? preset.headingFontFamily;
  const density = theme.density ?? preset.density;
  const backgroundStyle = theme.backgroundStyle ?? preset.backgroundStyle;
  const cardStyle = theme.cardStyle ?? preset.cardStyle;
  const layoutId = getPortfolioLayoutStyleId(
    theme.layoutStyle ?? preset.layoutStyle,
  );

  const primary = theme.primaryColor ?? preset.primaryColor;
  const backgroundStage: BackgroundStage = resolved.backgroundMode;

  const bgSlot =
    (slotOverrides.background as BackgroundSlotId | undefined) ?? preset.background;
  const heroSlot =
    (slotOverrides.heroText as HeroTextSlotId | undefined) ?? preset.heroText;
  const cardSlot =
    (slotOverrides.card as CardSlotId | undefined) ?? preset.card;
  const revealSlot =
    (slotOverrides.reveal as RevealSlotId | undefined) ?? preset.reveal;

  const showBackgroundUploader =
    backgroundStage === "page" &&
    (backgroundStyle === "Image" || Boolean(theme.backgroundImageUrl));

  const patchTheme = (patch: Partial<PortfolioTheme>) => {
    onThemeChange({ ...theme, ...patch });
  };

  const patchSettings = (patch: Partial<PortfolioThemeSlotOverrides>) => {
    const current = parseThemeSettingsJson(theme.settingsJson) ?? {};
    const next: PortfolioThemeSlotOverrides = { ...current, ...patch };
    for (const key of Object.keys(patch) as Array<keyof PortfolioThemeSlotOverrides>) {
      const value = patch[key];
      if (value == null || value === "") {
        delete next[key];
      }
    }
    patchTheme({ settingsJson: serializeThemeSettingsJson(next) });
  };

  const patchSlotOverride = <K extends keyof PortfolioThemeSlotOverrides>(
    slot: K,
    value: PortfolioThemeSlotOverrides[K] | undefined,
  ) => {
    patchSettings({ [slot]: value } as Partial<PortfolioThemeSlotOverrides>);
  };

  const setPrimaryColor = (next: string) => {
    const companions = deriveCompanionColors(next);
    patchTheme({
      primaryColor: next,
      secondaryColor: companions.secondary,
      accentColor: companions.accent,
    });
  };

  const setBackgroundStage = (stage: BackgroundStage) => {
    const current = parseThemeSettingsJson(theme.settingsJson) ?? {};
    if (stage === "page") {
      patchTheme({
        backgroundStyle: backgroundStyle === "Plain" ? "Plain" : backgroundStyle,
        settingsJson: serializeThemeSettingsJson({
          ...current,
          backgroundMode: "page",
          background: "None",
        }),
      });
      return;
    }
    patchTheme({
      backgroundStyle: "Plain",
      settingsJson: serializeThemeSettingsJson({
        ...current,
        backgroundMode: "effect",
        background:
          bgSlot === "None" ? "Aurora" : (current.background ?? bgSlot),
      }),
    });
  };

  const setBackgroundStyle = (
    next: (typeof PORTFOLIO_BACKGROUND_STYLES)[number]["id"],
  ) => {
    const current = parseThemeSettingsJson(theme.settingsJson) ?? {};
    patchTheme({
      backgroundStyle: next,
      settingsJson: serializeThemeSettingsJson({
        ...current,
        backgroundMode: "page",
        background: "None",
      }),
    });
  };

  const setEffectBackground = (id: BackgroundSlotId) => {
    const current = parseThemeSettingsJson(theme.settingsJson) ?? {};
    patchTheme({
      backgroundStyle: "Plain",
      settingsJson: serializeThemeSettingsJson({
        ...current,
        backgroundMode: "effect",
        background: id,
      }),
    });
  };

  const setFontScaleStep = (step: number) => {
    const current = parseThemeSettingsJson(theme.settingsJson) ?? {};
    patchTheme({
      fontScale: fontScaleEnumFromStep(step),
      settingsJson: serializeThemeSettingsJson({
        ...current,
        fontScaleStep: step,
      }),
    });
  };

  const setLineHeightStep = (step: number) => {
    const current = parseThemeSettingsJson(theme.settingsJson) ?? {};
    patchTheme({
      lineHeight: lineHeightEnumFromStep(step),
      settingsJson: serializeThemeSettingsJson({
        ...current,
        lineHeightStep: step,
      }),
    });
  };

  return (
    <div className="space-y-7">
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
                    applyPresetToTheme(
                      theme,
                      presetOption.id as PortfolioTemplateId,
                    ),
                  )
                }
                className="p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[15px] font-semibold tracking-tight text-[#2D2D2D]">
                    {presetOption.label}
                  </p>
                  {selected ? (
                    <span className="rounded-lg bg-[#4FC3F7]/18 px-2.5 py-1 text-xs font-semibold text-[#0f7cad]">
                      Đang dùng
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-[#5C5C5C]">
                  {presetOption.description}
                </p>
                <PresetIdentityPreview preset={presetOption} />
                <div className="mt-2.5 flex items-center gap-1.5">
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
                  {presetOption.isDark ? (
                    <span className="ml-auto rounded-lg bg-[#2D2D2D]/8 px-2.5 py-1 text-xs font-semibold text-[#2D2D2D]">
                      Dark
                    </span>
                  ) : null}
                </div>
              </SelectBox>
            );
          })}
        </div>
      </div>

      <div className="space-y-5 rounded-2xl border border-[#E5E5E0] bg-white p-4 shadow-[0_1px_0_rgba(45,45,45,0.04)]">
        <ThemeSlider
          label="Cỡ chữ"
          value={resolved.fontScaleStep}
          steps={FONT_SCALE_STEPS.length}
          onChange={setFontScaleStep}
          leftHint="Nhỏ"
          centerHint="Trung bình"
          rightHint="Siêu lớn"
          accent="#4FC3F7"
        />
        <ThemeSlider
          label="Khoảng cách dòng"
          value={resolved.lineHeightStep}
          steps={LINE_HEIGHT_STEPS.length}
          onChange={setLineHeightStep}
          leftHint="1.0"
          rightHint="2.0"
          accent="#4FC3F7"
        />
        <PortfolioColorPicker value={primary} onChange={setPrimaryColor} />
      </div>

      <div className="space-y-3">
        <PanelLabel>Nền</PanelLabel>
        <div className="space-y-3 rounded-2xl border border-[#E5E5E0] bg-white p-3.5 shadow-[0_1px_0_rgba(45,45,45,0.04)]">
          <div
            className="grid grid-cols-2 gap-1 rounded-xl bg-[#F5F5F0] p-1"
            role="tablist"
            aria-label="Chọn nguồn nền"
          >
            {(
              [
                { id: "page" as const, label: "Nền trang" },
                { id: "effect" as const, label: "Nền hiệu ứng" },
              ] as const
            ).map((stage) => {
              const active = backgroundStage === stage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setBackgroundStage(stage.id)}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors outline-none",
                    "focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50",
                    active
                      ? "bg-white text-[#0f7cad] shadow-sm"
                      : "text-[#6B6B6B] hover:text-[#2D2D2D]",
                  )}
                >
                  {stage.label}
                </button>
              );
            })}
          </div>

          <div
            className={cn(
              "space-y-2 transition-opacity",
              backgroundStage !== "page" && "pointer-events-none opacity-40",
            )}
            aria-disabled={backgroundStage !== "page"}
          >
            <p className="text-sm font-semibold text-[#2D2D2D]">Nền trang</p>
            <div className="grid grid-cols-2 gap-2.5">
              {PORTFOLIO_BACKGROUND_STYLES.map((option) => (
                <SelectBox
                  key={option.id}
                  selected={
                    backgroundStage === "page" && backgroundStyle === option.id
                  }
                  onClick={() => setBackgroundStyle(option.id)}
                  className="rounded-2xl p-3"
                >
                  <div
                    className={cn(
                      "h-9 w-full rounded-full",
                      option.id === "Image" &&
                        "bg-[linear-gradient(45deg,#E5E5E0_25%,transparent_25%),linear-gradient(-45deg,#E5E5E0_25%,transparent_25%)] bg-[size:12px_12px] bg-[#F5F5F0]",
                    )}
                    style={
                      option.id === "Plain"
                        ? { backgroundColor: `${primary}28` }
                        : option.id === "Gradient"
                          ? {
                              background: `linear-gradient(90deg, ${primary}99, ${deriveCompanionColors(primary).secondary}aa)`,
                            }
                          : option.id === "Pattern"
                            ? {
                                backgroundColor: "#FAFAF5",
                                backgroundImage: `radial-gradient(${primary} 1.4px, transparent 1.4px)`,
                                backgroundSize: "10px 10px",
                              }
                            : undefined
                    }
                  />
                  <p className="mt-2 text-center text-xs font-semibold text-[#2D2D2D]">
                    {option.label}
                  </p>
                </SelectBox>
              ))}
            </div>
            {showBackgroundUploader ? (
              <div className="space-y-2 pt-1">
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
                  onUploadedUrl={(url) =>
                    patchTheme({ backgroundImageUrl: url })
                  }
                />
              </div>
            ) : null}
          </div>

          <div
            className={cn(
              "space-y-2 border-t border-[#E5E5E0] pt-3 transition-opacity",
              backgroundStage !== "effect" && "pointer-events-none opacity-40",
            )}
            aria-disabled={backgroundStage !== "effect"}
          >
            <p className="text-sm font-semibold text-[#2D2D2D]">Nền hiệu ứng</p>
            <div className="grid grid-cols-2 gap-2">
              {BACKGROUND_SLOT_OPTIONS.map((option) => (
                <SelectBox
                  key={option.id}
                  selected={
                    backgroundStage === "effect" && bgSlot === option.id
                  }
                  onClick={() => setEffectBackground(option.id)}
                >
                  <SlotPreview kind="background" id={option.id} />
                  <p className="mt-1.5 text-xs font-semibold text-[#2D2D2D]">
                    {option.label}
                  </p>
                </SelectBox>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <PanelLabel>Mật độ khoảng cách</PanelLabel>
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-[#E5E5E0] bg-white p-3.5 shadow-[0_1px_0_rgba(45,45,45,0.04)]">
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
              <p className="mt-1.5 text-xs font-semibold text-[#5C5C5C]">
                {option.label}
              </p>
            </SelectBox>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <PanelLabel>Thành phần</PanelLabel>
        <div className="space-y-4 rounded-2xl border border-[#E5E5E0] bg-white p-3.5 shadow-[0_1px_0_rgba(45,45,45,0.04)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[#2D2D2D]">Tiêu đề hero</p>
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
                  <p className="mt-1.5 text-xs font-semibold text-[#2D2D2D]">
                    {option.label}
                  </p>
                </SelectBox>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-[#2D2D2D]">Kiểu thẻ hiệu ứng</p>
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
                  <p className="mt-1.5 text-xs font-semibold text-[#2D2D2D]">
                    {option.label}
                  </p>
                </SelectBox>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-[#2D2D2D]">Xuất hiện</p>
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
                  <p className="mt-1.5 text-xs font-semibold text-[#2D2D2D]">
                    {option.label}
                  </p>
                </SelectBox>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <PanelLabel>Font chữ</PanelLabel>
        <div className="space-y-3 rounded-2xl border border-[#E5E5E0] bg-white p-3.5 shadow-[0_1px_0_rgba(45,45,45,0.04)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[#2D2D2D]">Nội dung</p>
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
                  <p className="mt-1.5 text-xs font-semibold text-[#5C5C5C]">
                    {font.label}
                  </p>
                </SelectBox>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[#2D2D2D]">Tiêu đề</p>
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
                  <p className="mt-1.5 text-xs font-semibold text-[#5C5C5C]">
                    {font.label}
                  </p>
                </SelectBox>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <PanelLabel>Bố cục</PanelLabel>
        <div className="space-y-3 rounded-2xl border border-[#E5E5E0] bg-white p-3.5 shadow-[0_1px_0_rgba(45,45,45,0.04)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[#2D2D2D]">Bề mặt thẻ</p>
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
                  <p className="mt-1.5 text-center text-xs font-semibold text-[#2D2D2D]">
                    {option.label}
                  </p>
                </SelectBox>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[#2D2D2D]">Kiểu bố cục mục</p>
            <div className="grid grid-cols-2 gap-2">
              {PORTFOLIO_LAYOUT_STYLES.map((layout) => (
                <SelectBox
                  key={layout.id}
                  selected={layoutId === layout.id}
                  onClick={() => patchTheme({ layoutStyle: layout.id })}
                >
                  <LayoutPreview id={layout.id} />
                  <p className="mt-1.5 text-xs font-semibold text-[#2D2D2D]">
                    {layout.label}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-[#5C5C5C]">
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
