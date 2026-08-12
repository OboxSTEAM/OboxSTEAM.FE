"use client";

import { Suspense, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardPen,
  Images,
  ListTree,
  Users,
} from "lucide-react";

import { ClassStatusBadge } from "@/components/manager/classes/class-status-badge";
import { MentorClassCurriculumPanel } from "@/components/mentors/mentor-class-curriculum-panel";
import { MentorClassMediaPanel } from "@/components/mentors/mentor-class-media-panel";
import { MentorClassGradingPanel } from "@/components/mentors/mentor-class-grading-panel";
import { MentorClassSessionsPanel } from "@/components/mentors/mentor-class-sessions-panel";
import {
  ManagerDataTable,
  type ColumnDef,
} from "@/components/manager/shared/data-table";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  getClassSessions,
  getClassWithStudents,
  getPrograms,
  type ClassStudentRoster,
} from "@/lib/api";
import {
  CLASS_SESSIONS_QUERY,
  CLASS_STUDENT_ENROLLMENT_STATUS_LABELS,
} from "@/lib/classes/constants";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown } from "@/lib/errors";

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "HV";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const TAB_VALUES = [
  "students",
  "sessions",
  "curriculum",
  "grading",
  "media",
] as const;

type MentorClassTab = (typeof TAB_VALUES)[number];

function parseTab(value: string | null): MentorClassTab {
  if (value && (TAB_VALUES as readonly string[]).includes(value)) {
    return value as MentorClassTab;
  }
  return "students";
}

type MentorClassDetailProps = {
  classId: string;
};

