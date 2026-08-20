"use client";

import type { CSSProperties } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import type { ClassStudentRoster, MediaTag } from "@/lib/api";
import { cn } from "@/lib/utils";

const DEFAULT_MAX_VISIBLE = 3;

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "HV";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** `confidenceScore` is 0–100 after API normalize. */
export function confidencePercent(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.round(Math.min(100, Math.max(0, score)));
}

export function confidenceLabel(score: number): string {
  const percent = confidencePercent(score);
  if (percent >= 90) return "Rất cao";
  if (percent >= 70) return "Cao";
  if (percent >= 50) return "Trung bình";
  return "Thấp";
}

function confidenceTone(score: number): {
  badge: string;
  bar: string;
  label: string;
} {
  const percent = confidencePercent(score);
  if (percent >= 90) {
    return {
      badge: "bg-[#7CB342]/15 text-[#3d5c22] dark:text-[#b8e086]",
      bar: "bg-[#7CB342]",
      label: "text-[#3d5c22] dark:text-[#b8e086]",
    };
  }
  if (percent >= 70) {
    return {
      badge: "bg-[#4FC3F7]/15 text-[#1565a0] dark:text-[#81d4fa]",
      bar: "bg-[#4FC3F7]",
      label: "text-[#1565a0] dark:text-[#81d4fa]",
    };
  }
  if (percent >= 50) {
    return {
      badge: "bg-[#FDD835]/20 text-[#8a6d00] dark:text-[#ffe082]",
      bar: "bg-[#FDD835]",
      label: "text-[#8a6d00] dark:text-[#ffe082]",
    };
  }
  return {
    badge: "bg-destructive/10 text-destructive",
    bar: "bg-destructive",
    label: "text-destructive",
  };
}

type MediaTagConfidenceProps = {
  score: number;
  className?: string;
};

/** Percent + tier label + thin bar — readable at a glance in tag rows. */
export function MediaTagConfidence({
  score,
  className,
}: MediaTagConfidenceProps) {
  const percent = confidencePercent(score);
  const label = confidenceLabel(score);
  const tone = confidenceTone(score);

  return (
    <div className={cn("min-w-[7.5rem] max-w-[9.5rem]", className)}>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-sm font-bold tabular-nums leading-none",
            tone.badge,
          )}
        >
          {percent}%
        </span>
        <span className={cn("text-xs font-semibold leading-none", tone.label)}>
          {label}
        </span>
      </div>
      <div
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="presentation"
        aria-hidden
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300",
            tone.bar,
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="sr-only">
        Độ tin cậy {percent}%, {label}
      </span>
    </div>
  );
}

type MediaStudentAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
  size?: "sm" | "default";
  className?: string;
  style?: CSSProperties;
};

/** Single student face for media tag rows / stacks. */
export function MediaStudentAvatar({
  name,
  avatarUrl,
  isVerified = false,
  size = "default",
  className,
  style,
}: MediaStudentAvatarProps) {
  return (
    <Avatar
      size={size}
      title={name}
      style={style}
      className={cn(
        "shrink-0 bg-muted",
        size === "sm" && "size-7",
        size === "default" && "size-9",
        isVerified && "!ring-[#7CB342]",
        className,
      )}
    >
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
      <AvatarFallback
        className={cn(
          "bg-secondary font-semibold text-secondary-foreground",
          size === "sm" ? "text-[10px]" : "text-xs",
        )}
      >
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

type MediaTagAvatarStackProps = {
  tags: MediaTag[];
  rosterByStudentId: Map<string, ClassStudentRoster>;
  maxVisible?: number;
  className?: string;
};

/**
 * Facebook-style overlapping avatars for tagged students in the media table.
 */
export function MediaTagAvatarStack({
  tags,
  rosterByStudentId,
  maxVisible = DEFAULT_MAX_VISIBLE,
  className,
}: MediaTagAvatarStackProps) {
  if (tags.length === 0) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const visible = tags.slice(0, maxVisible);
  const overflow = tags.length - visible.length;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <AvatarGroup className="-space-x-2.5">
        {visible.map((tag, index) => {
          const student = rosterByStudentId.get(tag.studentId);
          const name =
            tag.studentName?.trim() ||
            student?.studentName?.trim() ||
            "Học viên";

          return (
            <MediaStudentAvatar
              key={`${tag.id}:${tag.studentId}:${index}`}
              size="sm"
              name={name}
              avatarUrl={student?.avatarUrl}
              isVerified={tag.isVerified}
              style={{ zIndex: visible.length - index }}
              className="relative"
            />
          );
        })}
        {overflow > 0 ? (
          <AvatarGroupCount
            className="size-7 text-[10px] font-semibold text-foreground"
            title={`Còn ${overflow} học viên`}
          >
            +{overflow}
          </AvatarGroupCount>
        ) : null}
      </AvatarGroup>
    </div>
  );
}
