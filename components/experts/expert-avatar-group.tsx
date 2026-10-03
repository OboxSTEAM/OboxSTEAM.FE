"use client";

import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "@/components/ui/avatar";
import { getExpertInitials } from "@/lib/programs/format";
import { cn } from "@/lib/utils";

export type ExpertAvatarPerson = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

type ExpertAvatarGroupProps = {
  people: ExpertAvatarPerson[];
  max?: number;
  onPersonClick?: (personId: string) => void;
  ringClassName?: string;
  className?: string;
};

/** Overlapping expert faces. Each face opens that expert's profile. */
export function ExpertAvatarGroup({
  people,
  max = 4,
  onPersonClick,
  ringClassName = "ring-background",
  className,
}: ExpertAvatarGroupProps) {
  if (people.length === 0) return null;

  const visible = people.slice(0, max);
  const extra = people.length - visible.length;

  return (
    <AvatarGroup className={cn("items-center", className)}>
      {visible.map((person) => (
        <button
          key={person.id}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onPersonClick?.(person.id);
          }}
          className={cn(
            "relative rounded-full ring-2 transition-transform hover:z-10 hover:scale-105 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]",
            ringClassName,
          )}
          aria-label={`Xem hồ sơ ${person.name}`}
        >
          <Avatar size="sm" className="bg-white ring-0 after:hidden">
            {person.avatarUrl ? <AvatarImage src={person.avatarUrl} alt="" /> : null}
            <AvatarFallback className="bg-[#F5F5F0] text-[10px] font-medium text-[#6B6B6B]">
              {getExpertInitials(person.name)}
            </AvatarFallback>
          </Avatar>
        </button>
      ))}
      {extra > 0 ? (
        <AvatarGroupCount className="bg-[#F5F5F0] text-[10px] font-semibold text-[#6B6B6B]">
          +{extra}
        </AvatarGroupCount>
      ) : null}
    </AvatarGroup>
  );
}
