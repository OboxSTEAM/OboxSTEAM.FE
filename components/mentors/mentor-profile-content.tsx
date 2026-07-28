"use client";

import type { ReactNode } from "react";
import {
  Award,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  MessageSquareText,
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
import type { SkillSummary } from "@/lib/api/entities/skill";
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

export function getMentorInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "GV";
  return getExpertInitials(name);
}

type MentorProfileContentProps = {
  mentor: Mentor;
  requiredSkills?: SkillSummary[];
  requestMessage?: string | null;
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
    <section className={cn("border-t border-border pt-4", className)}>
      <div className="mb-2 flex items-center gap-2.5">
        <span
          className={cn(
            "inline-flex size-7 shrink-0 items-center justify-center rounded-full",
            tone === "neutral" && "bg-muted text-muted-foreground",
            tone === "accent" && "bg-[#4FC3F7]/12 text-[#2ea8d8] dark:text-[#7dd3fc]",
            tone === "highlight" && "bg-[#FDD835]/20 text-[#8a7200] dark:text-[#fde047]",
          )}
        >
          <Icon className="size-3.5" aria-hidden />
        </span>
        <h3 className="font-heading text-sm font-semibold text-foreground">
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
      <Avatar className="size-20 shrink-0 ring-2 ring-border sm:size-24">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
        <AvatarFallback className="bg-muted text-lg font-semibold text-muted-foreground">
          {getMentorInitials(fullName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-heading text-lg font-bold leading-tight text-foreground sm:text-xl">
            {fullName}
          </p>
          {title ? (
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
          ) : null}
          {organization ? (
            <p className="text-sm text-muted-foreground">{organization}</p>
          ) : null}
          {code ? (
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/75">
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

function SkillList({
  skills,
  requiredSkillIds,
}: {
  skills: MentorSkill[];
  requiredSkillIds: Set<string>;
}) {
  if (skills.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Mentor chưa cập nhật kỹ năng.</p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {skills.map((item) => {
        const skillName =
          item.skill?.name?.trim() || item.skill?.code || "Kỹ năng";
        const category = item.skill?.category
          ? SKILL_CATEGORY_LABELS[item.skill.category]
          : null;
        const isMatch = requiredSkillIds.has(item.skillId);

        return (
          <li
            key={item.id}
            className={cn(
              "inline-flex max-w-full flex-col rounded-lg border px-2.5 py-1.5",
              isMatch
                ? "border-[#7CB342]/35 bg-[#7CB342]/10"
                : "border-border bg-muted",
            )}
          >
            <span
              className={cn(
                "inline-flex items-center gap-1 truncate text-sm font-medium",
                isMatch ? "text-[#3d5c22] dark:text-[#b8e086]" : "text-foreground",
              )}
            >
              {isMatch ? (
                <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
              ) : null}
              {skillName}
            </span>
            <span className="truncate text-[11px] text-muted-foreground">
              {[category, PROFICIENCY_LABELS[item.proficiencyLevel]]
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
  requiredSkills = [],
  requestMessage,
  className,
}: MentorProfileContentProps) {
  const displayName =
    mentor.fullName?.trim() || mentor.email?.trim() || "Mentor";
  const avatarUrl = getExpertAvatarUrl(mentor.avatarUrl);
  const title = mentor.title?.trim() ?? "";
  const organization = mentor.organization?.trim() ?? "";
  const hasBio = Boolean(mentor.bio?.trim());
  const hasAchievements = Boolean(mentor.achievements?.trim());

  const requiredSkillIds = new Set(requiredSkills.map((skill) => skill.id));
  const skills = [...(mentor.skills ?? [])].sort((left, right) => {
    const leftMatch = requiredSkillIds.has(left.skillId) ? 0 : 1;
    const rightMatch = requiredSkillIds.has(right.skillId) ? 0 : 1;
    if (leftMatch !== rightMatch) return leftMatch - rightMatch;
    const leftName = left.skill?.name || left.skill?.code || "";
    const rightName = right.skill?.name || right.skill?.code || "";
    return leftName.localeCompare(rightName, "vi");
  });
  const matchedCount = skills.filter((item) =>
    requiredSkillIds.has(item.skillId),
  ).length;

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
              <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {mentor.bio}
              </p>
            </ProfileSection>
          ) : null}

          {hasAchievements ? (
            <ProfileSection title="Thành tựu" icon={Award} tone="highlight">
              <p className="text-sm leading-relaxed text-foreground">
                {mentor.achievements}
              </p>
            </ProfileSection>
          ) : null}
        </div>
      ) : null}

      {requestMessage ? (
        <ProfileSection title="Lời nhắn xin nhận lớp" icon={MessageSquareText}>
          <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
            {requestMessage}
          </p>
        </ProfileSection>
      ) : null}

      <ProfileSection
        title={
          requiredSkills.length > 0
            ? `Kỹ năng · ${matchedCount}/${requiredSkills.length} khớp lớp`
            : `Kỹ năng${skills.length ? ` · ${skills.length}` : ""}`
        }
        icon={Sparkles}
        tone="accent"
      >
        {requiredSkills.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {requiredSkills.map((skill) => {
              const matched = skills.some((item) => item.skillId === skill.id);
              return (
                <span
                  key={skill.id}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
                    matched
                      ? "bg-[#7CB342]/12 text-[#3d5c22] dark:text-[#b8e086]"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {matched ? (
                    <CheckCircle2 className="size-3" aria-hidden />
                  ) : null}
                  {skill.name || skill.code || "Skill"}
                </span>
              );
            })}
          </div>
        ) : null}
        <SkillList skills={skills} requiredSkillIds={requiredSkillIds} />
      </ProfileSection>

      <ProfileSection title="Vai trò" icon={GraduationCap}>
        <p className="text-sm font-medium text-foreground">
          Mentor phụ trách lớp
          {mentor.assignedClassCount > 0 ? (
            <span className="font-normal text-muted-foreground">
              {" "}
              · {mentor.assignedClassCount} lớp đang dạy
            </span>
          ) : null}
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
  title?: string;
  organization?: string;
  avatarUrl: string | null;
  code?: string | null;
  className?: string;
}) {
  return (
    <MentorIdentityHeader
      fullName={fullName}
      title={title?.trim() || ""}
      organization={organization?.trim() || ""}
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
        <div className="size-20 shrink-0 animate-pulse rounded-full bg-muted sm:size-24" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-5 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-36 animate-pulse rounded bg-muted" />
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="border-t border-border pt-4">
        <div className="mb-2 flex items-center gap-2.5">
          <div className="size-7 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-3.5 w-full animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-[90%] animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
