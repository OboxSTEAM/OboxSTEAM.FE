"use client";

import type { ReactNode } from "react";
import {
  Award,
  ExternalLink,
  GraduationCap,
  Sparkles,
  UserRound,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type {
  Mentor,
  MentorSkill,
  SkillCategory,
  SkillProficiencyLevel,
} from "@/lib/api/entities/mentor";
import {
  getExpertAvatarUrl,
  getExpertInitials,
} from "@/lib/programs/format";
import { cn } from "@/lib/utils";

const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  Science: "Science",
  Technology: "Technology",
  Engineering: "Engineering",
  Arts: "Arts",
  Math: "Math",
  SoftSkill: "Soft skill",
};

const PROFICIENCY_LABELS: Record<SkillProficiencyLevel, string> = {
  Beginner: "Cơ bản",
  Intermediate: "Trung cấp",
  Advanced: "Nâng cao",
  Expert: "Chuyên gia",
};

type MentorProfileContentProps = {
  mentor: Mentor;
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

function MentorIdentityHeader({
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
  code?: string | null;
  avatarUrl: string | null;
  linkedInUrl?: string | null;
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
          {title ? (
            <p className="text-sm font-medium text-[#4A4A4A]">{title}</p>
          ) : null}
          {organization ? (
            <p className="text-sm text-[#6B6B6B]">{organization}</p>
          ) : null}
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

function SkillList({ skills }: { skills: MentorSkill[] }) {
  if (skills.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {skills.map((item) => {
        const skillName = item.skill?.name?.trim() || item.skill?.code || "Kỹ năng";
        const category = item.skill?.category
          ? SKILL_CATEGORY_LABELS[item.skill.category]
          : null;

        return (
          <li
            key={item.id}
            className="inline-flex max-w-full flex-col rounded-lg border border-[#E5E5E0] bg-[#FAFAF5] px-2.5 py-1.5"
          >
            <span className="truncate text-sm font-medium text-[#2D2D2D]">
              {skillName}
            </span>
            <span className="truncate text-[11px] text-[#6B6B6B]">
              {[
                category,
                PROFICIENCY_LABELS[item.proficiencyLevel],
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function MentorProfileContent({
  mentor,
  className,
}: MentorProfileContentProps) {
  const displayName =
    mentor.fullName?.trim() || mentor.email?.trim() || "Mentor";
  const avatarUrl = getExpertAvatarUrl(mentor.avatarUrl);
  const title = mentor.title?.trim() ?? "";
  const organization = mentor.organization?.trim() ?? "";
  const hasBio = Boolean(mentor.bio?.trim());
  const hasAchievements = Boolean(mentor.achievements?.trim());
  const skills = mentor.skills ?? [];

  return (
    <div className={cn("space-y-4", className)}>
      <MentorIdentityHeader
        fullName={displayName}
        title={title}
        organization={organization}
        code={mentor.code}
        avatarUrl={avatarUrl}
        linkedInUrl={mentor.linkedInUrl}
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
                {mentor.bio}
              </p>
            </ProfileSection>
          ) : null}

          {hasAchievements ? (
            <ProfileSection title="Thành tựu" icon={Award} tone="highlight">
              <p className="text-sm leading-relaxed text-[#2D2D2D]">
                {mentor.achievements}
              </p>
            </ProfileSection>
          ) : null}
        </div>
      ) : null}

      {skills.length > 0 ? (
        <ProfileSection title="Kỹ năng" icon={Sparkles} tone="accent">
          <SkillList skills={skills} />
        </ProfileSection>
      ) : null}

      <ProfileSection title="Vai trò" icon={GraduationCap}>
        <p className="text-sm font-medium text-[#2D2D2D]">
          Mentor phụ trách lớp
        </p>
      </ProfileSection>
    </div>
  );
}

export function MentorProfilePreview({
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
  code?: string | null;
  className?: string;
}) {
  return (
    <MentorIdentityHeader
      fullName={fullName}
      title={title}
      organization={organization}
      code={code}
      avatarUrl={avatarUrl}
      className={className}
    />
  );
}

export function MentorProfileSkeleton() {
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
