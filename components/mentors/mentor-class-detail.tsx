"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
  Images,
  Users,
} from "lucide-react";

import {
  AttendanceStatusBadge,
  ClassStatusBadge,
} from "@/components/manager/classes/class-status-badge";
import { MentorClassEvidencePanel } from "@/components/mentors/mentor-class-evidence-panel";
import { MentorClassSessionsPanel } from "@/components/mentors/mentor-class-sessions-panel";
import {
  ManagerDataTable,
  type ColumnDef,
} from "@/components/manager/shared/data-table";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import {
  THEME_SELECT_CONTENT,
  THEME_SELECT_ITEM,
  THEME_SELECT_TRIGGER,
} from "@/lib/ui/select-styles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  getClassSessions,
  getClassSessionWithStudents,
  getClassWithStudents,
  getPrograms,
  updateSessionAttendance,
  type ClassSessionStudent,
  type ClassStudentRoster,
  type SessionAttendanceStatus,
} from "@/lib/api";
import {
  ATTENDANCE_STATUS_LABELS,
  CLASS_SESSIONS_QUERY,
  CLASS_STUDENT_ENROLLMENT_STATUS_LABELS,
} from "@/lib/classes/constants";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "HV";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

type MentorClassDetailProps = {
  classId: string;
};

export function MentorClassDetail({ classId }: MentorClassDetailProps) {
  const [tab, setTab] = useState("students");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(
    null,
  );

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

  const {
    data: sessionsData,
    isLoading: isSessionsLoading,
  } = useClientFetch({
    enabled:
      tab === "sessions" || tab === "attendance" || tab === "evidence",
    fetcher: () =>
      getClassSessions(classId, {
        ...CLASS_SESSIONS_QUERY,
      }),
    deps: [classId, tab],
    onError: (error) => showAppErrorFromUnknown(error, "classSessions.list"),
  });

  const sessions = sessionsData?.data?.items ?? [];
  const effectiveSessionId =
    selectedSessionId ||
    sessions.find((session) => session.requiresAttendance)?.id ||
    sessions[0]?.id ||
    "";

  const {
    data: attendanceData,
    isLoading: isAttendanceLoading,
    markLoading: markAttendanceLoading,
    retry: retryAttendance,
  } = useClientFetch({
    enabled: tab === "attendance" && !!effectiveSessionId,
    fetcher: () => getClassSessionWithStudents(classId, effectiveSessionId),
    deps: [classId, effectiveSessionId, tab],
    onError: (error) => showAppErrorFromUnknown(error, "attendance.list"),
  });

  const classItem = data?.data ?? null;
  const roster = classItem?.students ?? [];
  const programName =
    programsData?.data?.items.find(
      (program) => program.id === classItem?.programId,
    )?.name ?? "—";
  const attendanceStudents = attendanceData?.data?.students ?? [];
  const selectedSession =
    sessions.find((session) => session.id === effectiveSessionId) ?? null;

  async function handleAttendanceChange(
    student: ClassSessionStudent,
    status: SessionAttendanceStatus,
  ) {
    if (!effectiveSessionId || student.attendanceStatus === status) return;

    setUpdatingStudentId(student.studentId);
    try {
      await updateSessionAttendance(
        classId,
        effectiveSessionId,
        student.studentId,
        { status },
      );
      showAppSuccess({
        title: "Đã cập nhật điểm danh",
        description: `${student.studentName || student.studentCode || "Học viên"}: ${ATTENDANCE_STATUS_LABELS[status]}.`,
      });
      retryAttendance();
    } catch (error) {
      showAppErrorFromUnknown(error, "attendance.update");
    } finally {
      setUpdatingStudentId(null);
    }
  }

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

  const attendanceColumns: ColumnDef<ClassSessionStudent>[] = useMemo(
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
                {student.studentCode || student.email || "—"}
              </p>
            </div>
          </div>
        ),
      },
      {
        header: "Trạng thái",
        className: "w-36",
        render: (student) => (
          <AttendanceStatusBadge status={student.attendanceStatus} />
        ),
      },
      {
        header: "Check-in",
        className: "w-40 text-xs text-muted-foreground",
        render: (student) =>
          formatApiDateTimeDisplay(student.checkedInAt) || "—",
      },
      {
        header: "Cập nhật",
        className: "min-w-48",
        render: (student) => (
          <Select
            value={student.attendanceStatus}
            onValueChange={(value) => {
              if (!value) return;
              void handleAttendanceChange(
                student,
                value as SessionAttendanceStatus,
              );
            }}
            disabled={updatingStudentId === student.studentId}
          >
            <SelectTrigger className={cn(THEME_SELECT_TRIGGER, "w-full")}>
              <span className="truncate">
                {ATTENDANCE_STATUS_LABELS[student.attendanceStatus] ??
                  "Chọn trạng thái"}
              </span>
            </SelectTrigger>
            <SelectContent
              align="start"
              alignItemWithTrigger={false}
              sideOffset={8}
              className={THEME_SELECT_CONTENT}
            >
              {Object.entries(ATTENDANCE_STATUS_LABELS).map(([value, label]) => (
                <SelectItem
                  key={value}
                  value={value}
                  className={THEME_SELECT_ITEM}
                >
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
    ],
    [updatingStudentId, effectiveSessionId],
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
            if (value) setTab(value);
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
              value="attendance"
              className="rounded-none px-4 py-2.5 data-active:text-primary"
            >
              <ClipboardCheck className="size-4" />
              Điểm danh
            </TabsTrigger>
            <TabsTrigger
              value="evidence"
              className="rounded-none px-4 py-2.5 data-active:text-primary"
            >
              <Images className="size-4" />
              Evidence
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
                setSelectedSessionId(session.id);
                setTab("attendance");
              }}
            />
          </TabsContent>

          <TabsContent value="attendance" className="mt-0">
            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border bg-muted/40 px-6 py-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Buổi học
                </p>
                <Select
                  value={effectiveSessionId || null}
                  onValueChange={(value) => {
                    markAttendanceLoading();
                    setSelectedSessionId(value ?? "");
                  }}
                  disabled={isSessionsLoading || sessions.length === 0}
                >
                  <SelectTrigger className={cn(THEME_SELECT_TRIGGER, "w-full max-w-md")}>
                    <span className="truncate">
                      {isSessionsLoading
                        ? "Đang tải buổi học..."
                        : selectedSession
                          ? selectedSession.title || "Buổi học"
                          : "Chọn buổi học"}
                    </span>
                  </SelectTrigger>
                  <SelectContent
                    align="start"
                    alignItemWithTrigger={false}
                    sideOffset={8}
                    className={cn(
                      THEME_SELECT_CONTENT,
                      "w-auto! min-w-[min(100vw-2rem,22rem)] max-w-[min(100vw-2rem,28rem)]",
                    )}
                  >
                    {sessions.map((session) => (
                      <SelectItem
                        key={session.id}
                        value={session.id}
                        className={cn(THEME_SELECT_ITEM, "cursor-pointer")}
                      >
                        {session.title || "Buổi học"}
                        {!session.requiresAttendance ? (
                          <span className="ml-2 text-[11px] text-muted-foreground">
                            (không điểm danh)
                          </span>
                        ) : null}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSession ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatApiDateTimeDisplay(selectedSession.startTime)}
                    {" → "}
                    {formatApiDateTimeDisplay(selectedSession.endTime)}
                  </p>
                ) : null}
              </div>

              <div className="overflow-x-auto p-6">
                {!effectiveSessionId ? (
                  <ManagerEmptyState
                    title="Chọn buổi học để điểm danh"
                    description="Lớp chưa có buổi học hoặc chưa chọn buổi. Quay lại tab Lịch học để xem danh sách."
                    icon={ClipboardCheck}
                  />
                ) : (
                  <ManagerDataTable
                    columns={attendanceColumns}
                    data={attendanceStudents}
                    isLoading={isAttendanceLoading}
                    emptyState={
                      <ManagerEmptyState
                        title="Chưa có học viên để điểm danh"
                        description="Roster điểm danh sẽ hiển thị khi lớp có học viên active cho buổi học này."
                        icon={ClipboardCheck}
                      />
                    }
                  />
                )}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="evidence" className="mt-0">
            <MentorClassEvidencePanel
              classId={classId}
              sessions={sessions}
              roster={roster}
              isSessionsLoading={isSessionsLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
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
