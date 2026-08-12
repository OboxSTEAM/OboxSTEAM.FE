"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CalendarDays, ClipboardCheck } from "lucide-react";

import { ClassSessionStatusBadge } from "@/components/manager/classes/class-status-badge";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClassSession } from "@/lib/api";
import { CLASS_SESSION_KIND_LABELS } from "@/lib/classes/constants";
import { parseApiDateTime } from "@/lib/curriculum/datetime";
import { cn } from "@/lib/utils";

type MentorClassSessionsPanelProps = {
  sessions: ClassSession[];
  isLoading?: boolean;
  onTakeAttendance: (session: ClassSession) => void;
};

type DayGroup = {
  key: string;
  label: string;
  weekday: string;
  sessions: ClassSession[];
};

const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"] as const;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatClock(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDayLabel(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

function isPastSession(session: ClassSession, now: number): boolean {
  if (session.status === "Completed" || session.status === "Cancelled") {
    return true;
  }
  if (session.status === "InProgress") return false;
  const end = parseApiDateTime(session.endTime);
  return end ? end.getTime() < now : false;
}

function isNextSession(
  session: ClassSession,
  ordered: ClassSession[],
  now: number,
): boolean {
  const next = ordered.find((item) => !isPastSession(item, now));
  return next?.id === session.id;
}

function groupByDay(sessions: ClassSession[]): DayGroup[] {
  const map = new Map<string, DayGroup>();

  for (const session of sessions) {
    const start = parseApiDateTime(session.startTime);
    const key = start ? dayKey(start) : `unknown-${session.id}`;
    const existing = map.get(key);
    if (existing) {
      existing.sessions.push(session);
      continue;
    }
    map.set(key, {
      key,
      label: start ? formatDayLabel(start) : "—",
      weekday: start ? WEEKDAY_SHORT[start.getDay()] : "—",
      sessions: [session],
    });
  }

  return [...map.values()];
}

export function MentorClassSessionsPanel({
  sessions,
  isLoading = false,
  onTakeAttendance,
}: MentorClassSessionsPanelProps) {
  const now = useMemo(() => Date.now(), []);

  const ordered = useMemo(
    () => [...sessions].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [sessions],
  );

  const dayGroups = useMemo(() => groupByDay(ordered), [ordered]);

  const upcomingCount = useMemo(
    () => ordered.filter((session) => !isPastSession(session, now)).length,
    [ordered, now],
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-2 border-b border-border bg-muted/40 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CalendarDays className="size-4 text-primary" />
            Lịch lớp này
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {isLoading && sessions.length === 0
              ? "Đang tải…"
              : `${sessions.length} buổi · ${upcomingCount} sắp tới`}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/mentor/schedule" />}
          className="h-8 gap-1.5 rounded-lg text-xs"
        >
          <CalendarDays className="size-3.5" />
          Lịch tổng
        </Button>
      </div>

      {isLoading && sessions.length === 0 ? (
        <div className="space-y-2 p-4">
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="p-6">
          <ManagerEmptyState
            title="Chưa có buổi học"
            description="Quản lý sẽ tạo lịch cho lớp. Mở Lịch tổng để xem mọi lớp."
            icon={CalendarDays}
          />
        </div>
      ) : (
        <div className="max-h-[min(420px,55vh)] overflow-y-auto overscroll-contain">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
              <tr className="border-b border-border text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                <th className="w-16 px-3 py-2 font-bold">Ngày</th>
                <th className="w-[6.5rem] px-2 py-2 font-bold">Giờ</th>
                <th className="px-2 py-2 font-bold">Buổi</th>
                <th className="w-28 px-2 py-2 font-bold">Loại</th>
                <th className="w-28 px-2 py-2 font-bold">TT</th>
                <th className="w-24 px-3 py-2 text-right font-bold"> </th>
              </tr>
            </thead>
            <tbody>
              {dayGroups.map((group) =>
                group.sessions.map((session, index) => {
                  const start = parseApiDateTime(session.startTime);
                  const end = parseApiDateTime(session.endTime);
                  const past = isPastSession(session, now);
                  const next = isNextSession(session, ordered, now);
                  const timeLabel =
                    start && end
                      ? `${formatClock(start)}–${formatClock(end)}`
                      : start
                        ? formatClock(start)
                        : "—";

                  return (
                    <tr
                      key={session.id}
                      className={cn(
                        "border-b border-border/70 last:border-b-0",
                        next && "bg-primary/[0.06]",
                        past && !next && "bg-muted/10 text-muted-foreground",
                      )}
                    >
                      <td className="align-middle px-3 py-1.5">
                        {index === 0 ? (
                          <div className="flex flex-col leading-tight">
                            <span className="font-mono text-[11px] font-bold tabular-nums text-foreground">
                              {group.label}
                            </span>
                            <span className="text-[10px] font-semibold text-muted-foreground">
                              {group.weekday}
                            </span>
                          </div>
                        ) : (
                          <span className="sr-only">{group.label}</span>
                        )}
                      </td>
                      <td className="align-middle px-2 py-1.5">
                        <span
                          className={cn(
                            "font-mono text-xs tabular-nums",
                            next ? "font-semibold text-primary" : undefined,
                          )}
                        >
                          {timeLabel}
                        </span>
                      </td>
                      <td className="align-middle px-2 py-1.5">
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "truncate text-sm leading-snug",
                              next
                                ? "font-semibold text-foreground"
                                : "font-medium text-foreground",
                              past && !next && "text-muted-foreground",
                            )}
                            title={session.title || "Buổi học"}
                          >
                            {next ? (
                              <span className="mr-1.5 inline-flex rounded bg-primary px-1 py-px text-[9px] font-bold tracking-wide text-primary-foreground uppercase">
                                Next
                              </span>
                            ) : null}
                            {session.title || "Buổi học"}
                          </p>
                          {session.location?.trim() ? (
                            <p className="truncate text-[10px] text-muted-foreground">
                              {session.location.trim()}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="align-middle px-2 py-1.5">
                        <span className="text-[11px] text-muted-foreground">
                          {CLASS_SESSION_KIND_LABELS[session.sessionKind] ??
                            session.sessionKind}
                        </span>
                      </td>
                      <td className="align-middle px-2 py-1.5">
                        <ClassSessionStatusBadge status={session.status} />
                      </td>
                      <td className="align-middle px-3 py-1.5 text-right">
                        {session.requiresAttendance && !past ? (
                          <Button
                            type="button"
                            variant={next ? "default" : "ghost"}
                            size="sm"
                            onClick={() => onTakeAttendance(session)}
                            className="h-7 gap-1 rounded-md px-2 text-[11px]"
                            aria-label={`Điểm danh ${session.title || "buổi học"}`}
                          >
                            <ClipboardCheck className="size-3.5" />
                            <span className="hidden sm:inline">Điểm danh</span>
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
