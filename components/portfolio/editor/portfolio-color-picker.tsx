"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { Input } from "@/components/ui/input";
import { PORTFOLIO_COLOR_SWATCHES } from "@/lib/portfolio/constants";
import {
  hexToHsv,
  hsvToHex,
  normalizeHexColor,
  type HsvColor,
} from "@/lib/portfolio/color-utils";
import { cn } from "@/lib/utils";

type PortfolioColorPickerProps = {
  value: string;
  onChange: (next: string) => void;
  /** Show label + preset swatches (design panel). */
  showPresets?: boolean;
  label?: string;
  className?: string;
  /** Compact board height for TipTap popover. */
  compact?: boolean;
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function sameHex(a: string, b: string): boolean {
  return a.replace(/^#/, "").toLowerCase() === b.replace(/^#/, "").toLowerCase();
}

/**
 * Custom HSV color board — vertical hue bar + SV field.
 * Pointer drag only; never opens the native OS color dialog.
 */
export function PortfolioColorPicker({
  value,
  onChange,
  showPresets = true,
  label = "Màu chủ đề",
  className,
  compact = false,
}: PortfolioColorPickerProps) {
  const normalized = normalizeHexColor(value);
  const [hsv, setHsv] = useState<HsvColor>(() => hexToHsv(normalized));
  const [hexDraft, setHexDraft] = useState(
    () => normalized.replace(/^#/, "").toUpperCase(),
  );

  const hueElRef = useRef<HTMLDivElement>(null);
  const boardElRef = useRef<HTMLDivElement>(null);
  const hsvRef = useRef(hsv);
  const draggingRef = useRef<"hue" | "board" | null>(null);
  const onChangeRef = useRef(onChange);
  const lastEmittedRef = useRef(normalized);
  const rafRef = useRef<number | null>(null);
  const pendingHexRef = useRef<string | null>(null);
  const applyHsvRef = useRef<(next: HsvColor) => void>(() => {});

  onChangeRef.current = onChange;
  hsvRef.current = hsv;

  applyHsvRef.current = (next: HsvColor) => {
    hsvRef.current = next;
    setHsv(next);
    const hex = hsvToHex(next.h, next.s, next.v);
    setHexDraft(hex.replace(/^#/, "").toUpperCase());

    if (sameHex(hex, lastEmittedRef.current)) return;
    lastEmittedRef.current = hex;
    pendingHexRef.current = hex;

    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const pending = pendingHexRef.current;
      pendingHexRef.current = null;
      if (pending) onChangeRef.current(pending);
    });
  };

  // Sync from parent only when idle — never fight an active drag.
  useEffect(() => {
    if (draggingRef.current) return;
    if (sameHex(normalized, lastEmittedRef.current)) return;
    lastEmittedRef.current = normalized;
    const next = hexToHsv(normalized);
    hsvRef.current = next;
    setHsv(next);
    setHexDraft(normalized.replace(/^#/, "").toUpperCase());
  }, [normalized]);

  // Mount-only window listeners (stable via refs).
  useEffect(() => {
    const readHue = (clientY: number) => {
      const el = hueElRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const t = clamp01((clientY - rect.top) / Math.max(rect.height, 1));
      applyHsvRef.current({ ...hsvRef.current, h: t * 360 });
    };

    const readBoard = (clientX: number, clientY: number) => {
      const el = boardElRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const s = clamp01((clientX - rect.left) / Math.max(rect.width, 1));
      const v = 1 - clamp01((clientY - rect.top) / Math.max(rect.height, 1));
      applyHsvRef.current({ ...hsvRef.current, s, v });
    };

    const onMove = (event: PointerEvent) => {
      if (draggingRef.current === "hue") {
        event.preventDefault();
        readHue(event.clientY);
      } else if (draggingRef.current === "board") {
        event.preventDefault();
        readBoard(event.clientX, event.clientY);
      }
    };

    const onUp = () => {
      draggingRef.current = null;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      const pending = pendingHexRef.current;
      if (pending) {
        pendingHexRef.current = null;
        onChangeRef.current(pending);
      }
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const startHueDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    draggingRef.current = "hue";
    const el = hueElRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const t = clamp01((event.clientY - rect.top) / Math.max(rect.height, 1));
    applyHsvRef.current({ ...hsvRef.current, h: t * 360 });
  };

  const startBoardDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    draggingRef.current = "board";
    const el = boardElRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const s = clamp01((event.clientX - rect.left) / Math.max(rect.width, 1));
    const v = 1 - clamp01((event.clientY - rect.top) / Math.max(rect.height, 1));
    applyHsvRef.current({ ...hsvRef.current, s, v });
  };

  const pureHue = hsvToHex(hsv.h, 1, 1);
  const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);

  return (
    <div className={cn("space-y-3", className)}>
      {showPresets ? (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5C5C5C]">
            {label}
          </p>
          <div className="flex flex-wrap gap-2.5">
            {PORTFOLIO_COLOR_SWATCHES.map((swatch) => {
              const selected = sameHex(currentHex, swatch.value);
              return (
                <button
                  key={swatch.value}
                  type="button"
                  title={swatch.label}
                  aria-label={swatch.label}
                  aria-pressed={selected}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    lastEmittedRef.current = swatch.value;
                    const next = hexToHsv(swatch.value);
                    hsvRef.current = next;
                    setHsv(next);
                    setHexDraft(swatch.value.replace(/^#/, "").toUpperCase());
                    onChangeRef.current(swatch.value);
                  }}
                  className={cn(
                    "size-8 rounded-full transition hover:scale-105",
                    selected
                      ? "shadow-[0_0_0_3px_#fff,0_0_0_5px_#4FC3F7]"
                      : "shadow-[0_0_0_1px_#E5E5E0]",
                  )}
                  style={{ backgroundColor: swatch.value }}
                />
              );
            })}
          </div>
        </>
      ) : null}

      <div className="space-y-3">
        <div className={cn("flex gap-2.5", compact ? "h-32" : "h-40")}>
          <div
            ref={hueElRef}
            role="slider"
            tabIndex={0}
            aria-label="Hue"
            aria-valuemin={0}
            aria-valuemax={360}
            aria-valuenow={Math.round(hsv.h)}
            onPointerDown={startHueDrag}
            onKeyDown={(event) => {
              if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
                event.preventDefault();
                applyHsvRef.current({
                  ...hsvRef.current,
                  h: (hsvRef.current.h - 4 + 360) % 360,
                });
              } else if (
                event.key === "ArrowDown" ||
                event.key === "ArrowRight"
              ) {
                event.preventDefault();
                applyHsvRef.current({
                  ...hsvRef.current,
                  h: (hsvRef.current.h + 4) % 360,
                });
              }
            }}
            className="relative w-3.5 shrink-0 cursor-ns-resize touch-none overflow-hidden rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50"
            style={{
              background:
                "linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
            }}
          >
            <span
              className="pointer-events-none absolute left-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.25)]"
              style={{ top: `${(hsv.h / 360) * 100}%` }}
            />
          </div>

          <div
            ref={boardElRef}
            role="presentation"
            aria-label="Độ bão hòa và độ sáng"
            onPointerDown={startBoardDrag}
            className="relative min-w-0 flex-1 cursor-crosshair touch-none overflow-hidden rounded-2xl"
            style={{
              backgroundColor: pureHue,
              backgroundImage: `
                linear-gradient(to top, #000, transparent),
                linear-gradient(to right, #fff, transparent)
              `,
            }}
          >
            <span
              className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
              style={{
                left: `${hsv.s * 100}%`,
                top: `${(1 - hsv.v) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="size-10 shrink-0 rounded-xl border border-[#E5E5E0]"
            style={{ backgroundColor: currentHex }}
            aria-hidden
          />
          <Input
            value={hexDraft}
            onMouseDown={(event) => event.stopPropagation()}
            onChange={(event) => {
              const raw = event.target.value
                .replace(/[^0-9a-fA-F]/g, "")
                .slice(0, 6)
                .toUpperCase();
              setHexDraft(raw);
              if (raw.length === 6) {
                const hex = `#${raw}`;
                lastEmittedRef.current = hex;
                const next = hexToHsv(hex);
                hsvRef.current = next;
                setHsv(next);
                onChangeRef.current(hex);
              }
            }}
            onBlur={() => {
              if (hexDraft.length === 6) {
                const hex = `#${hexDraft}`;
                lastEmittedRef.current = hex;
                onChangeRef.current(hex);
              } else {
                setHexDraft(currentHex.replace(/^#/, "").toUpperCase());
              }
            }}
            className="h-10 rounded-xl border-[#E5E5E0] bg-[#F5F5F0] font-mono text-sm uppercase tracking-wide"
            aria-label="Mã màu hex"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
