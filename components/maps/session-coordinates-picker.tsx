"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ExternalLink, Loader2, MapPin, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type GeocodeHit = {
  label: string;
  latitude: number;
  longitude: number;
};

type SessionCoordinatesPickerProps = {
  latitude: string;
  longitude: string;
  location?: string;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
  onLocationChange?: (value: string) => void;
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
  location = "",
  onLatitudeChange,
  onLongitudeChange,
  onLocationChange,
  latitudeError,
  longitudeError,
  className,
}: SessionCoordinatesPickerProps) {
  const listId = useId();
  const [query, setQuery] = useState(location);
  const [results, setResults] = useState<GeocodeHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const lat = parseCoordinate(latitude);
  const lng = parseCoordinate(longitude);
  const hasPreview = lat != null && lng != null;
  const mapsLink = hasPreview
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : null;
  const embedSrc = hasPreview
    ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`
    : null;

  useEffect(() => {
    setQuery(location);
  }, [location]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  function scheduleSearch(nextQuery: string) {
    setQuery(nextQuery);
    setSearchError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = nextQuery.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      void runSearch(trimmed);
    }, 400);
  }

  async function runSearch(trimmed: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(
        `/api/geocode/search?q=${encodeURIComponent(trimmed)}`,
        { signal: controller.signal },
      );
      const json = (await response.json()) as {
        results?: GeocodeHit[];
        error?: string;
      };
      if (!response.ok) {
        setSearchError(json.error ?? "Không tìm được địa chỉ.");
        setResults([]);
        setIsOpen(false);
        return;
      }
      const next = json.results ?? [];
      setResults(next);
      setIsOpen(next.length > 0);
    } catch (error) {
      if ((error as { name?: string })?.name === "AbortError") return;
      setSearchError("Không tìm được địa chỉ.");
      setResults([]);
      setIsOpen(false);
    } finally {
      setIsSearching(false);
    }
  }

  function applyHit(hit: GeocodeHit) {
    setQuery(hit.label);
    onLocationChange?.(hit.label);
    onLatitudeChange(String(hit.latitude));
    onLongitudeChange(String(hit.longitude));
    setResults([]);
    setIsOpen(false);
    setSearchError(null);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
        <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
        <p>
          Tìm địa chỉ qua OpenStreetMap (không cần Google API key), hoặc nhập
          tay vĩ độ/kinh độ. Cặp tọa độ phải gửi cùng nhau.
        </p>
      </div>

      {onLocationChange ? (
        <div className="relative space-y-1.5">
          <Label htmlFor={`${listId}-address`}>Tìm địa chỉ</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id={`${listId}-address`}
              value={query}
              onChange={(event) => scheduleSearch(event.target.value)}
              onFocus={() => {
                if (results.length > 0) setIsOpen(true);
              }}
              placeholder="VD: Bảo tàng Khoa học TP.HCM"
              className="h-10 rounded-lg pl-9"
              autoComplete="off"
              aria-autocomplete="list"
              aria-controls={`${listId}-results`}
              aria-expanded={isOpen}
            />
            {isSearching ? (
              <Loader2
                className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
                aria-hidden
              />
            ) : null}
          </div>
          {searchError ? (
            <p className="text-xs font-medium text-primary">{searchError}</p>
          ) : null}
          {isOpen && results.length > 0 ? (
            <ul
              id={`${listId}-results`}
              role="listbox"
              className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-popover shadow-md"
            >
              {results.map((hit) => (
                <li key={`${hit.latitude},${hit.longitude},${hit.label}`}>
                  <button
                    type="button"
                    role="option"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => applyHit(hit)}
                  >
                    {hit.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

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
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={query.trim().length < 2 || isSearching}
          onClick={() => void runSearch(query.trim())}
        >
          <Search className="size-3.5" aria-hidden />
          Tìm lại địa chỉ
        </Button>
      )}
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
