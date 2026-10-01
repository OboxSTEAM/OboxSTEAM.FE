"use client";

import Link from "next/link";
import { CheckSquare } from "lucide-react";

import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  getClasses,
  getClassSessions,
  getClassSessionWithStudents,
  type ClassSession,
  type ClassSessionStudent,
} from "@/lib/api";
import type { ClassStatus } from "@/lib/api/entities/class";
import { showAppErrorFromUnknown } from "@/lib/errors";

const ATTENDED = new Set(["Present", "Late"]);
const CLASS_STATUSES = new Set<ClassStatus>(["Open", "InProgress", "Completed"]);
const percentFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 1,
});

type ClassAttendance = {
  id: string;
  name: string;
  code: string;
  rate: number;
  sessionCount: number;
};

type AttendanceSummary = {
  rate: number;
  sessionCount: number;
  classes: ClassAttendance[];
};

export function AttendanceSummaryCard() {
  const { data, isLoading } = useClientFetch({
    fetcher: loadAttendanceSummary,
    deps: [],
    minSkeletonMs: 0,
    onError: (error) => {
      showAppErrorFromUnknown(error, "attendance.list");
    },
  });

  return (
    <section className="flex h-full min-w-0 flex-col rounded-2xl border border-border/70 bg-card p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">Điểm danh</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Trung bình tỷ lệ có mặt từng buổi của mỗi lớp
          </p>
        </div>
        <CheckSquare className="size-4 shrink-0 text-steam-arts opacity-90" />
      </div>

      {isLoading && !data ? (
        <div className="mt-3 h-24 animate-pulse rounded-xl bg-border/70" />
      ) : !data || data.classes.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Chưa có buổi đã điểm danh.
        </p>
      ) : (
        <>
          <p className="mt-2.5 font-heading text-2xl font-black tabular-nums tracking-tight text-steam-arts sm:text-3xl">
            {formatPercent(data.rate)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {data.classes.length} lớp · {data.sessionCount} buổi đã học
          </p>
          <ul className="mt-2 max-h-[180px] space-y-0.5 overflow-y-auto overscroll-contain pr-0.5">
            {data.classes.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/manager/attendance?classId=${item.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-foreground">
                      {item.name}
                    </span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {item.code} · {item.sessionCount} buổi
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                    {formatPercent(item.rate)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function formatPercent(value: number): string {
  return `${percentFormatter.format(value)}%`;
}

function sessionRate(students: ClassSessionStudent[]): number | null {
  if (students.length === 0) return null;
  const wasRecorded = students.some(
    (student) => student.attendanceStatus !== "Expected",
  );
  if (!wasRecorded) return null;
  const attended = students.filter((student) =>
    ATTENDED.has(student.attendanceStatus),
  ).length;
  return (attended / students.length) * 100;
}

function isCountedSession(session: ClassSession): boolean {
  return (
    session.requiresAttendance &&
    session.status === "Completed" &&
    session.sessionKind !== "AssignmentWindow"
  );
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
    }
  }

  const size = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: size }, () => run()));
  return results;
}

async function loadAttendanceSummary(): Promise<AttendanceSummary> {
  const classes = await loadEligibleClasses();
  const grouped = await mapPool(classes, 4, async (item) => {
    try {
      return { item, sessions: await loadCountedSessions(item.id) };
    } catch {
      return { item, sessions: [] as ClassSession[] };
    }
  });

  const jobs = grouped.flatMap((group) =>
    group.sessions.map((session) => ({
      classId: group.item.id,
      name: group.item.name.trim() || "Lớp không tên",
      code: group.item.code.trim(),
      sessionId: session.id,
    })),
  );

  const rates = await mapPool(jobs, 6, async (job) => {
    try {
      const result = await getClassSessionWithStudents(job.classId, job.sessionId);
      return {
        ...job,
        rate: sessionRate(result.data?.students ?? []),
      };
    } catch {
      return { ...job, rate: null };
    }
  });

  const byClass = new Map<string, ClassAttendance & { rates: number[] }>();
  for (const entry of rates) {
    if (entry.rate == null) continue;
    const current = byClass.get(entry.classId) ?? {
      id: entry.classId,
      name: entry.name,
      code: entry.code,
      rate: 0,
      sessionCount: 0,
      rates: [],
    };
    current.rates.push(entry.rate);
    byClass.set(entry.classId, current);
  }

  const classRows = [...byClass.values()]
    .map((row) => {
      const rate =
        row.rates.reduce((sum, value) => sum + value, 0) / row.rates.length;
      return {
        id: row.id,
        name: row.name,
        code: row.code,
        rate,
        sessionCount: row.rates.length,
      };
    })
    .sort((a, b) => a.rate - b.rate || a.name.localeCompare(b.name, "vi"));

  const sessionCount = classRows.reduce((sum, row) => sum + row.sessionCount, 0);
  const rate =
    classRows.length > 0
      ? classRows.reduce((sum, row) => sum + row.rate, 0) / classRows.length
      : 0;

  return { rate, sessionCount, classes: classRows };
}

async function loadEligibleClasses() {
  const items = [];
  let page = 1;

  for (let guard = 0; guard < 5; guard += 1) {
    const result = await getClasses({
      sortBy: "name",
      page,
      pageSize: 100,
    });
    const pageData = result.data;
    items.push(...(pageData?.items ?? []));
    if (!pageData?.hasNext) break;
    page += 1;
  }

  return items.filter((item) => CLASS_STATUSES.has(item.status));
}

async function loadCountedSessions(classId: string): Promise<ClassSession[]> {
  const sessions: ClassSession[] = [];
  let page = 1;

  for (let guard = 0; guard < 5; guard += 1) {
    const result = await getClassSessions(classId, {
      status: "Completed",
      sortBy: "startTime",
      page,
      pageSize: 100,
    });
    const pageData = result.data;
    sessions.push(...(pageData?.items ?? []).filter(isCountedSession));
    if (!pageData?.hasNext) break;
    page += 1;
  }

  return sessions;
}
