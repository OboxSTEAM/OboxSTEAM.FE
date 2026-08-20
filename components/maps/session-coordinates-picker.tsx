"use client";

import { ExternalLink, MapPin } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SessionCoordinatesPickerProps = {
  latitude: string;
  longitude: string;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
  latitudeError?: string;
  longitudeError?: string;
  className?: string;
};

function parseCoordinate(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function SessionCoordinatesPicker({
  latitude,
  longitude,
  onLatitudeChange,
  onLongitudeChange,
  latitudeError,
  longitudeError,
  className,
}: SessionCoordinatesPickerProps) {
  const lat = parseCoordinate(latitude);
  const lng = parseCoordinate(longitude);
  const hasPreview = lat != null && lng != null;
  const mapsLink = hasPreview
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : null;
  const embedSrc = hasPreview
    ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`
    : null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
        <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
        <p>
          Nhập tọa độ GPS cho buổi offline/field trip. Vĩ độ và kinh độ phải được
          gửi cùng nhau (UTC, không cần API key — dùng link/embed Google Maps).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="latitude">Vĩ độ (latitude)</Label>
          <Input
            id="latitude"
            inputMode="decimal"
            placeholder="10.762622"
            value={latitude}
            onChange={(event) => onLatitudeChange(event.target.value)}
            className="h-10 rounded-lg"
          />
          {latitudeError ? (
            <p className="text-xs font-medium text-primary">{latitudeError}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="longitude">Kinh độ (longitude)</Label>
          <Input
            id="longitude"
            inputMode="decimal"
            placeholder="106.660172"
            value={longitude}
            onChange={(event) => onLongitudeChange(event.target.value)}
            className="h-10 rounded-lg"
          />
          {longitudeError ? (
            <p className="text-xs font-medium text-primary">{longitudeError}</p>
          ) : null}
        </div>
      </div>

      {hasPreview && embedSrc ? (
        <div className="overflow-hidden rounded-xl border border-border">
          <iframe
            title="Xem trước vị trí buổi học"
            src={embedSrc}
            className="h-48 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          {mapsLink ? (
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 border-t border-border bg-muted/20 px-3 py-2 text-xs font-medium text-primary hover:bg-muted/40"
            >
              Mở trong Google Maps
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function parseSessionCoordinateFields(
  latitude?: string,
  longitude?: string,
): { latitude: number | null; longitude: number | null } {
  const latText = latitude?.trim();
  const lngText = longitude?.trim();
  if (!latText && !lngText) {
    return { latitude: null, longitude: null };
  }
  if (!latText || !lngText) {
    return { latitude: null, longitude: null };
  }
  const lat = Number(latText);
  const lng = Number(lngText);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { latitude: null, longitude: null };
  }
  return { latitude: lat, longitude: lng };
}
