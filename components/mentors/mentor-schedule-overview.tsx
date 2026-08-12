"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ExternalLink } from "lucide-react";

import { SessionCalendar } from "@/components/manager/classes/session-calendar";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  getClassSessions,
  getClasses,
  getMyMentorProfile,
  type Class,
  type ClassSession,
} from "@/lib/api";
import { CLASS_SESSIONS_QUERY } from "@/lib/classes/constants";
import {
  THEME_SELECT_CONTENT,
  THEME_SELECT_ITEM,
  THEME_SELECT_TRIGGER,
} from "@/lib/ui/select-styles";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { cn } from "@/lib/utils";

type ClassRef = Pick<Class, "id" | "name" | "code">;

function withClassLabel(
  session: ClassSession,
  classById: Map<string, ClassRef>,
): ClassSession {
  const cls = classById.get(session.classId);
  if (!cls) return session;
  const classLabel = cls.name?.trim() || cls.code || "Lớp";
  const baseTitle = session.title?.trim() || "Buổi học";
  if (baseTitle.startsWith(`${classLabel}:`)) return session;
  return { ...session, title: `${classLabel}: ${baseTitle}` };
}

export function MentorScheduleOverview() {
  const router = useRouter();
  const [classFilter, setClassFilter] = useState("all");

  const { data: mentorProfile, isLoading: isMentorLoading } = useClientFetch({
    fetcher: async () => {
      const result = await getMyMentorProfile();
      return result?.data ?? null;
    },
    deps: [],
    onError: (error) => showAppErrorFromUnknown(error, "mentors.detail"),
  });

  const mentorId = mentorProfile?.id ?? null;

  const { data: classesData, isLoading: isClassesLoading } = useClientFetch({
    enabled: mentorId != null,
    fetcher: async () => {
      if (!mentorId) return [];
      const result = await getClasses({
        mentorId,
        page: 1,
        pageSize: 100,
        sortBy: "startDate",
        isDescending: false,
      });
      return result?.data?.items ?? [];
    },
    deps: [mentorId],
    onError: (error) => showAppErrorFromUnknown(error, "classes.list"),
  });

  const classes = classesData ?? [];
  const classIdsKey = classes.map((c) => c.id).join(",");

  const { data: sessionsData, isLoading: isSessionsLoading } = useClientFetch({
    enabled: classIdsKey.length > 0,
    fetcher: async (): Promise<ClassSession[]> => {
      const results = await Promise.all(
        classes.map(async (cls) => {
          try {
            const result = await getClassSessions(cls.id, {
              ...CLASS_SESSIONS_QUERY,
            });
            return result?.data?.items ?? [];
          } catch {
            return [] as ClassSession[];
          }
        }),
      );
      return results.flat();
    },
    deps: [classIdsKey],
    onError: (error) => showAppErrorFromUnknown(error, "classSessions.list"),
  });

  const classById = useMemo(() => {
    const map = new Map<string, ClassRef>();
    for (const cls of classes) {
      map.set(cls.id, { id: cls.id, name: cls.name, code: cls.code });
    }
    return map;
  }, [classes]);

  const allSessions = useMemo(() => {
    const items = sessionsData ?? [];
    return items
      .map((session) => withClassLabel(session, classById))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [sessionsData, classById]);

  const visibleSessions = useMemo(() => {
    if (classFilter === "all") return allSessions;
    return allSessions.filter((session) => session.classId === classFilter);
  }, [allSessions, classFilter]);

  const isLoading =
    isMentorLoading ||
    isClassesLoading ||
    (classIdsKey.length > 0 && isSessionsLoading);

  const selectedClassLabel =
    classFilter === "all"
      ? "Tất cả lớp"
      : classById.get(classFilter)?.name ||
        classById.get(classFilter)?.code ||
        "Lớp";

  return (
    <div className="flex flex-col gap-6">
      <ManagerPageHeader
        title="Lịch học"
        description="Tổng quan mọi buổi học của các lớp bạn phụ trách."
      />

      <div className="space-y-4 px-6 pb-12">
        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CalendarDays className="size-4 text-primary" />
              Lịch tổng hợp
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isLoading
                ? "Đang tải…"
                : `${visibleSessions.length} buổi · ${classes.length} lớp`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={classFilter}
              onValueChange={(value) => setClassFilter(value ?? "all")}
              disabled={classes.length === 0}
            >
              <SelectTrigger className={cn(THEME_SELECT_TRIGGER, "min-w-[12rem]")}>
                <span className="truncate">{selectedClassLabel}</span>
              </SelectTrigger>
              <SelectContent
                align="end"
                alignItemWithTrigger={false}
                sideOffset={8}
                className={THEME_SELECT_CONTENT}
              >
                <SelectItem value="all" className={THEME_SELECT_ITEM}>
                  Tất cả lớp
                </SelectItem>
                {classes.map((cls) => (
                  <SelectItem
                    key={cls.id}
                    value={cls.id}
                    className={THEME_SELECT_ITEM}
                  >
                    {cls.name || cls.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {classFilter !== "all" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                nativeButton={false}
                render={
                  <Link href={`/mentor/classes/${classFilter}?tab=sessions`} />
                }
                className="h-9 gap-1.5 rounded-lg"
              >
                <ExternalLink className="size-3.5" />
                Chi tiết lớp
              </Button>
            ) : null}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {isLoading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-10 w-64 rounded-lg" />
              <Skeleton className="h-[420px] w-full rounded-xl" />
            </div>
          ) : classes.length === 0 ? (
            <div className="p-6">
              <ManagerEmptyState
                title="Chưa có lớp phụ trách"
                description="Khi bạn được gán vào lớp, lịch buổi học sẽ hiện ở đây."
                icon={CalendarDays}
                actionLabel="Xem danh sách lớp"
                onAction={() => router.push("/mentor/classes")}
              />
            </div>
          ) : visibleSessions.length === 0 ? (
            <div className="p-6">
              <ManagerEmptyState
                title="Chưa có buổi học"
                description={
                  classFilter === "all"
                    ? "Các lớp của bạn chưa có lịch buổi học."
                    : "Lớp này chưa có buổi học trong danh sách."
                }
                icon={CalendarDays}
              />
            </div>
          ) : (
            <SessionCalendar
              sessions={visibleSessions}
              onSelectSession={(session) => {
                const params = new URLSearchParams({ tab: "curriculum" });
                if (session.activityId) {
                  params.set("activityId", session.activityId);
                }
                params.set("sessionId", session.id);
                router.push(
                  `/mentor/classes/${session.classId}?${params.toString()}`,
                );
              }}
            />
          )}
        </section>
      </div>
    </div>
  );
}
