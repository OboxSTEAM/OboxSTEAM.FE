"use client";

import { useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CurriculumClassContext } from "@/lib/curriculum/class-context";
import { cn } from "@/lib/utils";

type CurriculumClassBarProps = {
  classContext: CurriculumClassContext;
};

function getStudentInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function CurriculumClassBar({ classContext }: CurriculumClassBarProps) {
  const reduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(true);

  const roster = classContext.roster;
  const seatsLabel = `${classContext.seatsTaken}/${classContext.maxCapacity}`;

  return (
    <section
      aria-label="Thông tin lớp học"
      className="mx-3 mb-4 rounded-2xl bg-[#e3e0d6] p-1 shadow-[0_1px_2px_rgba(45,45,45,0.04)]"
    >
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-[#ebe8e1]/80"
        aria-expanded={isOpen ? "true" : "false"}
      >
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-learn-surface text-[#6b7560]">
          <Users className="size-4" aria-hidden />
        </span>

        <span className="min-w-0 flex-1">
          <span className="text-[10px] font-semibold tracking-[0.14em] text-[#6b7560] uppercase">
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
          <span className="inline-flex items-center gap-1 rounded-md bg-learn-surface px-2 py-1 text-[11px] font-medium text-learn-muted">
            {roster.length} học viên
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-learn-faint transition-transform duration-200 motion-reduce:transition-none",
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
              <ul className="max-h-44 space-y-1 overflow-y-auto rounded-xl bg-learn-surface p-2">
                {roster.length === 0 ? (
                  <li className="px-2 py-4 text-center text-xs text-learn-muted">
                    Chưa có học viên trong lớp.
                  </li>
                ) : (
                  roster.map((student) => (
                    <li
                      key={student.classEnrollmentId}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-learn-surface-2/70"
                    >
                      <Avatar className="size-8 bg-learn-surface-2">
                        {student.avatarUrl ? (
                          <AvatarImage src={student.avatarUrl} alt="" />
                        ) : null}
                        <AvatarFallback className="bg-[#e8ebe3] text-[10px] font-semibold text-[#6b7560]">
                          {getStudentInitials(student.studentName)}
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
