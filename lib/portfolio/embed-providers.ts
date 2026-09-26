export type EmbedAspect = "16/9" | "4/3";

export type EmbedProvider =
  | "scratch"
  | "tinkercad"
  | "wokwi"
  | "p5js"
  | "codepen"
  | "youtube"
  | "vimeo"
  | "figma"
  | "canva"
  | "google-slides";

export type EmbedSpec = {
  provider: EmbedProvider;
  label: string;
  embedUrl: string;
  sourceUrl: string;
  aspect: EmbedAspect;
};

const PROVIDER_LABELS: Record<EmbedProvider, string> = {
  scratch: "Scratch",
  tinkercad: "Tinkercad",
  wokwi: "Wokwi",
  p5js: "p5.js",
  codepen: "CodePen",
  youtube: "YouTube",
  vimeo: "Vimeo",
  figma: "Figma",
  canva: "Canva",
  "google-slides": "Google Slides",
};

export const EMBED_PROVIDER_HINT =
  "Chỉ hỗ trợ Scratch, Tinkercad, Wokwi, p5.js, CodePen, YouTube, Vimeo, Figma, Canva, Google Slides.";

/** Decode HTML entities and drop tags so a stored `<p>url</p>` still parses. */
export function stripEmbedSource(value: string): string {
  const decoded = value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ");
  return decoded.replace(/\s+/g, " ").trim();
}

function httpsUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed || /^javascript:/i.test(trimmed)) return null;
  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    if (!/^[a-z0-9.-]+\.[a-z]{2,}/i.test(candidate)) return null;
    candidate = `https://${candidate}`;
  }
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

function hostIs(url: URL, hosts: string[]): boolean {
  const host = url.hostname.toLowerCase();
  return hosts.some((allowed) => host === allowed);
}

function spec(
  provider: EmbedProvider,
  embedUrl: string,
  sourceUrl: string,
  aspect: EmbedAspect = "16/9",
): EmbedSpec {
  return {
    provider,
    label: PROVIDER_LABELS[provider],
    embedUrl,
    sourceUrl,
    aspect,
  };
}

function parseYouTube(url: URL): EmbedSpec | null {
  if (!hostIs(url, ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"])) {
    return null;
  }
  let id: string | null = null;
  if (url.hostname === "youtu.be") {
    id = url.pathname.split("/").filter(Boolean)[0] ?? null;
  } else {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "watch") id = url.searchParams.get("v");
    else if (parts[0] === "shorts" || parts[0] === "embed" || parts[0] === "live") {
      id = parts[1] ?? null;
    }
  }
  if (!id || !/^[\w-]{11}$/.test(id)) return null;
  return spec(
    "youtube",
    `https://www.youtube-nocookie.com/embed/${id}`,
    url.toString(),
  );
}

function parseVimeo(url: URL): EmbedSpec | null {
  if (!hostIs(url, ["vimeo.com", "www.vimeo.com", "player.vimeo.com"])) return null;
  const id = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part));
  if (!id) return null;
  return spec("vimeo", `https://player.vimeo.com/video/${id}`, url.toString());
}

function parseScratch(url: URL): EmbedSpec | null {
  if (!hostIs(url, ["scratch.mit.edu"])) return null;
  const match = url.pathname.match(/^\/projects\/(\d+)/);
  if (!match) return null;
  return spec(
    "scratch",
    `https://scratch.mit.edu/projects/${match[1]}/embed`,
    url.toString(),
    "4/3",
  );
}

function parseTinkercad(url: URL): EmbedSpec | null {
  if (!hostIs(url, ["tinkercad.com", "www.tinkercad.com"])) return null;
  const thing = url.pathname.match(/^\/things\/([A-Za-z0-9]+)/);
  const embed = url.pathname.match(/^\/embed\/([A-Za-z0-9]+)/);
  const id = thing?.[1] ?? embed?.[1];
  if (!id) return null;
  return spec("tinkercad", `https://www.tinkercad.com/embed/${id}`, url.toString());
}

function parseWokwi(url: URL): EmbedSpec | null {
  if (!hostIs(url, ["wokwi.com", "www.wokwi.com"])) return null;
  const match = url.pathname.match(/^\/projects\/(\d+)/);
  if (!match) return null;
  return spec(
    "wokwi",
    `https://wokwi.com/projects/${match[1]}/embed`,
    url.toString(),
  );
}

function parseP5(url: URL): EmbedSpec | null {
  if (!hostIs(url, ["editor.p5js.org"])) return null;
  const match = url.pathname.match(/^\/([^/]+)\/(?:sketches|full|present|embed)\/([^/]+)/);
  if (!match) return null;
  return spec(
    "p5js",
    `https://editor.p5js.org/${match[1]}/full/${match[2]}`,
    url.toString(),
  );
}

function parseCodePen(url: URL): EmbedSpec | null {
  if (!hostIs(url, ["codepen.io", "www.codepen.io"])) return null;
  const match = url.pathname.match(/^\/([^/]+)\/(?:pen|embed|full)\/([^/]+)/);
  if (!match) return null;
  return spec(
    "codepen",
    `https://codepen.io/${match[1]}/embed/${match[2]}?default-tab=result`,
    url.toString(),
  );
}

function parseFigma(url: URL): EmbedSpec | null {
  if (!hostIs(url, ["figma.com", "www.figma.com"])) return null;
  if (!/^\/(file|design|proto|board)\//.test(url.pathname)) return null;
  return spec(
    "figma",
    `https://www.figma.com/embed?embed_host=oboxsteam&url=${encodeURIComponent(url.toString())}`,
    url.toString(),
  );
}

function parseCanva(url: URL): EmbedSpec | null {
  if (!hostIs(url, ["canva.com", "www.canva.com"])) return null;
  if (!url.pathname.includes("/view")) return null;
  const embed = new URL(url.toString());
  embed.searchParams.set("embed", "");
  return spec("canva", embed.toString(), url.toString());
}

function parseSlides(url: URL): EmbedSpec | null {
  if (!hostIs(url, ["docs.google.com"])) return null;
  const match = url.pathname.match(
    /^\/presentation\/d\/e\/([A-Za-z0-9_-]+)\/(?:pub|embed)/,
  );
  if (!match) return null;
  return spec(
    "google-slides",
    `https://docs.google.com/presentation/d/e/${match[1]}/embed`,
    url.toString(),
  );
}

const PARSERS = [
  parseYouTube,
  parseVimeo,
  parseScratch,
  parseTinkercad,
  parseWokwi,
  parseP5,
  parseCodePen,
  parseFigma,
  parseCanva,
  parseSlides,
];

/** Turn a pasted product URL into a sandboxed embed. Returns null when unsupported. */
export function parseEmbedSource(value: string | null | undefined): EmbedSpec | null {
  if (!value) return null;
  const url = httpsUrl(stripEmbedSource(value));
  if (!url) return null;
  for (const parse of PARSERS) {
    const result = parse(url);
    if (result) return result;
  }
  return null;
}
