"use client";

import type { ReactNode } from "react";
import {
  Briefcase,
  CheckCircle2,
  Mail,
  MessageSquareText,
  Phone,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type {
  MentorAssignmentProfile,
  MentorSkillProficiency,
} from "@/lib/api/entities/mentor";
import type { SkillSummary } from "@/lib/api";
import { cn } from "@/lib/utils";

const PROFICIENCY_LABELS: Record<MentorSkillProficiency, string> = {
  Beginner: "Cơ bản",
  Intermediate: "Trung bình",
  Advanced: "Nâng cao",
  Expert: "Chuyên gia",
};

const CATEGORY_LABELS: Record<string, string> = {
  Science: "Science",
  Technology: "Technology",
  Engineering: "Engineering",
  Arts: "Arts",
  Math: "Math",
  SoftSkill: "Soft skill",
};

export function getMentorInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "GV";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
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
  code,
  status,
  email,
  avatarUrl,
  className,
}: {
  fullName: string;
  code?: string | null;
  status?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  className?: string;
}) {
  const statusLabel =
    status === "Active" ? "Đang hoạt động" : status || "Mentor";

  return (
    <div className={cn("flex items-start gap-4", className)}>
      <Avatar className="size-20 shrink-0 ring-2 ring-[#E5E5E0] sm:size-24">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
        <AvatarFallback className="bg-[#F5F5F0] text-lg font-semibold text-[#6B6B6B]">
          {getMentorInitials(fullName)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-heading text-lg font-bold leading-tight text-[#2D2D2D] sm:text-xl">
          {fullName || "Mentor chưa đặt tên"}
        </p>
        <p className="text-sm font-medium text-[#4A4A4A]">{statusLabel}</p>
        <p className="truncate text-sm text-[#6B6B6B]">
          {email || "Chưa có email"}
        </p>
        {code ? (
          <p className="font-mono text-[11px] uppercase tracking-widest text-[#6B6B6B]/75">
            {code}
          </p>
        ) : null}
      </div>
    </div>
  );
}

type MentorProfileContentProps = {
  mentor: MentorAssignmentProfile;
  requiredSkills?: SkillSummary[];
  requestMessage?: string | null;
  className?: string;
};

export function MentorProfileContent({
  mentor,
  requiredSkills = [],
  requestMessage,
  className,
}: MentorProfileContentProps) {
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

  const hasPhone = Boolean(mentor.phone?.trim());
  const hasEmail = Boolean(mentor.email?.trim());

  return (
    <div className={cn("space-y-4", className)}>
      <MentorIdentityHeader
        fullName={mentor.fullName || "Mentor chưa đặt tên"}
        code={mentor.code}
        status={mentor.status}
        email={mentor.email}
        avatarUrl={mentor.avatarUrl}
      />

      {(hasEmail || hasPhone) && (
        <div
          className={cn(
            "grid gap-4",
            hasEmail && hasPhone && "sm:grid-cols-2",
          )}
        >
          {hasEmail ? (
            <ProfileSection title="Email" icon={Mail}>
              <p className="break-all text-sm leading-relaxed text-[#6B6B6B]">
                {mentor.email}
              </p>
            </ProfileSection>
          ) : null}
          {hasPhone ? (
            <ProfileSection title="Số điện thoại" icon={Phone}>
              <p className="text-sm leading-relaxed text-[#2D2D2D]">
                {mentor.phone}
              </p>
            </ProfileSection>
          ) : null}
        </div>
      )}

      <ProfileSection title="Tải lớp" icon={Briefcase} tone="accent">
        <p className="text-sm font-medium text-[#2D2D2D]">
          {mentor.assignedClassCount} đang dạy
          <span className="font-normal text-[#6B6B6B]">
            {" "}
            · {mentor.pendingRequestCount} chờ duyệt
          </span>
        </p>
      </ProfileSection>

      {requestMessage ? (
        <ProfileSection title="Lời nhắn xin nhận lớp" icon={MessageSquareText}>
          <p className="text-sm leading-relaxed whitespace-pre-line text-[#6B6B6B]">
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
        tone="highlight"
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
                      ? "bg-[#7CB342]/12 text-[#3d5c22]"
                      : "bg-[#F5F5F0] text-[#6B6B6B]",
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

        {skills.length === 0 ? (
          <p className="text-sm text-[#6B6B6B]">
            Mentor chưa cập nhật kỹ năng.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {skills.map((item) => {
              const isMatch = requiredSkillIds.has(item.skillId);
              return (
                <li key={item.id}>
                  <div
                    className={cn(
                      "group inline-flex max-w-full flex-col rounded-md px-1.5 py-0.5 text-sm transition-colors",
                      isMatch
                        ? "bg-[#7CB342]/10"
                        : "hover:bg-[#4FC3F7]/10",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 truncate font-medium",
                        isMatch ? "text-[#3d5c22]" : "text-[#4FC3F7]",
                      )}
                    >
                      {isMatch ? (
                        <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
                      ) : null}
                      {item.skill?.name || item.skill?.code || "Skill"}
                    </span>
                    <span className="truncate text-xs text-[#6B6B6B]">
                      {PROFICIENCY_LABELS[item.proficiencyLevel]}
                      {" · "}
                      {CATEGORY_LABELS[item.skill?.category ?? ""] ??
                        item.skill?.category ??
                        "—"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </ProfileSection>
    </div>
  );
}

export function MentorProfilePreview({
  fullName,
  code,
  status,
  email,
  avatarUrl,
  className,
}: {
  fullName: string;
  code?: string | null;
  status?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  className?: string;
}) {
  return (
    <MentorIdentityHeader
      fullName={fullName}
      code={code}
      status={status}
      email={email}
      avatarUrl={avatarUrl}
      className={className}
    />
  );
}

export function MentorProfileSkeleton() {
  return (
    <div className="space-y-4">
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
      <div className="border-t border-[#E5E5E0] pt-4">
        <div className="mb-2 flex items-center gap-2.5">
          <div className="size-7 animate-pulse rounded-full bg-[#F5F5F0]" />
          <div className="h-4 w-20 animate-pulse rounded bg-[#F5F5F0]" />
        </div>
        <div className="h-3.5 w-48 animate-pulse rounded bg-[#F5F5F0]" />
      </div>
    </div>
  );
}
