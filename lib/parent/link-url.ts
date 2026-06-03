export type ParentLinkConfirmVariant = "magic-login" | "approve-link";

export const PARENT_LINK_PATHS = {
  "magic-login": "/magic-login",
  "approve-link": "/approve-link",
} as const;

export type ParentLinkPath = (typeof PARENT_LINK_PATHS)[keyof typeof PARENT_LINK_PATHS];

export function parentLinkPathToVariant(path: ParentLinkPath): ParentLinkConfirmVariant {
  return path === PARENT_LINK_PATHS["approve-link"] ? "approve-link" : "magic-login";
}

export function isParentLinkPath(pathname: string): pathname is ParentLinkPath {
  return pathname === PARENT_LINK_PATHS["magic-login"] || pathname === PARENT_LINK_PATHS["approve-link"];
}

/** Build `/magic-login` or `/approve-link` with email + token query params. */
export function buildParentLinkUrl(
  path: ParentLinkPath,
  email: string,
  token: string,
): string {
  const params = new URLSearchParams({ email, token });
  return `${path}?${params.toString()}`;
}

type ParsedParentLinkReturn = {
  path: ParentLinkPath;
  email: string | null;
  token: string | null;
};

/**
 * Parse `returnUrl` from login (may include nested `?email=&token=`).
 * Falls back to top-level `email` / `token` when the return path was split by a bare `?`.
 */
export function parseParentLinkReturnUrl(
  returnUrl: string | null | undefined,
  extra?: { email?: string | null; token?: string | null },
): ParsedParentLinkReturn | null {
  if (!returnUrl || !returnUrl.startsWith("/") || returnUrl.startsWith("//")) {
    return null;
  }

  const pathOnly = returnUrl.split("?")[0] as ParentLinkPath;
  if (!isParentLinkPath(pathOnly)) {
    return null;
  }

  const query = returnUrl.includes("?") ? returnUrl.slice(returnUrl.indexOf("?") + 1) : "";
  const nested = new URLSearchParams(query);

  const email = nested.get("email") ?? extra?.email ?? null;
  const token = nested.get("token") ?? extra?.token ?? null;

  return { path: pathOnly, email, token };
}

export function resolveParentLinkDestination(
  returnUrl: string | null | undefined,
  extra?: { email?: string | null; token?: string | null },
): string | null {
  const parsed = parseParentLinkReturnUrl(returnUrl, extra);
  if (!parsed) return null;
  if (!parsed.email || !parsed.token) {
    return parsed.path;
  }
  return buildParentLinkUrl(parsed.path, parsed.email, parsed.token);
}

export function resolveLoginAuthPageKey(
  returnUrl: string | null | undefined,
): "login" | "approve-link" | "magic-login" {
  const parsed = parseParentLinkReturnUrl(returnUrl);
  if (!parsed) return "login";
  return parentLinkPathToVariant(parsed.path);
}
