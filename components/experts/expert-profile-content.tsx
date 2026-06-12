import type { ReactNode } from "react";
import Link from "next/link";
import { Award, BookOpen, ExternalLink, Sparkles, UserRound } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Expert, ExpertProgram } from "@/lib/api/entities/expert";
import {
  getExpertAvatarUrl,
  getExpertInitials,
} from "@/lib/programs/format";
import { cn } from "@/lib/utils";

type ExpertProfileContentProps = {
  expert: Expert;
  currentProgramId?: string;
  className?: string;
};

function formatExpertDate(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function isUsableExternalUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function sortExpertPrograms(
  programs: ExpertProgram[],
  currentProgramId?: string,
): ExpertProgram[] {
  if (!currentProgramId) return programs;

  return [...programs].sort((left, right) => {
    if (left.programId === currentProgramId) return -1;
    if (right.programId === currentProgramId) return 1;
    return left.name.localeCompare(right.name, "vi");
  });
}

function ProfileSection({
  title,
  icon: Icon,
  children,
  tone = "neutral",
  className,
}: {
  title: string;
  icon: typeof UserRound;
  children: ReactNode;
  tone?: "neutral" | "accent" | "highlight";
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border p-3.5",
        tone === "neutral" && "border-[#E5E5E0] bg-white",
        tone === "accent" && "border-[#4FC3F7]/35 bg-[#4FC3F7]/[0.06]",
        tone === "highlight" && "border-[#FDD835]/50 bg-[#FDD835]/[0.08]",
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            "inline-flex size-6 shrink-0 items-center justify-center rounded-md",
            tone === "neutral" && "bg-[#F5F5F0] text-[#6B6B6B]",
            tone === "accent" && "bg-[#4FC3F7]/15 text-[#2ea8d8]",
            tone === "highlight" && "bg-[#FDD835]/25 text-[#8a7200]",
          )}
        >
          <Icon className="size-3.5" aria-hidden />
        </span>
        <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-[#2D2D2D]">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

function ExpertIdentityHeader({
  fullName,
  title,
  organization,
  code,
  avatarUrl,
  linkedInUrl,
  className,
}: {
  fullName: string;
  title: string;
  organization: string;
  code?: string;
  avatarUrl: string | null;
  linkedInUrl?: string;
  className?: string;
}) {
  const hasLinkedIn = isUsableExternalUrl(linkedInUrl);

  return (
    <div className={cn("flex items-start gap-4 sm:gap-5", className)}>
      <Avatar className="size-24 shrink-0 ring-2 ring-[#E5E5E0] sm:size-28">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
        <AvatarFallback className="bg-[#F5F5F0] text-xl font-semibold text-[#6B6B6B]">
          {getExpertInitials(fullName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p className="font-heading text-lg font-bold leading-tight text-[#2D2D2D] sm:text-xl">
            {fullName}
          </p>
          <p className="text-sm font-medium text-[#4A4A4A]">{title}</p>
          <p className="text-sm text-[#6B6B6B]">{organization}</p>
          {code ? (
            <p className="pt-0.5 font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B]/75">
              {code}
            </p>
          ) : null}
        </div>

        {hasLinkedIn && linkedInUrl ? (
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "shrink-0 gap-1.5",
            })}
          >
            LinkedIn
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function ExpertProfileContent({
  expert,
  currentProgramId,
  className,
}: ExpertProfileContentProps) {
  const avatarUrl = getExpertAvatarUrl(expert.avatarUrl);
  const programs = sortExpertPrograms(expert.programs, currentProgramId);
  const currentProgram = currentProgramId
    ? programs.find((item) => item.programId === currentProgramId)
    : undefined;
  const otherPrograms = currentProgramId
    ? programs.filter((item) => item.programId !== currentProgramId)
    : programs;

  return (
    <div className={cn("space-y-3", className)}>
      <ExpertIdentityHeader
        fullName={expert.fullName}
        title={expert.title}
        organization={expert.organization}
        code={expert.code}
        avatarUrl={avatarUrl}
        linkedInUrl={expert.linkedInUrl}
      />

      {(expert.bio || expert.achievements) && (
        <div
          className={cn(
            "grid gap-3",
            expert.bio && expert.achievements && "sm:grid-cols-2",
          )}
        >
          {expert.bio ? (
            <ProfileSection title="Giới thiệu" icon={UserRound}>
              <p className="text-sm leading-relaxed whitespace-pre-line text-[#6B6B6B]">
                {expert.bio}
              </p>
            </ProfileSection>
          ) : null}

          {expert.achievements ? (
            <ProfileSection title="Thành tựu" icon={Award} tone="highlight">
              <p className="text-sm leading-relaxed text-[#2D2D2D]">
                {expert.achievements}
              </p>
            </ProfileSection>
          ) : null}
        </div>
      )}

      {currentProgram ? (
        <ProfileSection
          title="Vai trò trong chương trình này"
          icon={Sparkles}
          tone="accent"
        >
          <p className="text-sm font-medium text-[#2D2D2D]">
            {currentProgram.name}
          </p>
          <p className="mt-0.5 text-xs text-[#6B6B6B]">
            {currentProgram.roleInBoard}
          </p>
        </ProfileSection>
      ) : null}

      {otherPrograms.length > 0 ? (
        <ProfileSection
          title={
            currentProgram ? "Chương trình khác" : "Chương trình tham gia"
          }
          icon={BookOpen}
        >
          <ul className="grid gap-2 sm:grid-cols-2">
            {otherPrograms.map((item) => (
              <li key={item.programId}>
                <Link
                  href={`/programs/${item.programId}`}
                  className="block rounded-lg border border-[#E5E5E0] bg-[#FAFAF5] px-3 py-2 transition-colors hover:border-[#4FC3F7]/40 hover:bg-white"
                >
                  <span className="line-clamp-2 text-sm font-medium leading-snug text-[#4FC3F7]">
                    {item.name}
                  </span>
                  <span className="mt-1 block text-[11px] text-[#6B6B6B]">
                    {item.code} · {item.roleInBoard}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </ProfileSection>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border border-dashed border-[#E5E5E0] bg-[#FAFAF5]/80 px-3 py-2 text-[11px] text-[#6B6B6B]">
        <span>Cập nhật {formatExpertDate(expert.updatedAt)}</span>
        <span>Tham gia {formatExpertDate(expert.createdAt)}</span>
      </div>
    </div>
  );
}

export function ExpertProfilePreview({
  fullName,
  title,
  organization,
  avatarUrl,
  code,
  className,
}: {
  fullName: string;
  title: string;
  organization: string;
  avatarUrl: string | null;
  code?: string;
  className?: string;
}) {
  return (
    <ExpertIdentityHeader
      fullName={fullName}
      title={title}
      organization={organization}
      code={code}
      avatarUrl={avatarUrl}
      className={className}
    />
  );
}

export function ExpertProfileSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4">
        <div className="size-24 shrink-0 animate-pulse rounded-full bg-[#F5F5F0] sm:size-28" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-5 w-44 animate-pulse rounded bg-[#F5F5F0]" />
          <div className="h-4 w-36 animate-pulse rounded bg-[#F5F5F0]" />
          <div className="h-4 w-28 animate-pulse rounded bg-[#F5F5F0]" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-24 animate-pulse rounded-xl border border-[#E5E5E0] bg-[#F5F5F0]/60" />
        <div className="h-24 animate-pulse rounded-xl border border-[#E5E5E0] bg-[#F5F5F0]/60" />
      </div>
    </div>
  );
}
