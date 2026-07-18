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
    <section className={cn("border-t border-[#E5E5E0] pt-4", className)}>
      <div className="mb-2 flex items-center gap-2.5">
        <span
          className={cn(
            "inline-flex size-7 shrink-0 items-center justify-center rounded-full",
            tone === "neutral" && "bg-[#F5F5F0] text-[#6B6B6B]",
            tone === "accent" && "bg-[#4FC3F7]/12 text-[#2ea8d8]",
            tone === "highlight" && "bg-[#FDD835]/20 text-[#8a7200]",
          )}
        >
          <Icon className="size-3.5" aria-hidden />
        </span>
        <h3 className="font-heading text-sm font-semibold text-[#2D2D2D]">
          {title}
        </h3>
      </div>
      <div
        className={cn(
          tone === "accent" && "border-l-2 border-[#4FC3F7]/45 pl-3",
          tone === "highlight" && "border-l-2 border-[#FDD835]/60 pl-3",
        )}
      >
        {children}
      </div>
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
    <div className={cn("flex items-start gap-4", className)}>
      <Avatar className="size-20 shrink-0 ring-2 ring-[#E5E5E0] sm:size-24">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
        <AvatarFallback className="bg-[#F5F5F0] text-lg font-semibold text-[#6B6B6B]">
          {getExpertInitials(fullName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-heading text-lg font-bold leading-tight text-[#2D2D2D] sm:text-xl">
            {fullName}
          </p>
          <p className="text-sm font-medium text-[#4A4A4A]">{title}</p>
          <p className="text-sm text-[#6B6B6B]">{organization}</p>
          {code ? (
            <p className="font-mono text-[11px] uppercase tracking-widest text-[#6B6B6B]/75">
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

  const hasBio = Boolean(expert.bio);
  const hasAchievements = Boolean(expert.achievements);

  return (
    <div className={cn("space-y-4", className)}>
      <ExpertIdentityHeader
        fullName={expert.fullName}
        title={expert.title}
        organization={expert.organization}
        code={expert.code}
        avatarUrl={avatarUrl}
        linkedInUrl={expert.linkedInUrl}
      />

      {hasBio || hasAchievements ? (
        <div
          className={cn(
            "grid gap-4",
            hasBio && hasAchievements && "sm:grid-cols-2",
          )}
        >
          {hasBio ? (
            <ProfileSection title="Giới thiệu" icon={UserRound}>
              <p className="text-sm leading-relaxed whitespace-pre-line text-[#6B6B6B]">
                {expert.bio}
              </p>
            </ProfileSection>
          ) : null}

          {hasAchievements ? (
            <ProfileSection title="Thành tựu" icon={Award} tone="highlight">
              <p className="text-sm leading-relaxed text-[#2D2D2D]">
                {expert.achievements}
              </p>
            </ProfileSection>
          ) : null}
        </div>
      ) : null}

      {currentProgram ? (
        <ProfileSection title="Vai trò hiện tại" icon={Sparkles} tone="accent">
          <p className="text-sm font-medium text-[#2D2D2D]">
            {currentProgram.name}
            <span className="font-normal text-[#6B6B6B]">
              {" "}
              · {currentProgram.roleInBoard}
            </span>
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
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {otherPrograms.map((item) => (
              <li key={item.programId}>
                <Link
                  href={`/programs/${item.programId}`}
                  className="group inline-flex max-w-full flex-col rounded-md px-1.5 py-0.5 text-sm transition-colors hover:bg-[#4FC3F7]/10"
                >
                  <span className="truncate font-medium text-[#4FC3F7] transition-colors group-hover:text-[#0D6E9C]">
                    {item.name}
                  </span>
                  <span className="truncate text-xs text-[#6B6B6B]">
                    {item.code} · {item.roleInBoard}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </ProfileSection>
      ) : null}
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
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="size-20 shrink-0 animate-pulse rounded-full bg-[#F5F5F0] sm:size-24" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-5 w-48 animate-pulse rounded bg-[#F5F5F0]" />
          <div className="h-4 w-36 animate-pulse rounded bg-[#F5F5F0]" />
          <div className="h-4 w-28 animate-pulse rounded bg-[#F5F5F0]" />
        </div>
      </div>
      <div className="border-t border-[#E5E5E0] pt-4">
        <div className="mb-2 flex items-center gap-2.5">
          <div className="size-7 animate-pulse rounded-full bg-[#F5F5F0]" />
          <div className="h-4 w-24 animate-pulse rounded bg-[#F5F5F0]" />
        </div>
        <div className="space-y-2">
          <div className="h-3.5 w-full animate-pulse rounded bg-[#F5F5F0]" />
          <div className="h-3.5 w-[90%] animate-pulse rounded bg-[#F5F5F0]" />
        </div>
      </div>
    </div>
  );
}
