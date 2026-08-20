"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck } from "lucide-react";

import { AttendanceStatusBadge } from "@/components/manager/classes/class-status-badge";
import {
  ManagerDataTable,
  type ColumnDef,
} from "@/components/manager/shared/data-table";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerFilterBar } from "@/components/manager/shared/filter-bar";
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
import type { ClassSessionStudent, SessionAttendanceStatus } from "@/lib/api";
import {
  ATTENDANCE_STATUS_LABELS,
  MENTOR_COMPLETE_ELIGIBLE_ATTENDANCE_STATUSES,
} from "@/lib/classes/constants";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
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

type MentorActivityAttendancePanelProps = {
  students: ClassSessionStudent[];
  isLoading?: boolean;
  updatingStudentId?: string | null;
  isCompletingActivity?: boolean;
  onStatusChange: (
    student: ClassSessionStudent,
    status: SessionAttendanceStatus,
  ) => void;
  onCompleteActivity?: () => void;
};

export function MentorActivityAttendancePanel({
  students,
  isLoading = false,
  updatingStudentId = null,
  isCompletingActivity = false,
  onStatusChange,
  onCompleteActivity,
}: MentorActivityAttendancePanelProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const eligibleCount = useMemo(
    () =>
      students.filter((student) =>
        MENTOR_COMPLETE_ELIGIBLE_ATTENDANCE_STATUSES.has(student.attendanceStatus),
      ).length,
    [students],
  );

  const filtered = useMemo(() => {
    return students.filter((student) => {
      const matchesStatus =
        statusFilter === "all" || student.attendanceStatus === statusFilter;
      const q = search.trim().toLowerCase();
      if (!q) return matchesStatus;
      const haystack = [student.studentName, student.studentCode, student.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesStatus && haystack.includes(q);
    });
  }, [students, search, statusFilter]);

  const columns: ColumnDef<ClassSessionStudent>[] = useMemo(
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
              onStatusChange(student, value as SessionAttendanceStatus);
            }}
            disabled={
              updatingStudentId === student.studentId || isCompletingActivity
            }
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
                <SelectItem key={value} value={value} className={THEME_SELECT_ITEM}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
    ],
    [isCompletingActivity, onStatusChange, updatingStudentId],
  );

  return (
    <div>
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
              ...Object.entries(ATTENDANCE_STATUS_LABELS).map(([value, label]) => ({
                value,
                label,
              })),
            ],
          },
        ]}
        showClear={search !== "" || statusFilter !== "all"}
        onClearFilters={() => {
          setSearch("");
          setStatusFilter("all");
        }}
      />

      {onCompleteActivity ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/10 px-4 py-3 sm:px-6">
          <p className="text-xs text-muted-foreground">
            Hoàn thành hoạt động cho học viên{" "}
            <span className="font-medium text-foreground">Có mặt / Đi muộn / Có phép</span>
            {eligibleCount > 0 ? (
              <>
                {" "}
                ·{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {eligibleCount}
                </span>{" "}
                đủ điều kiện
              </>
            ) : null}
          </p>
          <Button
            type="button"
            size="sm"
            disabled={eligibleCount === 0 || isCompletingActivity || isLoading}
            className="h-8 gap-1.5 rounded-md"
            onClick={onCompleteActivity}
          >
            <CheckCircle2 className="size-3.5" />
            {isCompletingActivity ? "Đang hoàn thành…" : "Hoàn thành hoạt động"}
          </Button>
        </div>
      ) : null}

      <div className="overflow-x-auto p-4 sm:p-6">
        <ManagerDataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          emptyState={
            <ManagerEmptyState
              title="Chưa có học viên để điểm danh"
              description="Roster điểm danh sẽ hiển thị khi lớp có học viên active cho buổi học này."
              icon={ClipboardCheck}
            />
          }
        />
      </div>
    </div>
  );
}
