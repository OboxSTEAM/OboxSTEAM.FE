import type { LucideIcon } from "lucide-react";
import { GraduationCap, LayoutDashboard } from "lucide-react";

import type { StaggeredMenuItem } from "@/components/StaggeredMenu";
import { getAccountNavItems, LOGOUT_NAV_ITEM } from "@/lib/auth/account-nav";
import { NAV_LINKS } from "@/lib/landing/content";

const WEBSITE_ICON_MAP: Record<string, LucideIcon> = {
  Portfolio: LayoutDashboard,
  "Chương trình": GraduationCap,
};

export const STAGGERED_MENU_WARM_COLORS = ["#F5F5F0", "#EDEDE8"] as const;

export type BuildSiteHeaderStaggeredMenuOptions = {
  accountRole?: string | null;
  onLogout: () => void;
};

/** Account + site nav + logout for the logged-in site header StaggeredMenu. */
export function buildSiteHeaderStaggeredMenuItems({
  accountRole,
  onLogout,
}: BuildSiteHeaderStaggeredMenuOptions): StaggeredMenuItem[] {
  const accountItems = getAccountNavItems(accountRole).map((item) => ({
    label: item.label,
    ariaLabel: item.label,
    link: item.href,
    icon: item.icon,
    description: item.description,
    group: "Tài khoản",
  }));

  const siteNavItems: StaggeredMenuItem[] = NAV_LINKS.filter(
    (link) => link.label !== "STEAM",
  ).map((link) => ({
    label: link.label,
    ariaLabel: link.label,
    link: link.href,
    icon: WEBSITE_ICON_MAP[link.label],
    group: "Khám phá",
  }));

  const logoutItem: StaggeredMenuItem = {
    label: LOGOUT_NAV_ITEM.label,
    ariaLabel: LOGOUT_NAV_ITEM.label,
    icon: LOGOUT_NAV_ITEM.icon,
    footer: true,
    onClick: onLogout,
  };

  return [...accountItems, ...siteNavItems, logoutItem];
}

export type BuildCurriculumStaggeredMenuOptions = {
  items: Array<{
    label: string;
    href: string;
    icon?: LucideIcon;
    description?: string;
  }>;
  group?: string;
};

/** Curriculum page nav — reuse StaggeredMenu with the same toned-down styling. */
export function buildCurriculumStaggeredMenuItems({
  items,
  group = "Chương trình",
}: BuildCurriculumStaggeredMenuOptions): StaggeredMenuItem[] {
  return items.map((item) => ({
    label: item.label,
    ariaLabel: item.label,
    link: item.href,
    icon: item.icon,
    description: item.description,
    group,
  }));
}
