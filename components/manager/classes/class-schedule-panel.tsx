"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Images,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { ClassDateRange } from "@/components/classes/class-date-range";
import { GenerateSessionsDialog } from "@/components/manager/classes/generate-sessions-dialog";
import { SessionCalendar } from "@/components/manager/classes/session-calendar";
import { SessionEvidenceGalleryDrawer } from "@/components/manager/classes/session-evidence-gallery-drawer";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
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
import { subscribeClassSessionsInvalidate } from "@/lib/classes/session-invalidate-bus";
import {
  canGenerateClassSessions,
  countActiveClassSessions,
  getOccupiedCurriculumItemIds,
} from "@/lib/classes/lifecycle";
import { parseApiDateTime } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import {
  THEME_SELECT_CONTENT,
  THEME_SELECT_ITEM,
  THEME_SELECT_TRIGGER,
} from "@/lib/ui/select-styles";
import { cn } from "@/lib/utils";

type ClassSchedulePanelProps = {
  classId: string;
  cohortName?: string | null;
  programId?: string | null;
  seatsTaken?: number;
  classKind?: "Standard" | "Remedial";
  remedialModuleId?: string | null;
  onSessionsChanged?: () => void;
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
  seatsTaken = 0,
  classKind = "Standard",
  remedialModuleId = null,
  onSessionsChanged,
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
  const [evidenceSession, setEvidenceSession] = useState<ClassSession | null>(null);
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

  useEffect(() => subscribeClassSessionsInvalidate(retry), [retry]);

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
  const activeSessionCount = countActiveClassSessions(sessions);
  const generateGate = canGenerateClassSessions({
    seatsTaken,
    activeSessionCount,
  });
  const occupiedItems = useMemo(
    () => getOccupiedCurriculumItemIds(sessions, editingSession?.id),
    [sessions, editingSession?.id],
  );

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


  function openEvidenceGallery(session: ClassSession) {
    setEvidenceSession(session);
  }

  function openEditSession(session: ClassSession) {
    setEditingSession(session);
    setCreateDefaultStart(null);
    setFormOpen(true);
  }

  function handleCalendarSelectSession(session: ClassSession) {
    if (session.sessionKind === "Offline") {
      openEvidenceGallery(session);
      return;
    }
    openEditSession(session);
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
      onSessionsChanged?.();
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
      onSessionsChanged?.();
    } catch (error) {
      showAppErrorFromUnknown(error, "classSessions.delete");
      throw error;
    }
  }

  const columns: ColumnDef<ClassSession>[] = [
    {
      header: "Session",
      render: (session) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">
            {session.title || "Untitled"}
          </p>
          <p className="text-xs text-muted-foreground">
            {CLASS_SESSION_KIND_LABELS[session.sessionKind]}
          </p>
        </div>
      ),
    },
    {
      header: "Thời gian",
      className: "min-w-36",
      render: (session) => (
        <ClassDateRange
          startDate={session.startTime}
          endDate={session.endTime}
          layout="stack"
        />
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
      className: "w-24 text-right",
      render: (session) => (
        <div className="flex justify-end gap-1">
          {session.sessionKind === "Offline" ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => openEvidenceGallery(session)}
              aria-label={`Xem minh chứng ${session.title}`}
              className="size-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Images className="size-4" />
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => openEditSession(session)}
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
          <Select
            value={kindFilter}
            onValueChange={(value) => {
              markLoading();
              setKindFilter(value ?? "all");
            }}
          >
            <SelectTrigger
              aria-label="Lọc loại buổi"
              className={cn(THEME_SELECT_TRIGGER, "min-w-[9.5rem]")}
            >
              <span className="truncate">
                {kindFilter === "all"
                  ? "All types"
                  : (CLASS_SESSION_KIND_LABELS[
                      kindFilter as ClassSessionKind
                    ] ?? "All types")}
              </span>
            </SelectTrigger>
            <SelectContent
              align="end"
              alignItemWithTrigger={false}
              sideOffset={8}
              className={THEME_SELECT_CONTENT}
            >
              <SelectItem value="all" className={THEME_SELECT_ITEM}>
                All types
              </SelectItem>
              {Object.entries(CLASS_SESSION_KIND_LABELS).map(
                ([value, label]) => (
                  <SelectItem
                    key={value}
                    value={value}
                    className={THEME_SELECT_ITEM}
                  >
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              markLoading();
              setStatusFilter(value ?? "all");
            }}
          >
            <SelectTrigger
              aria-label="Lọc trạng thái"
              className={cn(THEME_SELECT_TRIGGER, "min-w-[11rem]")}
            >
              <span className="truncate">
                {statusFilter === "all"
                  ? "Mọi trạng thái"
                  : (CLASS_SESSION_STATUS_LABELS[
                      statusFilter as ClassSessionStatus
                    ] ?? "Mọi trạng thái")}
              </span>
            </SelectTrigger>
            <SelectContent
              align="end"
              alignItemWithTrigger={false}
              sideOffset={8}
              className={THEME_SELECT_CONTENT}
            >
              <SelectItem value="all" className={THEME_SELECT_ITEM}>
                Mọi trạng thái
              </SelectItem>
              {Object.entries(CLASS_SESSION_STATUS_LABELS).map(
                ([value, label]) => (
                  <SelectItem
                    key={value}
                    value={value}
                    className={THEME_SELECT_ITEM}
                  >
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            onClick={() => setGenerateOpen(true)}
            disabled={!generateGate.ok}
            className="h-9 gap-1.5 rounded-lg"
            title={generateGate.ok ? undefined : generateGate.reason}
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
              onSelectSession={handleCalendarSelectSession}
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
        occupiedActivityIds={occupiedItems.activityIds}
        occupiedAssignmentIds={occupiedItems.assignmentIds}
        classKind={classKind}
        remedialModuleId={remedialModuleId}
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
          onSessionsChanged?.();
        }}
      />
      <SessionEvidenceGalleryDrawer
        open={evidenceSession !== null}
        onOpenChange={(open) => {
          if (!open) setEvidenceSession(null);
        }}
        session={evidenceSession}
        onEditSession={openEditSession}
      />
    </div>
  );
}
