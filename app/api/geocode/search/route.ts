import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  q: z.string().trim().min(2).max(200),
});

const nominatimItemSchema = z.object({
  display_name: z.string(),
  lat: z.string(),
  lon: z.string(),
});

export type GeocodeSearchResult = {
  label: string;
  latitude: number;
  longitude: number;
};

/**
 * Proxy OpenStreetMap Nominatim search (no API key).
 * Server-side call keeps a proper User-Agent and avoids CORS.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ q: searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Nhập ít nhất 2 ký tự để tìm địa chỉ." },
      { status: 400 },
    );
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("limit", "6");
  url.searchParams.set("q", parsed.data.q);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "OboxSTEAM.FE/1.0 (capstone; contact: oboxsteam@local)",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Không tìm được địa chỉ lúc này." },
        { status: 502 },
      );
    }

    const json: unknown = await response.json();
    const items = z.array(nominatimItemSchema).safeParse(json);
    if (!items.success) {
      return NextResponse.json({ results: [] as GeocodeSearchResult[] });
    }

    const results: GeocodeSearchResult[] = items.data
      .map((item) => {
        const latitude = Number(item.lat);
        const longitude = Number(item.lon);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return null;
        }
        return {
          label: item.display_name,
          latitude,
          longitude,
        } satisfies GeocodeSearchResult;
      })
      .filter((item): item is GeocodeSearchResult => item != null);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "Không kết nối được dịch vụ bản đồ." },
      { status: 502 },
    );
  }
}
