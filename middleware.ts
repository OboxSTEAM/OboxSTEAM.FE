import { NextResponse, type NextRequest } from "next/server";

import {
  extractPortfolioSubdomainFromHost,
  getPortfolioRootDomain,
} from "@/lib/portfolio/url";

/**
 * Rewrites `{subdomain}.{NEXT_PUBLIC_ROOT_DOMAIN}` to `/p/{subdomain}` so the
 * public portfolio RSC page can render server-side (no browser CORS).
 *
 * Local: set NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000 and visit alice.localhost:3000
 * Prod: wildcard DNS `*.rootdomain` → this app; set NEXT_PUBLIC_ROOT_DOMAIN.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host");
  const subdomain = extractPortfolioSubdomainFromHost(
    host,
    getPortfolioRootDomain(),
  );

  if (!subdomain) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  // Avoid double-prefix if already on the internal path
  if (url.pathname === `/p/${subdomain}` || url.pathname.startsWith(`/p/${subdomain}/`)) {
    return NextResponse.next();
  }

  url.pathname =
    url.pathname === "/"
      ? `/p/${encodeURIComponent(subdomain)}`
      : `/p/${encodeURIComponent(subdomain)}${url.pathname}`;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match page navigations only — skip Next internals, static assets, and API.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$|api/).*)",
  ],
};
