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
              key={tag.id}
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
