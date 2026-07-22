"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Pencil,
  Play,
  Users,
} from "lucide-react";

import {
  ClassFormDialog,
  type ClassFormSubmitPayload,
} from "@/components/manager/classes/class-form-dialog";
import { ClassMentorAssignmentPanel } from "@/components/manager/classes/class-mentor-assignment-panel";
import { ClassStatusBadge } from "@/components/manager/classes/class-status-badge";
import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import {
  ManagerDataTable,
  type ColumnDef,
} from "@/components/manager/shared/data-table";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  completeClass,
  getClassWithStudents,
  getPrograms,
  openClass,
  startClass,
  updateClass,
  type ClassStudentRoster,
} from "@/lib/api";
import { getNextClassLifecycleAction } from "@/lib/classes/constants";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "HV";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

type ClassDetailProps = {
  classId: string;
};

export function ClassDetail({ classId }: ClassDetailProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lifecycleOpen, setLifecycleOpen] = useState(false);

  const { data, isLoading, retry } = useClientFetch({
    fetcher: () => getClassWithStudents(classId),
    deps: [classId],
    onError: (error) => showAppErrorFromUnknown(error, "classes.detail"),
  });

  const { data: programsData, isLoading: isProgramsLoading } = useClientFetch({
    fetcher: () =>
      getPrograms({
        sortBy: "name",
        page: 1,
        pageSize: 100,
      }),
    deps: [],
    onError: (error) => showAppErrorFromUnknown(error, "programs.list"),
  });

  const classItem = data?.data ?? null;
  const programs = programsData?.data?.items ?? [];
  const roster = classItem?.students ?? [];
  const programName =
    programs.find((program) => program.id === classItem?.programId)?.name ??
    "—";
  const nextLifecycle = classItem
    ? getNextClassLifecycleAction(classItem.status)
    : null;

  async function handleSubmit(values: ClassFormSubmitPayload) {
    if (!classItem) return;
    setIsSubmitting(true);
    try {
      await updateClass(classItem.id, {
        ...values,
        mentorId: classItem.mentorId,
      });
      showAppSuccess({
        title: "Đã cập nhật lớp học",
        description: `Lớp ${values.name} đã được lưu.`,
      });
      setFormOpen(false);
      retry();
    } catch (error) {
      showAppErrorFromUnknown(error, "classes.update");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLifecycle() {
    if (!classItem || !nextLifecycle) return;
    try {
      if (nextLifecycle.action === "open") await openClass(classItem.id);
      else if (nextLifecycle.action === "start") await startClass(classItem.id);
      else await completeClass(classItem.id);

      showAppSuccess({
        title: "Đã cập nhật trạng thái",
        description: `${nextLifecycle.label} cho lớp ${classItem.name || classItem.code}.`,
      });
      setLifecycleOpen(false);
      retry();
    } catch (error) {
      showAppErrorFromUnknown(error, "classes.lifecycle");
      throw error;
    }
  }

  const columns: ColumnDef<ClassStudentRoster>[] = [
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
      className: "w-28 text-xs font-medium",
      render: (student) => student.enrollmentStatus,
    },
    {
      header: "Ghi danh",
      className: "w-36 text-xs text-[#6B6B6B]",
      render: (student) =>
        formatApiDateTimeDisplay(student.enrolledAt) || "—",
    },
  ];

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
          description="Lớp học không tồn tại hoặc đã bị xóa."
        >
          <Button
            type="button"
            variant="outline"
            nativeButton={false}
            render={<Link href="/manager/classes" />}
            className="h-11 gap-2 rounded-xl border-[#D8D8D2]"
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
          render={<Link href="/manager/classes" />}
          className="h-11 gap-2 rounded-xl border-[#D8D8D2]"
        >
          <ArrowLeft className="size-4" />
          Danh sách
        </Button>
        <Button
          type="button"
          variant="outline"
          nativeButton={false}
          render={<Link href={`/manager/sessions?classId=${classItem.id}`} />}
          className="h-11 gap-2 rounded-xl border-[#D8D8D2]"
        >
          <CalendarDays className="size-4" />
          Lịch học
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setFormOpen(true)}
          className="h-11 gap-2 rounded-xl border-[#D8D8D2]"
        >
          <Pencil className="size-4" />
          Sửa
        </Button>
        {nextLifecycle ? (
          <Button
            type="button"
            onClick={() => setLifecycleOpen(true)}
            className="h-11 gap-2 rounded-xl bg-[#7CB342] px-5 font-semibold text-white hover:bg-[#6BA338] active:scale-[0.98]"
          >
            <Play className="size-4" />
            {nextLifecycle.label}
          </Button>
        ) : null}
      </ManagerPageHeader>

      <div className="space-y-6 px-6 pb-12">
        <section className="grid gap-4 rounded-2xl border border-[#E5E5E0] bg-white p-6 shadow-[0_4px_18px_rgba(45,45,45,0.04)] md:grid-cols-2 xl:grid-cols-4">
          <MetaCard label="Trạng thái">
            <ClassStatusBadge status={classItem.status} />
          </MetaCard>
          <MetaCard label="Sĩ số">
            <p className="font-mono text-lg font-bold tabular-nums text-[#2D2D2D]">
              {classItem.seatsTaken}/{classItem.maxCapacity}
            </p>
          </MetaCard>
          <MetaCard label="Bắt đầu">
            <p className="text-sm font-medium text-[#2D2D2D]">
              {formatApiDateTimeDisplay(classItem.startDate) || "—"}
            </p>
          </MetaCard>
          <MetaCard label="Kết thúc">
            <p className="text-sm font-medium text-[#2D2D2D]">
              {formatApiDateTimeDisplay(classItem.endDate) || "—"}
            </p>
          </MetaCard>
          {classItem.scheduleSummary ? (
            <div className="md:col-span-2 xl:col-span-4">
              <p className="text-xs font-medium uppercase tracking-wider text-[#6B6B6B]">
                Tóm tắt lịch
              </p>
              <p className="mt-1 text-sm text-[#2D2D2D]">
                {classItem.scheduleSummary}
              </p>
            </div>
          ) : null}
        </section>

        <ClassMentorAssignmentPanel
          classId={classItem.id}
          mentorId={classItem.mentorId}
          requiredSkills={classItem.requiredSkills}
          onChanged={retry}
        />

        <section className="overflow-hidden rounded-2xl border border-[#E5E5E0] bg-white shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
          <div className="flex items-center justify-between border-b border-[#E5E5E0] bg-[#FAFAF5]/70 px-6 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#2D2D2D]">
              <Users className="size-4 text-[#E94B3C]" />
              Danh sách học viên
            </p>
            <p className="font-mono text-xs text-[#6B6B6B]">
              {roster.length} học viên
            </p>
          </div>
          <div className="overflow-x-auto p-6">
            <ManagerDataTable
              columns={columns}
              data={roster}
              isLoading={isLoading}
              emptyState={
                <ManagerEmptyState
                  title="Chưa có học viên trong lớp"
                  description="Học viên sẽ xuất hiện sau khi ghi danh lớp từ chương trình đã thanh toán."
                  icon={Users}
                />
              }
            />
          </div>
        </section>
      </div>

      <ClassFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        classItem={classItem}
        programs={programs}
        isProgramsLoading={isProgramsLoading}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        isOpen={lifecycleOpen}
        onOpenChange={setLifecycleOpen}
        onConfirm={handleLifecycle}
        title={nextLifecycle?.label ?? "Chuyển trạng thái?"}
        description={`Xác nhận “${nextLifecycle?.label ?? ""}” cho lớp “${classItem.name || classItem.code}”.`}
        confirmLabel={nextLifecycle?.label ?? "Xác nhận"}
      />
    </div>
  );
}

function MetaCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wider text-[#6B6B6B]">
        {label}
      </p>
      {children}
    </div>
  );
}
