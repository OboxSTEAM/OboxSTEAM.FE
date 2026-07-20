import Link from "next/link";
import { ChevronRight, Trophy } from "lucide-react";

import type { CertificateListItem } from "@/lib/api/entities/certificate";
import { getCertificateVerifyHref } from "@/lib/certificates/format";
import { cn } from "@/lib/utils";

type CertificateCongratsBoxProps = {
  certificate: CertificateListItem;
  className?: string;
};

/** Soft confetti speckles — Obox Yellow + STEAM accents. */
const CELEBRATE_PATTERN = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72" fill="none">
    <circle cx="10" cy="14" r="2.2" fill="#FDD835" fill-opacity="0.55"/>
    <circle cx="28" cy="8" r="1.4" fill="#E94B3C" fill-opacity="0.35"/>
    <circle cx="52" cy="18" r="1.8" fill="#7CB342" fill-opacity="0.4"/>
    <circle cx="64" cy="10" r="1.2" fill="#4FC3F7" fill-opacity="0.45"/>
    <rect x="18" y="30" width="3.5" height="3.5" rx="0.8" transform="rotate(18 18 30)" fill="#FDD835" fill-opacity="0.5"/>
    <rect x="44" y="36" width="2.8" height="2.8" rx="0.6" transform="rotate(-22 44 36)" fill="#E94B3C" fill-opacity="0.3"/>
    <circle cx="12" cy="48" r="1.5" fill="#7E57C2" fill-opacity="0.35"/>
    <circle cx="36" cy="54" r="2" fill="#FDD835" fill-opacity="0.45"/>
    <circle cx="58" cy="50" r="1.3" fill="#4FC3F7" fill-opacity="0.35"/>
    <rect x="62" y="32" width="3" height="3" rx="0.7" transform="rotate(40 62 32)" fill="#7CB342" fill-opacity="0.35"/>
    <circle cx="40" cy="22" r="1.1" fill="#E94B3C" fill-opacity="0.28"/>
  </svg>`,
)}")`;

/**
 * Attached foot strip for an enrollment card — not a separate tile.
 * Render flush under the card inside a shared rounded shell.
 */
export function CertificateCongratsBox({
  certificate,
  className,
}: CertificateCongratsBoxProps) {
  if (!certificate.code?.trim()) return null;

  const href = getCertificateVerifyHref(certificate.code);

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-2.5 overflow-hidden border-t border-[#F0C850]/50 px-4 py-2.5",
        "bg-gradient-to-r from-[#FFF8E1] via-[#FFF3C4] to-[#FFE8A3]",
        "motion-safe:transition-colors motion-safe:duration-200",
        "hover:from-[#FFF4D0] hover:via-[#FFEEC0] hover:to-[#FFE08A]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4FC3F7]",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          backgroundImage: CELEBRATE_PATTERN,
          backgroundSize: "72px 72px",
        }}
      />

      <span className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FDD835] to-[#F5C518] text-[#6B5200] shadow-sm ring-1 ring-[#E0B800]/35">
        <Trophy className="size-4" strokeWidth={2.25} aria-hidden />
      </span>

      <span className="relative min-w-0 flex-1">
        <span className="font-heading block truncate text-xs font-bold text-[#2D2D2D] sm:text-[13px]">
          Chúc mừng! Bạn đã nhận chứng chỉ
        </span>
      </span>

      <span className="relative inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-[#8a6d00] group-hover:text-[#2D2D2D]">
        Xem
        <ChevronRight className="size-3.5" aria-hidden />
      </span>
    </Link>
  );
}
