"use client";

import type { ComponentType } from "react";
import { Globe, Mail } from "lucide-react";
import { FaLinkedin } from "react-icons/fa6";
import {
  SiBehance,
  SiDiscord,
  SiDribbble,
  SiFacebook,
  SiFigma,
  SiGithub,
  SiInstagram,
  SiMedium,
  SiTiktok,
  SiX,
  SiYoutube,
} from "react-icons/si";

import {
  getPortfolioLinkPlatform,
  resolvePortfolioLinkPlatform,
  type PortfolioLinkPlatformId,
} from "@/lib/portfolio/links";
import { cn } from "@/lib/utils";

type IconProps = { className?: string; size?: number };
type IconComponent = ComponentType<IconProps>;

const PLATFORM_ICONS: Record<PortfolioLinkPlatformId, IconComponent> = {
  github: SiGithub,
  linkedin: FaLinkedin,
  behance: SiBehance,
  youtube: SiYoutube,
  instagram: SiInstagram,
  facebook: SiFacebook,
  x: SiX,
  dribbble: SiDribbble,
  figma: SiFigma,
  tiktok: SiTiktok,
  discord: SiDiscord,
  medium: SiMedium,
  email: Mail,
  website: Globe,
};

type PortfolioLinkIconProps = {
  url?: string | null;
  label?: string | null;
  platformId?: PortfolioLinkPlatformId;
  className?: string;
  /** Pixel size for the SVG. */
  size?: number;
};

export function PortfolioLinkIcon({
  url,
  label,
  platformId,
  className,
  size = 18,
}: PortfolioLinkIconProps) {
  const resolvedId =
    platformId ?? resolvePortfolioLinkPlatform(url, label).id;
  const Icon = PLATFORM_ICONS[resolvedId] ?? Globe;

  return <Icon aria-hidden size={size} className={cn("shrink-0", className)} />;
}

export function getPortfolioLinkAccent(
  url?: string | null,
  label?: string | null,
  platformId?: PortfolioLinkPlatformId,
): string {
  const id = platformId ?? resolvePortfolioLinkPlatform(url, label).id;
  return getPortfolioLinkPlatform(id).accent;
}
