import type { LucideIcon } from "lucide-react";
import { GraduationCap } from "lucide-react";

import { getAccountNavItems, LOGOUT_NAV_ITEM } from "@/lib/auth/account-nav";
import { NAV_LINKS } from "@/lib/landing/content";

export type AccountNavItem = {
  label: string;
  ariaLabel: string;
  link?: string;
  onClick?: () => void;
  icon?: LucideIcon;
  /** Section label — rendered when the group changes from the previous item. */
  group?: string;
  /** Muted subtext shown below the label. */
  description?: string;
  /** Pin to panel footer with emphasized styling (e.g. logout). */
  footer?: boolean;
};

const WEBSITE_ICON_MAP: Record<string, LucideIcon> = {
  "Chương trình": GraduationCap,
};

/** Hidden from account sheet — still available elsewhere if needed. */
const ACCOUNT_SHEET_EXCLUDED_HREFS = new Set(["/settings"]);

const ACCOUNT_SHEET_EXCLUDED_SITE_LABELS = new Set(["Portfolio"]);

export type BuildSiteHeaderAccountNavOptions = {
  accountRole?: string | null;
  onLogout: () => void;
};

/** Account + site nav + logout for the logged-in site header account sheet. */
export function buildSiteHeaderAccountNavItems({
  accountRole,
  onLogout,
}: BuildSiteHeaderAccountNavOptions): AccountNavItem[] {
  const accountItems = getAccountNavItems(accountRole)
    .filter((item) => !ACCOUNT_SHEET_EXCLUDED_HREFS.has(item.href))
    .map((item) => ({
      label: item.label,
      ariaLabel: item.label,
      link: item.href,
      icon: item.icon,
      description: item.description,
      group: "Tài khoản",
    }));

  const siteNavItems: AccountNavItem[] = NAV_LINKS.filter(
    (link) =>
      link.label !== "STEAM" &&
      !ACCOUNT_SHEET_EXCLUDED_SITE_LABELS.has(link.label),
  ).map((link) => ({
    label: link.label,
    ariaLabel: link.label,
    link: link.href,
    icon: WEBSITE_ICON_MAP[link.label],
    group: "Khám phá",
  }));

  const logoutItem: AccountNavItem = {
    label: LOGOUT_NAV_ITEM.label,
    ariaLabel: LOGOUT_NAV_ITEM.label,
    icon: LOGOUT_NAV_ITEM.icon,
    footer: true,
    onClick: onLogout,
  };

  return [...accountItems, ...siteNavItems, logoutItem];
}
