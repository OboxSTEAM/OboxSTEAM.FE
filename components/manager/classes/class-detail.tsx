"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { ClassSchedulePanel } from "@/components/manager/classes/class-schedule-panel";
import { ClassDateRange } from "@/components/classes/class-date-range";
import { ClassScheduleSummary } from "@/components/classes/class-schedule-summary";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  completeClass,
  getClassSessions,
  getClassWithStudents,
  getPrograms,
  markClassReadyForMentor,
  openClass,
  startClass,
  updateClass,
  type ClassStudentRoster,
} from "@/lib/api";
import { CLASS_SESSIONS_QUERY, getNextClassLifecycleAction } from "@/lib/classes/constants";
import {
  countActiveClassSessions,
  getOpenClassBlockersFromClass,
  getReadyForMentorBlockersFromClass,
} from "@/lib/classes/lifecycle";
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

const TAB_VALUES = ["tong-quan", "lich-hoc"] as const;
type ClassDetailTab = (typeof TAB_VALUES)[number];

function parseTab(value: string | null): ClassDetailTab {
  if (value && (TAB_VALUES as readonly string[]).includes(value)) {
    return value as ClassDetailTab;
  }
  // Back-compat aliases
  if (value === "sessions" || value === "schedule") return "lich-hoc";
  return "tong-quan";
}

type ClassDetailProps = {
  classId: string;
};

