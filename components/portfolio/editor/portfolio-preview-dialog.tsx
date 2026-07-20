"use client";

import { useMemo, useState } from "react";
import {
  ExternalLink,
  Eye,
  Lock,
  Monitor,
  RotateCw,
  Smartphone,
  Tablet,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import {
  PortfolioMicrosite,
  toPortfolioMicrositeData,
} from "@/components/portfolio/render/portfolio-microsite";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Portfolio } from "@/lib/api/entities/portfolio";
import {
  buildPortfolioPathUrl,
  buildPortfolioPublicUrl,
} from "@/lib/portfolio/url";
import { cn } from "@/lib/utils";

type DeviceMode = "desktop" | "tablet" | "mobile";

type PortfolioPreviewDialogProps = {
  draft: Portfolio;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DEVICE_OPTIONS: {
  id: DeviceMode;
  label: string;
  icon: typeof Monitor;
}[] = [
  { id: "desktop", label: "Máy tính", icon: Monitor },
  { id: "tablet", label: "Máy tính bảng", icon: Tablet },
  { id: "mobile", label: "Điện thoại", icon: Smartphone },
];

const DEVICE_WIDTH: Record<DeviceMode, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

function resolveAddressBar(draft: Portfolio): {
  displayUrl: string;
  openUrl: string | null;
  isLive: boolean;
} {
  const subdomain = draft.subdomain?.trim();
  if (!subdomain) {
    return {
      displayUrl: "Chưa có subdomain",
      openUrl: null,
      isLive: false,
    };
  }

  if (draft.isPublic) {
    const publicUrl = buildPortfolioPublicUrl(subdomain);
    return {
      displayUrl: publicUrl,
      openUrl: publicUrl,
      isLive: true,
    };
  }

  const pathUrl = buildPortfolioPathUrl(subdomain);
  return {
    displayUrl: pathUrl,
    openUrl: pathUrl,
    isLive: false,
  };
}

export function PortfolioPreviewDialog({
  draft,
  open,
  onOpenChange,
}: PortfolioPreviewDialogProps) {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [refreshTick, setRefreshTick] = useState(0);
  const reduceMotion = useReducedMotion();
  const micrositeData = useMemo(
    () => toPortfolioMicrositeData(draft),
    [draft],
  );
  const address = resolveAddressBar(draft);
  const isMobileFrame = deviceMode === "mobile";

  const handleRefresh = () => {
    setRefreshTick((tick) => tick + 1);
  };

  const handleOpenExternal = () => {
    if (!address.openUrl) return;
    window.open(address.openUrl, "_blank", "noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup
        className={cn(
          "flex h-[94dvh] max-w-6xl flex-col gap-0 overflow-hidden p-0",
          "rounded-[1.75rem] border-[#E5E5E0] bg-[#FAFAF5] text-[#2D2D2D]",
          "shadow-[0_40px_80px_-24px_rgba(45,45,45,0.35)]",
        )}
      >
        {/* Header — matches portfolio page toolbar contrast */}
        <div className="flex shrink-0 items-center gap-2 border-b border-[#E5E5E0] bg-white px-3 py-2.5 sm:gap-3 sm:px-5">
          <div className="flex min-w-0 shrink items-center gap-2">
            <span className="hidden size-8 items-center justify-center rounded-xl bg-[#4FC3F7]/15 text-[#0f7cad] sm:inline-flex">
              <Eye className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0">
              <DialogTitle className="truncate font-heading text-sm font-bold text-[#2D2D2D] sm:text-base">
                Xem trước
              </DialogTitle>
              <p className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0f7cad] sm:block">
                Portfolio
              </p>
            </div>
          </div>

          <div className="mx-auto flex min-w-0 flex-1 justify-center px-1 sm:px-3">
            <div
              className={cn(
                "flex h-9 w-full max-w-md items-center gap-2 rounded-xl border border-[#E5E5E0] bg-[#FAFAF5] px-3",
              )}
            >
              <Lock className="size-3.5 shrink-0 text-[#6B6B6B]" aria-hidden />
              <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-[#2D2D2D] sm:text-xs">
                {address.displayUrl}
              </span>
              {address.isLive ? (
                <span
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#4FC3F7]/15 px-2 py-0.5 text-[10px] font-medium text-[#0f7cad]"
                >
                  <span
                    className="size-1.5 animate-pulse rounded-full bg-[#4FC3F7]"
                    aria-hidden
                  />
                  Live
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <div
              className="flex items-center rounded-xl border border-[#E5E5E0] bg-[#FAFAF5] p-0.5"
              role="group"
              aria-label="Chế độ thiết bị"
            >
              {DEVICE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = deviceMode === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    title={option.label}
                    aria-label={option.label}
                    aria-pressed={isActive}
                    onClick={() => setDeviceMode(option.id)}
                    className={cn(
                      "inline-flex size-8 items-center justify-center rounded-lg transition-colors outline-none",
                      "focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50",
                      isActive
                        ? "bg-[#4FC3F7]/15 text-[#0f7cad]"
                        : "text-[#5C5C5C] hover:bg-white hover:text-[#2D2D2D]",
                    )}
                  >
                    <Icon className="size-4" strokeWidth={1.75} />
                  </button>
                );
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Làm mới xem trước"
              aria-label="Làm mới xem trước"
              onClick={handleRefresh}
              className="size-9 rounded-xl border-[#E5E5E0] text-[#2D2D2D] hover:bg-[#F5F5F0]"
            >
              <RotateCw className="size-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              title={
                address.openUrl
                  ? "Mở trong tab mới"
                  : "Cần subdomain trước khi mở trang công khai"
              }
              aria-label="Mở trong tab mới"
              disabled={!address.openUrl}
              onClick={handleOpenExternal}
              className="size-9 rounded-xl border-[#E5E5E0] text-[#2D2D2D] hover:bg-[#F5F5F0]"
            >
              <ExternalLink className="size-4" />
            </Button>

            <DialogClose
              className={cn(
                "static inset-auto top-auto right-auto inline-flex size-9 items-center justify-center",
                "rounded-xl border border-[#E5E5E0] bg-white p-0 text-[#5C5C5C] opacity-100",
                "hover:bg-[#F5F5F0] hover:text-[#2D2D2D] hover:opacity-100",
                "focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50",
              )}
            />
          </div>
        </div>

        {/* Viewport — dashed page frame; scroll clipped inside paper.
            `portfolio-preview-scroll` MUST be the real overflow-y scroller —
            AnimatedContent / FadeContent ScrollTriggers bind to this id. */}
        <div className="relative min-h-0 flex-1 overflow-hidden bg-[#F0F0EA]">
          <div className="flex h-full items-stretch justify-center overflow-hidden p-3 sm:p-5">
            <motion.div
              className="relative flex h-full max-h-full w-full flex-col"
              animate={{
                width: DEVICE_WIDTH[deviceMode],
                maxWidth: "100%",
              }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 120, damping: 20 }
              }
              style={{ width: DEVICE_WIDTH[deviceMode], maxWidth: "100%" }}
            >
              {/* Dashed page shell */}
              <div
                className={cn(
                  "flex h-full min-h-0 flex-col border border-dashed border-[#C9C9C2] bg-[#FAFAF5]/80 p-2 sm:p-2.5",
                  isMobileFrame ? "rounded-[1.75rem]" : "rounded-2xl",
                )}
              >
                {/* Paper — radius + overflow-hidden clips scrollbar cleanly */}
                <div
                  className={cn(
                    "relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white",
                    "shadow-[0_24px_60px_rgba(45,45,45,0.10)] ring-1 ring-[#E5E5E0]",
                    isMobileFrame ? "rounded-[1.35rem]" : "rounded-xl",
                  )}
                >
                  <div
                    id="portfolio-preview-scroll"
                    className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-gutter:stable]"
                  >
                    <PortfolioMicrosite
                      key={`${deviceMode}-${refreshTick}`}
                      data={micrositeData}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
