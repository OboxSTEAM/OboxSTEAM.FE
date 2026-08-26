"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, GraduationCap, Users } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { MentorProfileDialog } from "@/components/mentors/mentor-profile-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Mentor } from "@/lib/api/entities/mentor";
import type { CurriculumClassContext } from "@/lib/curriculum/class-context";
import {
  getExpertAvatarUrl,
  getExpertInitials,
} from "@/lib/programs/format";
import { cn } from "@/lib/utils";

type CurriculumClassBarProps = {
  classContext: CurriculumClassContext;
};

function getPersonInitials(name: string): string {
  return getExpertInitials(name);
}

function MentorCard({
  mentor,
  onOpen,
}: {
  mentor: Mentor;
  onOpen: () => void;
}) {
  const displayName =
    mentor.fullName?.trim() || mentor.email?.trim() || "Mentor";
  const subtitle = [mentor.title?.trim(), mentor.organization?.trim()]
    .filter(Boolean)
    .join(" · ");
  const avatarUrl = getExpertAvatarUrl(mentor.avatarUrl);

  return (
    <div className="mb-2 rounded-xl border border-learn-success/30 bg-learn-success/10 p-2">
      <p className="mb-1.5 px-1.5 text-[10px] font-semibold tracking-[0.14em] text-learn-success uppercase">
        Mentor phụ trách
      </p>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Xem thông tin ${displayName}`}
        className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-learn-success/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-learn-success/40"
      >
        <Avatar className="size-10 shrink-0 bg-learn-success/10 ring-2 ring-learn-success/10">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback className="bg-learn-success/25 text-[11px] font-semibold text-learn-success">
            {getPersonInitials(displayName)}
          </AvatarFallback>
        </Avatar>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-learn-text-strong underline-offset-2">
              {displayName}
            </span>
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-learn-success px-1.5 py-0.5 text-[10px] font-medium text-white">
              <GraduationCap className="size-2.5" aria-hidden />
              Mentor
            </span>
          </span>
          {subtitle ? (
            <span className="mt-0.5 block truncate text-[11px] text-learn-muted">
              {subtitle}
            </span>
          ) : mentor.code ? (
            <span className="mt-0.5 block truncate font-mono text-[11px] text-learn-muted">
              {mentor.code}
            </span>
          ) : (
            <span className="mt-0.5 block text-[11px] text-learn-muted">
              Xem hồ sơ mentor
            </span>
          )}
        </span>

        <ChevronRight className="size-4 shrink-0 text-learn-success/70" aria-hidden />
      </button>
    </div>
  );
}

export function CurriculumClassBar({ classContext }: CurriculumClassBarProps) {
  const reduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(true);
  const [isMentorDialogOpen, setIsMentorDialogOpen] = useState(false);

  const roster = classContext.roster;
  const mentor = classContext.mentor;
  const seatsLabel = `${classContext.seatsTaken}/${classContext.maxCapacity}`;

  return (
    <>
      <section
        aria-label="Thông tin lớp học"
        className="mx-3 mb-4 rounded-2xl border border-learn-success/30 bg-learn-success/8 p-1 shadow-[0_1px_2px_color-mix(in_srgb,var(--learn-text-strong)_4%,transparent)]"
      >
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-learn-success/15"
          aria-expanded={isOpen ? "true" : "false"}
        >
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-learn-success text-white">
            <Users className="size-4" aria-hidden />
          </span>

          <span className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold tracking-[0.14em] text-learn-success uppercase">
              Lớp của bạn
            </span>
            {classContext.kind === "Remedial" ||
            classContext.classEnrollmentKind === "Retake" ? (
              <span className="ml-2 inline-flex rounded-md bg-[#4FC3F7]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#0288D1]">
                {classContext.kind === "Remedial"
                  ? "Lớp học lại"
                  : "Ghế học lại"}
              </span>
            ) : null}
            <span className="mt-1 block font-heading text-[15px] leading-snug font-semibold text-learn-text-strong">
              {classContext.className}
            </span>
            <span className="mt-1 block text-xs text-learn-muted">
              {classContext.classCode} · {seatsLabel} chỗ
            </span>
          </span>

          <span className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-learn-success/10 px-2 py-1 text-[11px] font-medium text-learn-success">
              {roster.length} học viên
            </span>
            <ChevronDown
              className={cn(
                "size-4 text-learn-success/70 transition-transform duration-200 motion-reduce:transition-none",
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
                {mentor ? (
                  <MentorCard
                    mentor={mentor}
                    onOpen={() => setIsMentorDialogOpen(true)}
                  />
                ) : null}

                <ul className="max-h-44 space-y-1 overflow-y-auto rounded-xl bg-learn-success/8 p-2">
                  {roster.length === 0 ? (
                    <li className="px-2 py-4 text-center text-xs text-learn-muted">
                      Chưa có học viên trong lớp.
                    </li>
                  ) : (
                    roster.map((student) => (
                      <li
                        key={student.classEnrollmentId}
                        className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-learn-success/15"
                      >
                        <Avatar className="size-8 bg-learn-success/15">
                          {student.avatarUrl ? (
                            <AvatarImage src={student.avatarUrl} alt="" />
                          ) : null}
                          <AvatarFallback className="bg-learn-success/15 text-[10px] font-semibold text-learn-success">
                            {getPersonInitials(student.studentName ?? "")}
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

      {mentor ? (
        <MentorProfileDialog
          mentorId={mentor.id}
          open={isMentorDialogOpen}
          onOpenChange={setIsMentorDialogOpen}
          preview={mentor}
        />
      ) : null}
    </>
  );
}
