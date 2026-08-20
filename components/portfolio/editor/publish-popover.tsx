"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  EyeOff,
  ExternalLink,
  Globe,
  Loader2,
  Rocket,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Portfolio } from "@/lib/api/entities/portfolio";
import {
  checkPortfolioSubdomainAvailability,
  updateMyPortfolioPublication,
  updateMyPortfolioSubdomain,
} from "@/lib/api/portfolios";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import {
  buildPortfolioPublicUrl,
  getPortfolioRootDomain,
} from "@/lib/portfolio/url";
import { cn } from "@/lib/utils";

type PublishPopoverProps = {
  portfolio: Portfolio;
  onUpdated: (portfolio: Portfolio) => void;
};

/** Panel copy only — outer trigger stays a quiet opener. */
type PublishPanelState = {
  title: string;
  description: string;
  status: "draft" | "live" | "stale";
};

function resolvePublishPanel(portfolio: Portfolio): PublishPanelState {
  if (portfolio.isPublic && portfolio.hasUnpublishedChanges) {
    return {
      title: "Cập nhật bản công khai",
      description:
        "Có thay đổi chưa đẩy lên bản công khai — xuất bản lại để đồng bộ.",
      status: "stale",
    };
  }
  if (portfolio.isPublic) {
    return {
      title: "Portfolio đang live",
      description:
        "Trang của bạn đang hiển thị công khai. Chỉnh subdomain hoặc tạm ẩn khi cần.",
      status: "live",
    };
  }
  return {
    title: "Xuất bản portfolio",
    description: "Chọn subdomain và bật công khai để chia sẻ trang của bạn.",
    status: "draft",
  };
}

const STATUS_DOT: Record<PublishPanelState["status"], string> = {
  draft: "bg-muted-foreground/45",
  live: "bg-[#7CB342]",
  stale: "bg-[#E94B3C]",
};

