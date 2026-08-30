"use client";

import { useId, useState } from "react";
import { ExternalLink, MapPin, Maximize2, Minimize2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SessionLocationMapProps = {
  latitude: number;
  longitude: number;
  locationLabel?: string | null;
  className?: string;
  variant?: "manager" | "learn";
  /** `compact` fits a narrow sheet (~22–26rem) without a tall iframe. */
  density?: "default" | "compact";
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

export function SessionLocationMap({
  latitude,
  longitude,
  locationLabel,
  className,
  variant = "manager",
  density = "default",
  expanded,
  onExpandedChange,
}: SessionLocationMapProps) {
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(false);
  const isExpanded = expanded ?? uncontrolledExpanded;
  const frameId = useId();
  const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
  const embedSrc = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;
  const isLearn = variant === "learn";
  const isCompact = density === "compact";
  const label = locationLabel?.trim() || null;

  function setIsExpanded(next: boolean) {
    onExpandedChange?.(next);
    if (expanded === undefined) setUncontrolledExpanded(next);
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border",
        isLearn ? "border-learn-border bg-learn-surface" : "border-border bg-card",
        isExpanded && isCompact && "flex min-h-0 flex-1 flex-col",
        className,
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-start gap-2 text-sm",
          isCompact ? "px-3 py-2" : "px-4 py-3",
          isLearn ? "text-learn-text-strong" : "text-foreground",
        )}
      >
        <MapPin
          className={cn(
            "mt-0.5 shrink-0",
            isCompact ? "size-3.5" : "size-4",
            isLearn ? "text-learn-accent" : "text-primary",
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          {isCompact ? (
            <p className="truncate text-xs font-semibold leading-snug">
              {label ?? "Vị trí trên bản đồ"}
            </p>
          ) : (
            <>
              <p className="font-medium">Vị trí trên bản đồ</p>
              {label ? (
                <p
                  className={cn(
                    "mt-0.5 truncate text-xs",
                    isLearn ? "text-learn-muted" : "text-muted-foreground",
                  )}
                >
                  {label}
                </p>
              ) : null}
            </>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "shrink-0 rounded-lg",
            isCompact ? "size-7" : "size-8",
            isLearn
              ? "text-learn-muted hover:bg-learn-surface-2 hover:text-learn-accent"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-expanded={isExpanded}
          aria-controls={frameId}
          aria-label={isExpanded ? "Thu gọn bản đồ" : "Phóng to bản đồ"}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <Minimize2 className="size-4" aria-hidden />
          ) : (
            <Maximize2 className="size-4" aria-hidden />
          )}
        </Button>
      </div>
      <iframe
        id={frameId}
        title="Bản đồ địa điểm buổi học"
        src={embedSrc}
        className={cn(
          "w-full border-0 border-t transition-[height,flex-grow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
          isLearn ? "border-learn-border" : "border-border",
          isExpanded && isCompact
            ? "min-h-64 flex-1"
            : isExpanded
              ? "h-[min(70vh,28rem)]"
              : isCompact
                ? "h-36"
                : "h-52",
        )}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <a
        href={mapsLink}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex shrink-0 items-center justify-center gap-1.5 border-t font-semibold",
          isCompact ? "px-3 py-2 text-[11px]" : "px-3 py-2.5 text-xs",
          isLearn
            ? "border-learn-border text-learn-accent hover:bg-learn-surface-2"
            : "border-border text-primary hover:bg-muted/30",
        )}
      >
        Chỉ đường trên Google Maps
        <ExternalLink className="size-3.5" aria-hidden />
      </a>
    </div>
  );
}
