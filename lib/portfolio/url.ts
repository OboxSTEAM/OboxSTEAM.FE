import { RESERVED_PORTFOLIO_SUBDOMAINS } from "@/lib/portfolio/constants";

/** Root domain for Host parsing and canonical public URLs (no protocol). */
export function getPortfolioRootDomain(): string {
  return (
    process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim() ||
    process.env.NEXT_PUBLIC_APP_DOMAIN?.trim() ||
    "localhost:3000"
  );
}

export function isReservedPortfolioSubdomain(subdomain: string): boolean {
  return (RESERVED_PORTFOLIO_SUBDOMAINS as readonly string[]).includes(
    subdomain.toLowerCase(),
  );
}

/**
 * Extract portfolio subdomain from a Host header value.
 * Returns null for apex, reserved labels, or unmatched hosts.
 */
export function extractPortfolioSubdomainFromHost(
  hostHeader: string | null,
  rootDomain = getPortfolioRootDomain(),
): string | null {
  if (!hostHeader) return null;

  const host = hostHeader.split(":")[0]?.toLowerCase() ?? "";
  const rootHost = rootDomain.split(":")[0]?.toLowerCase() ?? "";

  if (!host || !rootHost) return null;
  if (host === rootHost || host === `www.${rootHost}`) return null;

  const suffix = `.${rootHost}`;
  if (!host.endsWith(suffix)) return null;

  const subdomain = host.slice(0, -suffix.length);
  if (!subdomain || subdomain.includes(".")) return null;
  if (isReservedPortfolioSubdomain(subdomain)) return null;

  return subdomain;
}

/** Canonical public URL for a claimed subdomain (uses https except localhost). */
export function buildPortfolioPublicUrl(subdomain: string): string {
  const root = getPortfolioRootDomain();
  const isLocal =
    root.startsWith("localhost") ||
    root.startsWith("127.0.0.1") ||
    root.includes("localhost");
  const protocol = isLocal ? "http" : "https";
  return `${protocol}://${subdomain}.${root}`;
}

/** Always-works path fallback (no DNS/wildcard needed). */
export function buildPortfolioPathUrl(subdomain: string): string {
  return `/p/${encodeURIComponent(subdomain)}`;
}