function ClassDetailInner({ classId }: ClassDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));

  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lifecycleOpen, setLifecycleOpen] = useState(false);

  function setTab(next: ClassDetailTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "tong-quan") params.delete("tab");
    else params.set("tab", next);
    const qs = params.toString();
    router.replace(
      qs ? `/manager/classes/${classId}?${qs}` : `/manager/classes/${classId}`,
      { scroll: false },
    );
  }

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

  const { data: sessionsData, retry: retrySessions } = useClientFetch({
    fetcher: () => getClassSessions(classId, CLASS_SESSIONS_QUERY),
    deps: [classId],
    onError: (error) => showAppErrorFromUnknown(error, "classSessions.list"),
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
  const activeSessionCount = countActiveClassSessions(
    sessionsData?.data?.items ?? [],
  );
  const lifecycleBlockers =
    classItem && nextLifecycle?.action === "ready"
      ? getReadyForMentorBlockersFromClass(classItem, activeSessionCount)
      : classItem && nextLifecycle?.action === "open"
        ? getOpenClassBlockersFromClass(classItem, activeSessionCount)
        : [];
  const canRunLifecycle = lifecycleBlockers.length === 0;

  async function handleSubmit(values: ClassFormSubmitPayload) {
    if (!classItem) return;
    setIsSubmitting(true);
    try {
      await updateClass(classItem.id, {
        ...values,
        mentorId: classItem.mentorId ?? undefined,
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
      if (nextLifecycle.action === "ready") {
        await markClassReadyForMentor(classItem.id);
      } else if (nextLifecycle.action === "open") {
        await openClass(classItem.id);
      } else if (nextLifecycle.action === "start") {
        await startClass(classItem.id);
      } else {
        await completeClass(classItem.id);
      }

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
          <Avatar className="size-9 border border-border">
            <AvatarImage src={student.avatarUrl || undefined} alt="" />
            <AvatarFallback className="bg-[#4FC3F7]/12 text-[10px] font-bold text-[#0D6E9C] dark:text-[#7dd3fc]">
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
      className: "w-28 text-xs font-medium",
      render: (student) => student.enrollmentStatus,
    },
    {
      header: "Ghi danh",
      className: "w-36 text-xs text-muted-foreground",
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
          render={<Link href="/manager/classes" />}
          className="h-11 gap-2 rounded-xl border-border"
        >
          <ArrowLeft className="size-4" />
          Danh sách
        </Button>
        <Button
          type="button"
          variant="outline"
          nativeButton={false}
          render={
            <Link href={`/manager/sessions?classId=${classItem.id}`} />
          }
          className="h-11 gap-2 rounded-xl border-border"
          title="Mở lịch tổng (nhiều lớp)"
        >
          <CalendarDays className="size-4" />
          Hub lịch
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setFormOpen(true)}
          className="h-11 gap-2 rounded-xl border-border"
        >
          <Pencil className="size-4" />
          Sửa
        </Button>
        {nextLifecycle ? (
          <Button
            type="button"
            onClick={() => setLifecycleOpen(true)}
            disabled={!canRunLifecycle}
            title={
              canRunLifecycle ? undefined : lifecycleBlockers.join(" · ")
            }
            className="h-11 gap-2 rounded-xl bg-[#7CB342] px-5 font-semibold text-white hover:bg-[#6BA338] active:scale-[0.98] disabled:opacity-50"
          >
            <Play className="size-4" />
            {nextLifecycle.label}
          </Button>
        ) : null}
      </ManagerPageHeader>

      <div className="space-y-6 px-6 pb-12">
        <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-[0_4px_18px_rgba(45,45,45,0.04)] md:grid-cols-2 xl:grid-cols-4">
          <MetaCard label="Trạng thái">
            <ClassStatusBadge status={classItem.status} />
          </MetaCard>
          <MetaCard label="Sĩ số">
            <p className="font-mono text-lg font-bold tabular-nums text-foreground">
              {classItem.seatsTaken}/{classItem.maxCapacity}
            </p>
          </MetaCard>
          <MetaCard label="Thời gian">
            <ClassDateRange
              startDate={classItem.startDate}
              endDate={classItem.endDate}
              layout="stack"
            />
          </MetaCard>
          {classItem.scheduleSummary ? (
            <MetaCard label="Lịch học">
              <ClassScheduleSummary summary={classItem.scheduleSummary} />
            </MetaCard>
          ) : null}
        </section>

        <Tabs
          value={tab}
          onValueChange={(value) => {
            if (!value) return;
            setTab(parseTab(value));
          }}
          className="gap-4"
        >
          <TabsList
            variant="line"
            className="h-auto w-full justify-start gap-1 rounded-none border-b border-border bg-transparent p-0"
          >
            <TabsTrigger
              value="tong-quan"
              className="rounded-none px-4 py-2.5 data-active:text-primary"
            >
              <Users className="size-4" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger
              value="lich-hoc"
              className="rounded-none px-4 py-2.5 data-active:text-primary"
            >
              <CalendarDays className="size-4" />
              Lịch học
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tong-quan" className="mt-0">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,7fr)] lg:items-start">
              <div className="min-w-0 lg:sticky lg:top-4">
                <ClassMentorAssignmentPanel
                  classId={classItem.id}
                  mentorId={classItem.mentorId}
                  requiredSkills={classItem.requiredSkills}
                  onChanged={retry}
                />
              </div>

              <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
                <div className="flex items-center justify-between border-b border-border bg-background/70 px-6 py-3">
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
                    columns={columns}
                    data={roster}
                    isLoading={isLoading}
                    emptyState={
                      <ManagerEmptyState
                        title="Chưa có học viên trong lớp"
                        description="Học viên chỉ ghi danh sau khi lớp được mở tuyển sinh (đã có mentor và lịch khớp khung chương trình). Trạng thái Chờ mentor chưa cho enroll."
                        icon={Users}
                      />
                    }
                  />
                </div>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="lich-hoc" className="mt-0">
            <ClassSchedulePanel
              classId={classItem.id}
              cohortName={classItem.name}
              programId={classItem.programId}
              seatsTaken={classItem.seatsTaken}
              onSessionsChanged={retrySessions}
            />
          </TabsContent>
        </Tabs>
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
        description={
          nextLifecycle?.action === "ready"
            ? `Đưa lớp lên bảng mentor khi lịch đã cover curriculum và ngày bắt đầu còn ở tương lai (chưa cần mentor). Xác nhận “${classItem.name || classItem.code}”.`
            : nextLifecycle?.action === "open"
              ? `Mở tuyển sinh yêu cầu: mentor, lịch khớp khung chương trình, ngày bắt đầu còn ở tương lai. Xác nhận mở lớp “${classItem.name || classItem.code}”.`
              : nextLifecycle?.action === "start"
                ? `Bắt đầu lớp vẫn cần coverage khớp curriculum. Xác nhận “${nextLifecycle.label}” cho “${classItem.name || classItem.code}”.`
                : `Xác nhận “${nextLifecycle?.label ?? ""}” cho lớp “${classItem.name || classItem.code}”.`
        }
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
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

export function ClassDetail({ classId }: ClassDetailProps) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6">
          <ManagerPageHeader title="Chi tiết lớp" description="Đang tải...">
            <Skeleton className="h-11 w-28 rounded-xl" />
          </ManagerPageHeader>
        </div>
      }
    >
      <ClassDetailInner classId={classId} />
    </Suspense>
  );
}
