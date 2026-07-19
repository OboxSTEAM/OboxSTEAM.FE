/** FE-only portfolio link platforms — icons resolved from URL/label (no BE icon field). */

export const PORTFOLIO_LINK_PLATFORM_IDS = [
  "github",
  "linkedin",
  "behance",
  "youtube",
  "instagram",
  "facebook",
  "x",
  "dribbble",
  "figma",
  "tiktok",
  "discord",
  "medium",
  "email",
  "website",
] as const;

export type PortfolioLinkPlatformId =
  (typeof PORTFOLIO_LINK_PLATFORM_IDS)[number];

export type PortfolioLinkPlatform = {
  id: PortfolioLinkPlatformId;
  label: string;
  /** Hosts / path hints used for URL detection (lowercase). */
  hosts: string[];
  /** Extra label keywords (lowercase). */
  keywords: string[];
  /** Suggested URL when adding from preset. */
  urlHint: string;
  /** Soft accent for icon tile (hex). */
  accent: string;
};

export const PORTFOLIO_LINK_PLATFORMS: readonly PortfolioLinkPlatform[] = [
  {
    id: "github",
    label: "GitHub",
    hosts: ["github.com", "www.github.com"],
    keywords: ["github", "git hub"],
    urlHint: "https://github.com/",
    accent: "#24292F",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    hosts: ["linkedin.com", "www.linkedin.com"],
    keywords: ["linkedin", "linked in"],
    urlHint: "https://www.linkedin.com/in/",
    accent: "#0A66C2",
  },
  {
    id: "behance",
    label: "Behance",
    hosts: ["behance.net", "www.behance.net"],
    keywords: ["behance"],
    urlHint: "https://www.behance.net/",
    accent: "#1769FF",
  },
  {
    id: "youtube",
    label: "YouTube",
    hosts: ["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"],
    keywords: ["youtube", "yt"],
    urlHint: "https://www.youtube.com/@",
    accent: "#FF0000",
  },
  {
    id: "instagram",
    label: "Instagram",
    hosts: ["instagram.com", "www.instagram.com"],
    keywords: ["instagram", "ig"],
    urlHint: "https://www.instagram.com/",
    accent: "#E4405F",
  },
  {
    id: "facebook",
    label: "Facebook",
    hosts: ["facebook.com", "www.facebook.com", "fb.com", "www.fb.com"],
    keywords: ["facebook", "fb"],
    urlHint: "https://www.facebook.com/",
    accent: "#1877F2",
  },
  {
    id: "x",
    label: "X",
    hosts: ["x.com", "www.x.com", "twitter.com", "www.twitter.com"],
    keywords: ["twitter", "x.com"],
    urlHint: "https://x.com/",
    accent: "#111111",
  },
  {
    id: "dribbble",
    label: "Dribbble",
    hosts: ["dribbble.com", "www.dribbble.com"],
    keywords: ["dribbble"],
    urlHint: "https://dribbble.com/",
    accent: "#EA4C89",
  },
  {
    id: "figma",
    label: "Figma",
    hosts: ["figma.com", "www.figma.com"],
    keywords: ["figma"],
    urlHint: "https://www.figma.com/",
    accent: "#A259FF",
  },
  {
    id: "tiktok",
    label: "TikTok",
    hosts: ["tiktok.com", "www.tiktok.com"],
    keywords: ["tiktok"],
    urlHint: "https://www.tiktok.com/@",
    accent: "#111111",
  },
  {
    id: "discord",
    label: "Discord",
    hosts: ["discord.com", "www.discord.com", "discord.gg"],
    keywords: ["discord"],
    urlHint: "https://discord.gg/",
    accent: "#5865F2",
  },
  {
    id: "medium",
    label: "Medium",
    hosts: ["medium.com", "www.medium.com"],
    keywords: ["medium"],
    urlHint: "https://medium.com/@",
    accent: "#000000",
  },
  {
    id: "email",
    label: "Email",
    hosts: [],
    keywords: ["email", "mail", "gmail", "e-mail"],
    urlHint: "mailto:",
    accent: "#0f7cad",
  },
  {
    id: "website",
    label: "Website",
    hosts: [],
    keywords: ["website", "web", "portfolio", "site", "blog"],
    urlHint: "https://",
    accent: "#2D2D2D",
  },
] as const;

const PLATFORM_BY_ID = new Map(
  PORTFOLIO_LINK_PLATFORMS.map((platform) => [platform.id, platform]),
);

export function getPortfolioLinkPlatform(
  id: PortfolioLinkPlatformId,
): PortfolioLinkPlatform {
  return PLATFORM_BY_ID.get(id) ?? PORTFOLIO_LINK_PLATFORMS.at(-1)!;
}

function normalizeHost(hostname: string): string {
  return hostname.replace(/^www\./i, "").toLowerCase();
}

function tryParseUrl(raw: string | null | undefined): URL | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  if (/^mailto:/i.test(trimmed)) {
    try {
      return new URL(trimmed);
    } catch {
      return null;
    }
  }

  try {
    return new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
}

/** Resolve platform from URL first, then label keywords. */
export function resolvePortfolioLinkPlatform(
  url: string | null | undefined,
  label?: string | null,
): PortfolioLinkPlatform {
  const parsed = tryParseUrl(url);

  if (parsed?.protocol === "mailto:") {
    return getPortfolioLinkPlatform("email");
  }

  if (parsed?.hostname) {
    const host = normalizeHost(parsed.hostname);
    const byHost = PORTFOLIO_LINK_PLATFORMS.find((platform) =>
      platform.hosts.some((candidate) => {
        const normalized = normalizeHost(candidate);
        return host === normalized || host.endsWith(`.${normalized}`);
      }),
    );
    if (byHost) return byHost;
  }

  const labelKey = label?.trim().toLowerCase() ?? "";
  if (labelKey) {
    const byLabel = PORTFOLIO_LINK_PLATFORMS.find((platform) =>
      platform.keywords.some(
        (keyword) =>
          labelKey === keyword ||
          labelKey.includes(keyword) ||
          platform.label.toLowerCase() === labelKey,
      ),
    );
    if (byLabel) return byLabel;
  }

  return getPortfolioLinkPlatform("website");
}

/** Short display host for secondary text under the link label. */
export function getPortfolioLinkHostHint(
  url: string | null | undefined,
): string | null {
  const parsed = tryParseUrl(url);
  if (!parsed) return null;
  if (parsed.protocol === "mailto:") {
    return parsed.pathname || parsed.href.replace(/^mailto:/i, "") || null;
  }
  return normalizeHost(parsed.hostname);
}

export function createPortfolioLinkFromPlatform(
  platformId: PortfolioLinkPlatformId,
): { label: string; url: string } {
  const platform = getPortfolioLinkPlatform(platformId);
  return {
    label: platform.label,
    url: platform.urlHint,
  };
}
