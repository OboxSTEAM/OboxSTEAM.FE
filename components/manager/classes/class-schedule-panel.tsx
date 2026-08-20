"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ClipboardCheck,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { GenerateSessionsDialog } from "@/components/manager/classes/generate-sessions-dialog";
import { SessionCalendar } from "@/components/manager/classes/session-calendar";
import {
  SessionFormDialog,
  type ClassSessionFormSubmitPayload,
} from "@/components/manager/classes/session-form-dialog";
import { ClassSessionStatusBadge } from "@/components/manager/classes/class-status-badge";
import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import {
  ManagerDataTable,
  type ColumnDef,
} from "@/components/manager/shared/data-table";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  createClassSession,
  deleteClassSession,
  getClassSessions,
  getModules,
  updateClassSession,
  type ClassSession,
  type ClassSessionKind,
  type ClassSessionStatus,
} from "@/lib/api";
import {
  CLASS_SESSION_KIND_LABELS,
  CLASS_SESSION_STATUS_LABELS,
  CLASS_SESSIONS_QUERY,
} from "@/lib/classes/constants";
import {
  formatApiDateTimeDisplay,
  parseApiDateTime,
} from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";

type ClassSchedulePanelProps = {
  classId: string;
  cohortName?: string | null;
  programId?: string | null;
};

