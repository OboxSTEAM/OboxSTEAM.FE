"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Globe, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
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
            className="h-10 rounded-xl bg-foreground px-2.5 text-background hover:bg-foreground/90 sm:px-4"
          />
        }
      >
        <Globe className="size-4" />
        <span className="hidden min-[380px]:inline">Xuất bản</span>
        <span
          className={cn(
            "size-2 rounded-full",
            portfolio.isPublic ? "bg-[#7CB342]" : "bg-background/30",
          )}
          aria-hidden
        />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[min(26rem,calc(100vw-2rem))] rounded-2xl border-border bg-popover p-5 text-popover-foreground"
      >
        <div className="space-y-5">
          <div>
            <p className="font-heading text-base font-semibold text-foreground">
              Xuất bản portfolio
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Chọn subdomain và bật công khai để chia sẻ trang của bạn.
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
            <div>
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
            <Switch
              checked={portfolio.isPublic}
              disabled={
                isTogglingPublish || (!portfolio.isPublic && !canPublish)
              }
              onCheckedChange={(checked) =>
                void handlePublishToggle(Boolean(checked))
              }
            />
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