function MentorClassDetailInner({ classId }: MentorClassDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));
  const deepActivityId = searchParams.get("activityId");
  const deepSessionId = searchParams.get("sessionId");
  const deepAssignmentId = searchParams.get("assignmentId");

  function replaceQuery(next: {
    tab?: MentorClassTab;
    activityId?: string | null;
    sessionId?: string | null;
    assignmentId?: string | null;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextTab = next.tab ?? tab;
    params.set("tab", nextTab);

    const setOrDelete = (key: string, value: string | null | undefined) => {
      if (value === undefined) return;
      if (value) params.set(key, value);
      else params.delete(key);
    };

    setOrDelete("activityId", next.activityId);
    setOrDelete("sessionId", next.sessionId);
    setOrDelete("assignmentId", next.assignmentId);

    if (nextTab === "curriculum") {
      // Keep activity / session / assignment deep-links for Chương trình.
    } else if (nextTab === "grading") {
      params.delete("activityId");
      params.delete("sessionId");
      // Keep assignmentId so Chấm bài can open the matching bài.
    } else {
      params.delete("activityId");
      params.delete("sessionId");
      params.delete("assignmentId");
    }

    router.replace(`/mentor/classes/${classId}?${params.toString()}`, {
      scroll: false,
    });
  }

  const { data, isLoading } = useClientFetch({
    fetcher: () => getClassWithStudents(classId),
    deps: [classId],
    onError: (error) => showAppErrorFromUnknown(error, "classes.detail"),
  });

  const { data: programsData } = useClientFetch({
    fetcher: () =>
      getPrograms({
        sortBy: "name",
        page: 1,
        pageSize: 100,
      }),
    deps: [],
    onError: () => undefined,
  });

  const { data: sessionsData, isLoading: isSessionsLoading } = useClientFetch({
    enabled: tab === "sessions" || tab === "curriculum",
    fetcher: () =>
      getClassSessions(classId, {
        ...CLASS_SESSIONS_QUERY,
      }),
    deps: [classId, tab],
    onError: (error) => showAppErrorFromUnknown(error, "classSessions.list"),
  });

  const classItem = data?.data ?? null;
  const roster = classItem?.students ?? [];
  const sessions = sessionsData?.data?.items ?? [];
  const programName =
    programsData?.data?.items.find(
      (program) => program.id === classItem?.programId,
    )?.name ?? "—";

  const studentColumns: ColumnDef<ClassStudentRoster>[] = useMemo(
    () => [
      {
        header: "Học viên",
        render: (student) => (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-9 border border-border">
              <AvatarImage src={student.avatarUrl || undefined} alt="" />
              <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                {getInitials(student.studentName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">
                {student.studentName || "Chưa cập nhật tên"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {student.email || "—"}
              </p>
            </div>
          </div>
        ),
      },
      {
        header: "Mã HV",
        className: "w-28 font-mono text-xs",
        render: (student) => student.studentCode || "—",
      },
      {
        header: "SĐT",
        className: "w-32 text-xs",
        render: (student) => student.phone || "—",
      },
      {
        header: "Trạng thái",
        className: "w-32 text-xs font-medium",
        render: (student) =>
          CLASS_STUDENT_ENROLLMENT_STATUS_LABELS[student.enrollmentStatus] ??
          student.enrollmentStatus,
      },
      {
        header: "Ghi danh",
        className: "w-36 text-xs text-muted-foreground",
        render: (student) =>
          formatApiDateTimeDisplay(student.enrolledAt) || "—",
      },
    ],
    [],
  );

  if (isLoading && !classItem) {
    return (
      <div className="flex flex-col gap-6">
        <ManagerPageHeader title="Chi tiết lớp" description="Đang tải...">
          <Skeleton className="h-11 w-28 rounded-xl" />
        </ManagerPageHeader>
        <div className="space-y-4 px-6 pb-12">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!classItem) {
    return (
      <div className="flex flex-col gap-6">
        <ManagerPageHeader
          title="Không tìm thấy lớp"
          description="Lớp học không tồn tại hoặc bạn không được gán vào lớp này."
        >
          <Button
            type="button"
            variant="outline"
            nativeButton={false}
            render={<Link href="/mentor/classes" />}
            className="h-11 gap-2 rounded-xl border-border"
          >
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>
        </ManagerPageHeader>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ManagerPageHeader
        title={classItem.name || classItem.code}
        description={`Mã ${classItem.code} · ${programName}`}
      >
        <Button
          type="button"
          variant="outline"
          nativeButton={false}
          render={<Link href="/mentor/classes" />}
          className="h-11 gap-2 rounded-xl border-border"
        >
          <ArrowLeft className="size-4" />
          Danh sách
        </Button>
      </ManagerPageHeader>

      <div className="space-y-6 px-6 pb-12">
        <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm md:grid-cols-2 xl:grid-cols-4">
          <MetaCard label="Trạng thái">
            <ClassStatusBadge status={classItem.status} />
          </MetaCard>
          <MetaCard label="Sĩ số">
            <p className="font-mono text-lg font-bold tabular-nums text-foreground">
              {classItem.seatsTaken}/{classItem.maxCapacity}
            </p>
          </MetaCard>
          <MetaCard label="Bắt đầu">
            <p className="text-sm font-medium text-foreground">
              {formatApiDateTimeDisplay(classItem.startDate) || "—"}
            </p>
          </MetaCard>
          <MetaCard label="Kết thúc">
            <p className="text-sm font-medium text-foreground">
              {formatApiDateTimeDisplay(classItem.endDate) || "—"}
            </p>
          </MetaCard>
          {classItem.scheduleSummary ? (
            <div className="md:col-span-2 xl:col-span-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tóm tắt lịch
              </p>
              <p className="mt-1 text-sm text-foreground">
                {classItem.scheduleSummary}
              </p>
            </div>
          ) : null}
        </section>

        <Tabs
          value={tab}
          onValueChange={(value) => {
            if (!value) return;
            replaceQuery({
              tab: parseTab(value),
              activityId: null,
              sessionId: null,
              assignmentId: null,
            });
          }}
          className="gap-4"
        >
          <TabsList
            variant="line"
            className="h-auto w-full justify-start gap-1 rounded-none border-b border-border bg-transparent p-0"
          >
            <TabsTrigger
              value="students"
              className="rounded-none px-4 py-2.5 data-active:text-primary"
            >
              <Users className="size-4" />
              Học viên
            </TabsTrigger>
            <TabsTrigger
              value="sessions"
              className="rounded-none px-4 py-2.5 data-active:text-primary"
            >
              <CalendarDays className="size-4" />
              Lịch học
            </TabsTrigger>
            <TabsTrigger
              value="curriculum"
              className="rounded-none px-4 py-2.5 data-active:text-primary"
            >
              <ListTree className="size-4" />
              Chương trình
            </TabsTrigger>
            <TabsTrigger
              value="grading"
              className="rounded-none px-4 py-2.5 data-active:text-primary"
            >
              <ClipboardPen className="size-4" />
              Chấm bài
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className="rounded-none px-4 py-2.5 data-active:text-primary"
            >
              <Images className="size-4" />
              Media
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-0">
            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Users className="size-4 text-primary" />
                  Danh sách học viên
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {roster.length} học viên
                </p>
              </div>
              <div className="overflow-x-auto p-6">
                <ManagerDataTable
                  columns={studentColumns}
                  data={roster}
                  isLoading={isLoading}
                  emptyState={
                    <ManagerEmptyState
                      title="Chưa có học viên trong lớp"
                      description="Học viên sẽ xuất hiện sau khi ghi danh lớp."
                      icon={Users}
                    />
                  }
                />
              </div>
            </section>
          </TabsContent>

          <TabsContent value="sessions" className="mt-0">
            <MentorClassSessionsPanel
              sessions={sessions}
              isLoading={isSessionsLoading}
              onTakeAttendance={(session) => {
                replaceQuery({
                  tab: "curriculum",
                  activityId: session.activityId,
                  sessionId: session.id,
                  assignmentId: null,
                });
              }}
            />
          </TabsContent>

          <TabsContent value="curriculum" className="mt-0">
            {classItem.programId ? (
              <MentorClassCurriculumPanel
                classId={classId}
                programId={classItem.programId}
                roster={roster}
                sessions={sessions}
                initialActivityId={deepActivityId}
                initialSessionId={deepSessionId}
                initialAssignmentId={deepAssignmentId}
                onOpenGrading={(assignmentId) =>
                  replaceQuery({
                    tab: "grading",
                    activityId: null,
                    sessionId: null,
                    assignmentId,
                  })
                }
              />
            ) : (
              <ManagerEmptyState
                title="Chưa tải được chương trình"
                description="Lớp không có programId."
                icon={ListTree}
              />
            )}
          </TabsContent>

          <TabsContent value="grading" className="mt-0">
            {classItem.programId ? (
              <MentorClassGradingPanel
                classId={classId}
                programId={classItem.programId}
                initialAssignmentId={
                  tab === "grading" ? deepAssignmentId : null
                }
              />
            ) : (
              <ManagerEmptyState
                title="Chưa tải được lớp"
                description="Không có programId để lấy danh sách bài tập."
                icon={ClipboardPen}
              />
            )}
          </TabsContent>

          <TabsContent value="media" className="mt-0">
            <MentorClassMediaPanel classId={classId} roster={roster} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export function MentorClassDetail({ classId }: MentorClassDetailProps) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6">
          <ManagerPageHeader title="Chi tiết lớp" description="Đang tải..." />
        </div>
      }
    >
      <MentorClassDetailInner classId={classId} />
    </Suspense>
  );
}

function MetaCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}