type WeekGroup = {
  key: string;
  label: string;
  sessions: ClassSession[];
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function formatWeekLabel(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  return `Tuần ${pad(weekStart.getDate())}/${pad(weekStart.getMonth() + 1)} – ${pad(end.getDate())}/${pad(end.getMonth() + 1)}`;
}

function groupByWeek(sessions: ClassSession[]): WeekGroup[] {
  const map = new Map<string, WeekGroup>();
  for (const session of sessions) {
    const start = parseApiDateTime(session.startTime);
    const weekStart = start
      ? startOfWeekMonday(start)
      : startOfWeekMonday(new Date());
    const key = dayKey(weekStart);
    const existing = map.get(key);
    if (existing) {
      existing.sessions.push(session);
      continue;
    }
    map.set(key, {
      key,
      label: formatWeekLabel(weekStart),
      sessions: [session],
    });
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export function ClassSchedulePanel({
  classId,
  cohortName,
  programId,
}: ClassSchedulePanelProps) {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ClassSession | null>(
    null,
  );
  const [createDefaultStart, setCreateDefaultStart] = useState<Date | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<ClassSession | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFocus, setPendingFocus] = useState<{
    id: string;
    nonce: number;
  } | null>(null);
  const [kindFilter, setKindFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const {
    data: sessionsData,
    isLoading,
    markLoading,
    retry,
    mutate: mutateSessions,
  } = useClientFetch({
    fetcher: () =>
      getClassSessions(classId, {
        ...CLASS_SESSIONS_QUERY,
        sessionKind:
          kindFilter === "all"
            ? undefined
            : (kindFilter as ClassSessionKind),
        status:
          statusFilter === "all"
            ? undefined
            : (statusFilter as ClassSessionStatus),
      }),
    deps: [classId, kindFilter, statusFilter],
    onError: (error) => showAppErrorFromUnknown(error, "classSessions.list"),
  });

  const { data: modulesData, isLoading: isModulesLoading } = useClientFetch({
    enabled: !!programId,
    fetcher: () =>
      getModules({
        page: 1,
        pageSize: 100,
        sortBy: "name",
      }),
    deps: [programId],
    onError: (error) => showAppErrorFromUnknown(error, "generic"),
  });

  const sessions = sessionsData?.data?.items ?? [];
  const totalCount = sessionsData?.data?.totalCount ?? sessions.length;
  const modules = useMemo(() => {
    const all = modulesData?.data?.items ?? [];
    if (!programId) return all;
    return all.filter((module) => module.programId === programId);
  }, [modulesData?.data?.items, programId]);

  const dayFiltered = useMemo(() => {
    if (!selectedDay) return sessions;
    const key = dayKey(selectedDay);
    return sessions.filter((session) => {
      const start = parseApiDateTime(session.startTime);
      return start ? dayKey(start) === key : false;
    });
  }, [sessions, selectedDay]);

  const weekGroups = useMemo(() => groupByWeek(dayFiltered), [dayFiltered]);

  function openCreate() {
    setEditingSession(null);
    setCreateDefaultStart(selectedDay);
    setFormOpen(true);
  }

  function openCreateAt(start: Date) {
    setEditingSession(null);
    setCreateDefaultStart(start);
    setFormOpen(true);
  }

  async function handleSubmit(values: ClassSessionFormSubmitPayload) {
    setIsSubmitting(true);
    try {
      let focusId: string | null = null;
      if (editingSession) {
        await updateClassSession(classId, editingSession.id, values);
        focusId = editingSession.id;
        showAppSuccess({
          title: "Đã cập nhật buổi học",
          description: `Buổi “${values.title}” đã được lưu.`,
        });
      } else {
        const created = await createClassSession({ classId, ...values });
        focusId = created?.data?.id ?? null;
        showAppSuccess({
          title: "Đã tạo buổi học",
          description: `Buổi “${values.title}” đã được thêm vào lịch.`,
        });
      }
      setFormOpen(false);
      setEditingSession(null);
      setCreateDefaultStart(null);
      if (focusId) setPendingFocus({ id: focusId, nonce: Date.now() });
      retry();
    } catch (error) {
      showAppErrorFromUnknown(
        error,
        editingSession ? "classSessions.update" : "classSessions.create",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const deletedId = deleteTarget.id;
    try {
      await deleteClassSession(classId, deletedId);
      showAppSuccess({
        title: "Đã xóa buổi học",
        description: `Buổi “${deleteTarget.title || ""}” đã được xóa.`,
      });
      setDeleteTarget(null);
      mutateSessions((prev) => {
        if (!prev?.data) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            items: prev.data.items.filter((session) => session.id !== deletedId),
            totalCount: Math.max(0, prev.data.totalCount - 1),
          },
        };
      });
      retry();
    } catch (error) {
      showAppErrorFromUnknown(error, "classSessions.delete");
      throw error;
    }
  }

  const columns: ColumnDef<ClassSession>[] = [
    {
      header: "Buổi học",
      render: (session) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">
            {session.title || "Chưa đặt tiêu đề"}
          </p>
          <p className="text-xs text-muted-foreground">
            {CLASS_SESSION_KIND_LABELS[session.sessionKind]}
          </p>
        </div>
      ),
    },
    {
      header: "Thời gian",
      className: "min-w-40 text-xs text-muted-foreground",
      render: (session) => (
        <div className="space-y-0.5">
          <p>{formatApiDateTimeDisplay(session.startTime) || "—"}</p>
          <p>→ {formatApiDateTimeDisplay(session.endTime) || "—"}</p>
        </div>
      ),
    },
    {
      header: "Địa điểm",
      className: "max-w-40 truncate text-sm",
      render: (session) => session.location || "—",
    },
    {
      header: "Trạng thái",
      className: "w-28",
      render: (session) => <ClassSessionStatusBadge status={session.status} />,
    },
    {
      header: "Thao tác",
      className: "w-36 text-right",
      render: (session) => (
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={
              <Link
                href={`/manager/attendance?classId=${classId}&sessionId=${session.id}`}
              />
            }
            aria-label={`Điểm danh ${session.title}`}
            className="size-8 rounded-lg text-muted-foreground hover:bg-[#7CB342]/10 hover:text-[#3d5c22]"
          >
            <ClipboardCheck className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingSession(session);
              setFormOpen(true);
            }}
            aria-label={`Sửa ${session.title}`}
            className="size-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setDeleteTarget(session)}
            aria-label={`Xóa ${session.title}`}
            className="size-8 rounded-lg text-primary hover:bg-primary/10 hover:text-primary"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Lịch học lớp</p>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono font-bold text-foreground">
              {totalCount}
            </span>{" "}
            buổi · chọn ngày trên lịch để lọc danh sách
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={kindFilter}
            onChange={(event) => {
              markLoading();
              setKindFilter(event.target.value);
            }}
            className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm"
            aria-label="Lọc loại buổi"
          >
            <option value="all">Mọi loại</option>
            {Object.entries(CLASS_SESSION_KIND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => {
              markLoading();
              setStatusFilter(event.target.value);
            }}
            className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm"
            aria-label="Lọc trạng thái"
          >
            <option value="all">Mọi trạng thái</option>
            {Object.entries(CLASS_SESSION_STATUS_LABELS).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>
          <Button
            type="button"
            variant="outline"
            onClick={() => setGenerateOpen(true)}
            disabled={totalCount > 0}
            className="h-9 gap-1.5 rounded-lg"
            title={
              totalCount > 0
                ? "Chỉ dùng khi lớp chưa có buổi học nào"
                : undefined
            }
          >
            <Sparkles className="size-3.5" />
            Tạo lịch
          </Button>
          <Button
            type="button"
            onClick={openCreate}
            className="h-9 gap-1.5 rounded-lg bg-primary font-semibold text-white hover:bg-primary/90"
          >
            <Plus className="size-3.5" />
            Tạo buổi
          </Button>
        </div>
      </div>

      {isLoading && sessions.length === 0 ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <SessionCalendar
              sessions={sessions}
              mode="edit"
              focusSession={pendingFocus}
              onSelectDay={(day) => setSelectedDay(day)}
              onSelectSession={(session) => {
                setEditingSession(session);
                setFormOpen(true);
              }}
              onCreateAt={openCreateAt}
            />
          </section>

          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border bg-background/70 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">
                {selectedDay
                  ? `Buổi ngày ${pad(selectedDay.getDate())}/${pad(selectedDay.getMonth() + 1)}`
                  : "Danh sách theo tuần"}
              </p>
              {selectedDay ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDay(null)}
                  className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                >
                  <X className="size-3.5" />
                  Bỏ lọc ngày
                </Button>
              ) : null}
            </div>

            {dayFiltered.length === 0 ? (
              <div className="p-4">
                <ManagerEmptyState
                  title={
                    selectedDay
                      ? "Không có buổi trong ngày này"
                      : "Chưa có buổi học"
                  }
                  description={
                    selectedDay
                      ? "Chọn ngày khác hoặc tạo buổi mới."
                      : "Tạo buổi học đầu tiên cho lớp này."
                  }
                  icon={CalendarDays}
                  actionLabel="Tạo buổi học"
                  onAction={openCreate}
                />
              </div>
            ) : selectedDay ? (
              <div className="overflow-x-auto p-4">
                <ManagerDataTable
                  columns={columns}
                  data={dayFiltered}
                  isLoading={isLoading}
                />
              </div>
            ) : (
              <div className="max-h-[36rem] space-y-4 overflow-y-auto p-4">
                {weekGroups.map((group) => (
                  <div key={group.key} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </p>
                    <ManagerDataTable
                      columns={columns}
                      data={group.sessions}
                      isLoading={false}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <SessionFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditingSession(null);
            setCreateDefaultStart(null);
          }
        }}
        session={editingSession}
        defaultStart={createDefaultStart}
        modules={modules}
        isModulesLoading={isModulesLoading}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        title="Xóa buổi học?"
        description={`Buổi “${deleteTarget?.title || ""}” sẽ bị xóa mềm khỏi lịch lớp.`}
        confirmLabel="Xóa buổi học"
        variant="destructive"
      />

      <GenerateSessionsDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        classId={classId}
        className={cohortName}
        onGenerated={() => {
          markLoading();
          retry();
        }}
      />
    </div>
  );
}