export function PublishPopover({ portfolio, onUpdated }: PublishPopoverProps) {
  const [subdomain, setSubdomain] = useState(portfolio.subdomain ?? "");
  const [isSavingSubdomain, setIsSavingSubdomain] = useState(false);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);
  const [copied, setCopied] = useState(false);
  const [availability, setAvailability] = useState<{
    available: boolean;
    reason: string | null;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const rootDomain = getPortfolioRootDomain();

  useEffect(() => {
    setSubdomain(portfolio.subdomain ?? "");
  }, [portfolio.subdomain]);

  useEffect(() => {
    const trimmed = subdomain.trim().toLowerCase();
    if (!trimmed || trimmed === (portfolio.subdomain ?? "").toLowerCase()) {
      setAvailability(null);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const result = await checkPortfolioSubdomainAvailability({
            subdomain: trimmed,
          });
          setAvailability({
            available: result.data.available,
            reason: result.data.reason,
          });
        } catch {
          setAvailability(null);
        } finally {
          setIsChecking(false);
        }
      })();
    }, 400);

    return () => window.clearTimeout(timer);
  }, [subdomain, portfolio.subdomain]);

  const canonicalUrl = useMemo(() => {
    const current = portfolio.subdomain?.trim();
    if (!current) return null;
    return buildPortfolioPublicUrl(current);
  }, [portfolio.subdomain]);

  const canPublish = Boolean(portfolio.subdomain?.trim());
  const subdomainChanged =
    subdomain.trim().toLowerCase() !==
    (portfolio.subdomain ?? "").trim().toLowerCase();
  const panel = resolvePublishPanel(portfolio);

  const handleSaveSubdomain = async () => {
    setIsSavingSubdomain(true);
    try {
      const next = subdomain.trim() || null;
      const result = await updateMyPortfolioSubdomain({ subdomain: next });
      onUpdated(result.data);
      showAppSuccess({
        title: "Đã cập nhật subdomain",
        description: result.message,
      });
    } catch (error) {
      showAppErrorFromUnknown(error, "portfolio.subdomain");
    } finally {
      setIsSavingSubdomain(false);
    }
  };

  const handlePublishToggle = async (isPublished: boolean) => {
    if (isPublished && !canPublish) {
      showAppErrorFromUnknown(
        new Error("Cần subdomain hợp lệ trước khi công khai."),
        "portfolio.publish",
      );
      return;
    }

    setIsTogglingPublish(true);
    try {
      const result = await updateMyPortfolioPublication({ isPublished });
      onUpdated(result.data);
      showAppSuccess({
        title: isPublished ? "Đã công khai portfolio" : "Đã ẩn portfolio",
        description: result.message,
      });
    } catch (error) {
      showAppErrorFromUnknown(error, "portfolio.publish");
    } finally {
      setIsTogglingPublish(false);
    }
  };

  const handleCopy = async () => {
    if (!canonicalUrl) return;
    try {
      await navigator.clipboard.writeText(canonicalUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      showAppErrorFromUnknown(
        new Error("Không sao chép được liên kết."),
        "portfolio.publish",
      );
    }
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            aria-label="Mở cài đặt xuất bản"
            className="h-10 gap-1.5 rounded-xl px-2.5 sm:px-3"
          />
        }
      >
        <Globe className="size-4 shrink-0" />
        <span className="hidden min-[380px]:inline">Xuất bản</span>
        <span
          className={cn("size-2 shrink-0 rounded-full", STATUS_DOT[panel.status])}
          aria-hidden
        />
        <ChevronDown className="hidden size-3.5 shrink-0 text-muted-foreground sm:block" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[min(26rem,calc(100vw-2rem))] rounded-2xl border-border bg-popover p-5 text-popover-foreground"
      >
        <div className="space-y-5">
          <div>
            <p className="font-heading text-base font-semibold text-foreground">
              {panel.title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {panel.description}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="publish-subdomain">Subdomain</Label>
            <div className="flex min-w-0 items-center overflow-hidden rounded-xl border border-border bg-background">
              <Input
                id="publish-subdomain"
                value={subdomain}
                onChange={(event) => setSubdomain(event.target.value)}
                className="h-10 min-w-0 flex-1 rounded-none border-0 bg-transparent"
                placeholder="ten-ban"
                autoComplete="off"
              />
              <span className="max-w-[40%] shrink-0 truncate border-l border-border px-2 font-mono text-[10px] text-muted-foreground sm:max-w-none sm:px-3 sm:text-xs">
                .{rootDomain}
              </span>
            </div>
            <div className="min-h-4 text-xs">
              {isChecking ? (
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  Đang kiểm tra…
                </p>
              ) : availability ? (
                <p
                  className={cn(
                    availability.available ? "text-[#7CB342]" : "text-primary",
                  )}
                >
                  {availability.available
                    ? "Subdomain còn trống."
                    : availability.reason || "Subdomain không khả dụng."}
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Gửi trống để gỡ subdomain khi chưa công khai.
                </p>
              )}
            </div>
            {subdomainChanged ? (
              <Button
                type="button"
                disabled={isSavingSubdomain}
                onClick={() => void handleSaveSubdomain()}
                className="h-9 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSavingSubdomain ? "Đang lưu…" : "Lưu subdomain"}
              </Button>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                Công khai portfolio
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {canPublish
                  ? portfolio.isPublic
                    ? "Đang hiển thị trên web công khai."
                    : "Sẵn sàng xuất bản."
                  : "Cần subdomain trước khi công khai."}
              </p>
            </div>
            <button
              type="button"
              disabled={
                isTogglingPublish || (!portfolio.isPublic && !canPublish)
              }
              aria-pressed={portfolio.isPublic}
              aria-label={
                portfolio.isPublic
                  ? "Ẩn portfolio khỏi web công khai"
                  : "Xuất bản portfolio lên web"
              }
              onClick={() => void handlePublishToggle(!portfolio.isPublic)}
              className={cn(
                "group inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition outline-none",
                "focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50",
                "disabled:pointer-events-none disabled:opacity-50",
                portfolio.isPublic
                  ? "border border-[#7CB342]/35 bg-[#7CB342]/12 text-[#4c7027] hover:border-[#E94B3C]/35 hover:bg-[#E94B3C]/10 hover:text-[#b53428]"
                  : "bg-[#0f7cad] text-white shadow-[0_8px_18px_-10px_rgba(15,124,173,0.7)] hover:bg-[#0d6f9a]",
              )}
            >
              {isTogglingPublish ? (
                <Loader2 className="size-4 animate-spin" />
              ) : portfolio.isPublic ? (
                <>
                  <span className="relative flex size-2.5 shrink-0 group-hover:hidden">
                    <span className="absolute inset-0 animate-ping rounded-full bg-[#7CB342]/50" />
                    <span className="relative size-2.5 rounded-full bg-[#7CB342]" />
                  </span>
                  <EyeOff className="hidden size-4 shrink-0 group-hover:block" />
                  <span className="group-hover:hidden">Đang live</span>
                  <span className="hidden group-hover:inline">Ẩn đi</span>
                </>
              ) : (
                <>
                  <Rocket className="size-4 shrink-0" strokeWidth={2.25} />
                  Xuất bản
                </>
              )}
            </button>
          </div>

          {canonicalUrl ? (
            <div className="space-y-2 rounded-xl bg-[#2D2D2D] p-3 text-[#FAFAF5]">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/60">
                Liên kết công khai
              </p>
              <p className="break-all text-sm font-medium">{canonicalUrl}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-8 rounded-lg text-xs"
                  onClick={() => void handleCopy()}
                >
                  {copied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  {copied ? "Đã sao chép" : "Sao chép"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 rounded-lg border-white/20 bg-transparent text-xs text-white hover:bg-white/10 hover:text-white"
                  onClick={() =>
                    window.open(canonicalUrl, "_blank", "noreferrer")
                  }
                >
                  <ExternalLink className="size-3.5" />
                  Xem trang công khai
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
