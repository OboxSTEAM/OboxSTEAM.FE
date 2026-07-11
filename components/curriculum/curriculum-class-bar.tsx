"use client";

import { useState } from "react";
import { ChevronDown, GraduationCap, Users } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CurriculumClassContext } from "@/lib/curriculum/class-context";
import { cn } from "@/lib/utils";

type CurriculumClassBarProps = {
  classContext: CurriculumClassContext;
};

function getPersonInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function MentorRow({ mentor }: { mentor: NonNullable<CurriculumClassContext["mentor"]> }) {
  const displayName = mentor.fullName?.trim() || mentor.email;

  return (
    <div className="mb-2 rounded-xl border border-[#c9d4ba] bg-[#dde5cf]/70 p-2.5">
      <p className="mb-2 px-1 text-[10px] font-semibold tracking-[0.14em] text-[#5a6b52] uppercase">
        Mentor phụ trách
      </p>
      <div className="flex items-center gap-2.5 rounded-lg px-1 py-1">
        <Avatar className="size-9 bg-[#f2f5ec] ring-2 ring-[#f2f5ec]">
          {mentor.avatarUrl ? <AvatarImage src={mentor.avatarUrl} alt="" /> : null}
          <AvatarFallback className="bg-[#c7d6b8] text-[11px] font-semibold text-[#48583f]">
            {getPersonInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-learn-text-strong">{displayName}</p>
          <p className="truncate text-[11px] text-learn-muted">{mentor.code}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#5a6b52] px-2 py-1 text-[10px] font-medium text-[#eef2e6]">
          <GraduationCap className="size-3" aria-hidden />
          Mentor
        </span>
      </div>
    </div>
  );
}

export function CurriculumClassBar({ classContext }: CurriculumClassBarProps) {
  const reduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(true);

  const roster = classContext.roster;
  const mentor = classContext.mentor;
  const seatsLabel = `${classContext.seatsTaken}/${classContext.maxCapacity}`;

  return (
    <section
      aria-label="Thông tin lớp học"
      className="mx-3 mb-4 rounded-2xl border border-[#c9d4ba] bg-[#e6ecdd] p-1 shadow-[0_1px_2px_rgba(45,45,45,0.04)]"
    >
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-[#dde5cf]/80"
        aria-expanded={isOpen ? "true" : "false"}
      >
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#5a6b52] text-[#eef2e6]">
          <Users className="size-4" aria-hidden />
        </span>

        <span className="min-w-0 flex-1">
          <span className="text-[10px] font-semibold tracking-[0.14em] text-[#5a6b52] uppercase">
            Lớp của bạn
          </span>
          <span className="mt-1 block font-heading text-[15px] leading-snug font-semibold text-learn-text-strong">
            {classContext.className}
          </span>
          <span className="mt-1 block text-xs text-learn-muted">
            {classContext.classCode} · {seatsLabel} chỗ
          </span>
        </span>

        <span className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-[#f2f5ec] px-2 py-1 text-[11px] font-medium text-[#5a6b52]">
            {roster.length} học viên
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-[#8a9578] transition-transform duration-200 motion-reduce:transition-none",
              isOpen && "rotate-180",
            )}
            aria-hidden
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2 pt-1">
              {mentor ? <MentorRow mentor={mentor} /> : null}
              <ul className="max-h-44 space-y-1 overflow-y-auto rounded-xl bg-[#f2f5ec] p-2">
                {roster.length === 0 ? (
                  <li className="px-2 py-4 text-center text-xs text-learn-muted">
                    Chưa có học viên trong lớp.
                  </li>
                ) : (
                  roster.map((student) => (
                    <li
                      key={student.classEnrollmentId}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-[#e2e9d7]/80"
                    >
                      <Avatar className="size-8 bg-[#e2e9d7]">
                        {student.avatarUrl ? (
                          <AvatarImage src={student.avatarUrl} alt="" />
                        ) : null}
                        <AvatarFallback className="bg-[#e2e9d7] text-[10px] font-semibold text-[#5a6b52]">
                          {getPersonInitials(student.studentName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-learn-text-strong">
                          {student.studentName}
                        </p>
                        <p className="truncate text-[11px] text-learn-muted">
                          {student.studentCode}
                        </p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
