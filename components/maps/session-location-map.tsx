"use client";

import { useState } from "react";
import { ExternalLink, MapPin, Maximize2, Minimize2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SessionLocationMapProps = {
  latitude: number;
  longitude: number;
  locationLabel?: string | null;
  className?: string;
  variant?: "manager" | "learn";
};

export function SessionLocationMap({
  latitude,
  longitude,
  locationLabel,
  className,
  variant = "manager",
}: SessionLocationMapProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
  const embedSrc = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;
  const isLearn = variant === "learn";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border",
        isLearn ? "border-learn-border bg-learn-surface" : "border-border bg-card",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-start gap-2 px-4 py-3 text-sm",
          isLearn ? "text-learn-text-strong" : "text-foreground",
        )}
      >
        <MapPin
          className={cn(
            "mt-0.5 size-4 shrink-0",
            isLearn ? "text-learn-accent" : "text-primary",
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium">Vị trí trên bản đồ</p>
          {locationLabel?.trim() ? (
            <p
              className={cn(
                "mt-0.5 truncate text-xs",
                isLearn ? "text-learn-muted" : "text-muted-foreground",
              )}
            >
              {locationLabel.trim()}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "size-8 shrink-0 rounded-lg",
            isLearn
              ? "text-learn-muted hover:bg-learn-surface-2 hover:text-learn-accent"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-expanded={isExpanded}
          aria-controls="session-location-map-frame"
          aria-label={isExpanded ? "Thu gọn bản đồ" : "Phóng to bản đồ"}
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {isExpanded ? (
            <Minimize2 className="size-4" aria-hidden />
          ) : (
            <Maximize2 className="size-4" aria-hidden />
          )}
        </Button>
      </div>
      <iframe
        id="session-location-map-frame"
        title="Bản đồ địa điểm buổi học"
        src={embedSrc}
        className={cn(
          "w-full border-0 border-t transition-[height] duration-300 ease-out motion-reduce:transition-none",
          isLearn ? "border-learn-border" : "border-border",
          isExpanded ? "h-[min(70vh,28rem)]" : "h-52",
        )}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <a
        href={mapsLink}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex items-center justify-center gap-1.5 border-t px-3 py-2.5 text-xs font-semibold",
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
