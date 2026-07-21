"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardCheck } from "lucide-react";

import { AttendanceStatusBadge } from "@/components/manager/classes/class-status-badge";
import {
  ManagerDataTable,
  type ColumnDef,
} from "@/components/manager/shared/data-table";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerFilterBar } from "@/components/manager/shared/filter-bar";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import {
  LIGHT_SELECT_CONTENT,
  LIGHT_SELECT_ITEM,
  LIGHT_SELECT_TRIGGER,
} from "@/components/programs/program-select-styles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  getClasses,
  getClassSessions,
  getClassSessionWithStudents,
  updateSessionAttendance,
  type ClassSessionStudent,
  type SessionAttendanceStatus,
} from "@/lib/api";
import { ATTENDANCE_STATUS_LABELS } from "@/lib/classes/constants";
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

function AttendanceManagerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId") ?? "";
  const sessionId = searchParams.get("sessionId") ?? "";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(
    null,
  );

  const { data: classesData, isLoading: isClassesLoading } = useClientFetch({
    fetcher: () =>
      getClasses({
        sortBy: "name",
        page: 1,
        pageSize: 100,
      }),
    deps: [],
    onError: (error) => showAppErrorFromUnknown(error, "classes.list"),
  });

  const { data: sessionsData, isLoading: isSessionsLoading } = useClientFetch({
    enabled: !!classId,
    fetcher: () =>
      getClassSessions(classId, {
        sortBy: "startTime",
        page: 1,
        pageSize: 100,
      }),
    deps: [classId],
    onError: (error) => showAppErrorFromUnknown(error, "classSessions.list"),
  });

  const {
    data: rosterData,
    isLoading: isRosterLoading,
    markLoading,
    retry,
  } = useClientFetch({
    enabled: !!classId && !!sessionId,
    fetcher: () => getClassSessionWithStudents(classId, sessionId),
    deps: [classId, sessionId],
    onError: (error) => showAppErrorFromUnknown(error, "attendance.list"),
  });

  const classes = classesData?.data?.items ?? [];
  const sessions = sessionsData?.data?.items ?? [];
  const sessionDetail = rosterData?.data ?? null;
  const students = sessionDetail?.students ?? [];
  const selectedClass = classes.find((item) => item.id === classId);
  const selectedSession = sessions.find((item) => item.id === sessionId);

  const filteredStudents = students.filter((student) => {
    const matchesStatus =
      statusFilter === "all" || student.attendanceStatus === statusFilter;
    const q = search.trim().toLowerCase();
    if (!q) return matchesStatus;
    const haystack = [
      student.studentName,
      student.studentCode,
      student.email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return matchesStatus && haystack.includes(q);
  });

  function replaceQuery(next: { classId?: string; sessionId?: string }) {
    const params = new URLSearchParams();
    const nextClassId = next.classId ?? classId;
    const nextSessionId =
      next.sessionId !== undefined ? next.sessionId : sessionId;

    if (nextClassId) params.set("classId", nextClassId);
    if (nextSessionId) params.set("sessionId", nextSessionId);

    const query = params.toString();
    router.replace(query ? `/manager/attendance?${query}` : "/manager/attendance");
  }

  function handleClassChange(nextClassId: string) {
    replaceQuery({ classId: nextClassId, sessionId: "" });
  }

  function handleSessionChange(nextSessionId: string) {
    markLoading();
    replaceQuery({ sessionId: nextSessionId });
  }

  async function handleStatusChange(
    student: ClassSessionStudent,
    status: SessionAttendanceStatus,
  ) {
    if (!classId || !sessionId) return;
    if (student.attendanceStatus === status) return;

    setUpdatingStudentId(student.studentId);
    try {
      await updateSessionAttendance(classId, sessionId, student.studentId, {
        status,
      });
      showAppSuccess({
        title: "Đã cập nhật điểm danh",
        description: `${student.studentName || student.studentCode || "Học viên"}: ${ATTENDANCE_STATUS_LABELS[status]}.`,
      });
      retry();
    } catch (error) {
      showAppErrorFromUnknown(error, "attendance.update");
    } finally {
      setUpdatingStudentId(null);
    }
  }

  const columns: ColumnDef<ClassSessionStudent>[] = [
    {
      header: "Học viên",
      render: (student) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-9 border border-[#E5E5E0]">
            <AvatarImage src={student.avatarUrl || undefined} alt="" />
            <AvatarFallback className="bg-[#4FC3F7]/12 text-[10px] font-bold text-[#0D6E9C]">
              {getInitials(student.studentName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-semibold text-[#2D2D2D]">
              {student.studentName || "Chưa cập nhật tên"}
            </p>
            <p className="truncate text-xs text-[#6B6B6B]">
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
      className: "w-40 text-xs text-[#6B6B6B]",
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
            void handleStatusChange(
              student,
              value as SessionAttendanceStatus,
            );
          }}
          disabled={updatingStudentId === student.studentId}
        >
          <SelectTrigger
            className={cn(LIGHT_SELECT_TRIGGER, "w-full")}
          >
            <span className="truncate">
              {ATTENDANCE_STATUS_LABELS[student.attendanceStatus] ??
                "Chọn trạng thái"}
            </span>
          </SelectTrigger>
          <SelectContent
            align="start"
            alignItemWithTrigger={false}
            sideOffset={8}
            className={LIGHT_SELECT_CONTENT}
          >
            {Object.entries(ATTENDANCE_STATUS_LABELS).map(([value, label]) => (
              <SelectItem
                key={value}
                value={value}
                className={LIGHT_SELECT_ITEM}
              >
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <ManagerPageHeader
        title="Điểm danh"
        description="Cập nhật trạng thái tham dự theo từng buổi học."
      >
        {classId && sessionId ? (
          <Button
            type="button"
            variant="outline"
            nativeButton={false}
            render={
              <Link href={`/manager/sessions?classId=${classId}`} />
            }
            className="h-11 rounded-xl border-[#D8D8D2]"
          >
            Quay lại lịch học
          </Button>
        ) : null}
      </ManagerPageHeader>

      <div className="px-6 pb-12">
        <div className="overflow-hidden rounded-2xl border border-[#E5E5E0] bg-white shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
          <div className="grid gap-4 border-b border-[#E5E5E0] bg-[#FAFAF5]/70 px-6 py-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wider text-[#6B6B6B]">
                Lớp học
              </p>
              <Select
                value={classId || null}
                onValueChange={(value) => handleClassChange(value ?? "")}
                disabled={isClassesLoading}
              >
                <SelectTrigger className={cn(LIGHT_SELECT_TRIGGER, "w-full")}>
                  <span className="truncate">
                    {isClassesLoading
                      ? "Đang tải lớp..."
                      : selectedClass
                        ? `${selectedClass.name}${selectedClass.code ? ` (${selectedClass.code})` : ""}`
                        : "Chọn lớp học"}
                  </span>
                </SelectTrigger>
                <SelectContent
                  align="start"
                  alignItemWithTrigger={false}
                  sideOffset={8}
                  className={cn(
                    LIGHT_SELECT_CONTENT,
                    "w-auto! min-w-[min(100vw-2rem,22rem)] max-w-[min(100vw-2rem,28rem)]",
                  )}
                >
                  {classes.map((classItem) => (
                    <SelectItem
                      key={classItem.id}
                      value={classItem.id}
                      className={cn(
                        LIGHT_SELECT_ITEM,
                        "items-start leading-snug [&_span]:shrink [&_span]:break-words [&_span]:whitespace-normal!",
                      )}
                    >
                      {classItem.name}
                      {classItem.code ? (
                        <span className="ml-2 font-mono text-[11px] text-[#7A7A74]">
                          {classItem.code}
                        </span>
                      ) : null}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wider text-[#6B6B6B]">
                Buổi học
              </p>
              <Select
                value={sessionId || null}
                onValueChange={(value) => handleSessionChange(value ?? "")}
                disabled={!classId || isSessionsLoading}
              >
                <SelectTrigger className={cn(LIGHT_SELECT_TRIGGER, "w-full")}>
                  <span className="truncate">
                    {!classId
                      ? "Chọn lớp trước"
                      : isSessionsLoading
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
                    LIGHT_SELECT_CONTENT,
                    "w-auto! min-w-[min(100vw-2rem,22rem)] max-w-[min(100vw-2rem,28rem)]",
                  )}
                >
                  {sessions.map((session) => (
                    <SelectItem
                      key={session.id}
                      value={session.id}
                      className={cn(
                        LIGHT_SELECT_ITEM,
                        "items-start leading-snug [&_span]:shrink [&_span]:break-words [&_span]:whitespace-normal!",
                      )}
                    >
                      {session.title || "Buổi học"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {classId && sessionId ? (
            <>
              {sessionDetail ? (
                <div className="border-b border-[#E5E5E0] px-6 py-3 text-sm text-[#6B6B6B]">
                  <span className="font-semibold text-[#2D2D2D]">
                    {sessionDetail.title}
                  </span>
                  {" · "}
                  {formatApiDateTimeDisplay(sessionDetail.startTime)}
                  {" → "}
                  {formatApiDateTimeDisplay(sessionDetail.endTime)}
                </div>
              ) : null}

              <ManagerFilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Tìm học viên theo tên, mã, email..."
                filters={[
                  {
                    key: "status",
                    placeholder: "Trạng thái",
                    value: statusFilter,
                    onChange: (value) => setStatusFilter(value || "all"),
                    options: [
                      { value: "all", label: "Mọi trạng thái" },
                      ...Object.entries(ATTENDANCE_STATUS_LABELS).map(
                        ([value, label]) => ({ value, label }),
                      ),
                    ],
                  },
                ]}
                showClear={search !== "" || statusFilter !== "all"}
                onClearFilters={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
              />

              <div className="overflow-x-auto p-6">
                <ManagerDataTable
                  columns={columns}
                  data={filteredStudents}
                  isLoading={isRosterLoading}
                  emptyState={
                    <ManagerEmptyState
                      title="Chưa có học viên để điểm danh"
                      description="Roster điểm danh sẽ hiển thị khi lớp có học viên active cho buổi học này."
                      icon={ClipboardCheck}
                    />
                  }
                />
              </div>
            </>
          ) : (
            <div className="p-6">
              <ManagerEmptyState
                title="Chọn lớp và buổi học"
                description="Chọn lớp cùng buổi học để xem và cập nhật roster điểm danh."
                icon={ClipboardCheck}
                actionLabel="Đến lịch học"
                actionHref="/manager/sessions"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AttendanceManager() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6">
          <ManagerPageHeader title="Điểm danh" description="Đang tải..." />
        </div>
      }
    >
      <AttendanceManagerInner />
    </Suspense>
  );
}
