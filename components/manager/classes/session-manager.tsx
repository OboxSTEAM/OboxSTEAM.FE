"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ClipboardCheck,
  Pencil,
  Plus,
  Trash2,
  CalendarDays,
  LayoutGrid,
  List,
} from "lucide-react";

import {
  SessionFormDialog,
  type ClassSessionFormSubmitPayload,
} from "@/components/manager/classes/session-form-dialog";
import { SessionCalendar } from "@/components/manager/classes/session-calendar";
import { ClassSessionStatusBadge } from "@/components/manager/classes/class-status-badge";
import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  createClassSession,
  deleteClassSession,
  getClasses,
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
} from "@/lib/classes/constants";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

function SessionManagerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId") ?? "";

  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [search, setSearch] = useState("");
  const [sessionKind, setSessionKind] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const isCalendar = viewMode === "calendar";
  const [formOpen, setFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ClassSession | null>(
    null,
  );
  const [createDefaultStart, setCreateDefaultStart] = useState<Date | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<ClassSession | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFocus, setPendingFocus] = useState<{
    id: string;
    nonce: number;
  } | null>(null);

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

  const {
    data: sessionsData,
    isLoading: isSessionsLoading,
    markLoading,
    retry,
    mutate: mutateSessions,
  } = useClientFetch({
    enabled: !!classId,
    fetcher: async () =>
      getClassSessions(classId, {
        sortBy: "startTime",
        isDescending: false,
        page: isCalendar ? 1 : page,
        pageSize: isCalendar ? 200 : 10,
        sessionKind:
          sessionKind === "all"
            ? undefined
            : (sessionKind as ClassSessionKind),
        status:
          status === "all" ? undefined : (status as ClassSessionStatus),
      }),
    deps: [classId, page, sessionKind, status, viewMode],
    onError: (error) => showAppErrorFromUnknown(error, "classSessions.list"),
  });

  const selectedClass = classesData?.data?.items.find(
    (item) => item.id === classId,
  );
  const selectedProgramId = selectedClass?.programId;

  const { data: modulesData, isLoading: isModulesLoading } = useClientFetch({
    enabled: !!selectedProgramId,
    fetcher: () =>
      getModules({
        page: 1,
        pageSize: 100,
        sortBy: "name",
      }),
    deps: [selectedProgramId],
    onError: (error) => showAppErrorFromUnknown(error, "generic"),
  });

  const classes = classesData?.data?.items ?? [];
  const modules = useMemo(() => {
    const all = modulesData?.data?.items ?? [];
    if (!selectedProgramId) return all;
    return all.filter((module) => module.programId === selectedProgramId);
  }, [modulesData?.data?.items, selectedProgramId]);

  const totalPages = sessionsData?.data?.totalPages ?? 1;
  const totalCount = sessionsData?.data?.totalCount ?? 0;

  const filteredSessions = useMemo(() => {
    const items = sessionsData?.data?.items ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (session) =>
        session.title?.toLowerCase().includes(q) ||
        session.location?.toLowerCase().includes(q),
    );
  }, [search, sessionsData?.data?.items]);

  function updateClassId(nextClassId: string) {
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (nextClassId) params.set("classId", nextClassId);
    else params.delete("classId");
    router.replace(`/manager/sessions?${params.toString()}`);
  }

  function openCreate() {
    setEditingSession(null);
    setCreateDefaultStart(null);
    setFormOpen(true);
  }

  function openCreateAt(start: Date) {
    setEditingSession(null);
    setCreateDefaultStart(start);
    setFormOpen(true);
  }

  async function handleSubmit(values: ClassSessionFormSubmitPayload) {
    if (!classId) return;
    setIsSubmitting(true);
    try {
      let focusId: string | null = null;

      if (editingSession) {
        const updated = await updateClassSession(
          classId,
          editingSession.id,
          values,
        );
        focusId = editingSession.id;
        const nextSession = updated.data;
        if (nextSession) {
          mutateSessions((prev) => {
            if (!prev?.data) return prev;
            return {
              ...prev,
              data: {
                ...prev.data,
                items: prev.data.items.map((session) =>
                  session.id === nextSession.id ? nextSession : session,
                ),
              },
            };
          });
        }
        showAppSuccess({
          title: "Đã cập nhật buổi học",
          description: `Buổi “${values.title}” đã được lưu.`,
        });
      } else {
        const created = await createClassSession({
          classId,
          ...values,
        });
        const nextSession = created.data;
        focusId = nextSession?.id ?? null;
        if (nextSession) {
          mutateSessions((prev) => {
            if (!prev?.data) {
              return {
                code: created.code,
                message: created.message,
                data: {
                  items: [nextSession],
                  currentPage: 1,
                  pageSize: isCalendar ? 200 : 10,
                  totalCount: 1,
                  totalPages: 1,
                  hasNext: false,
                  hasPrevious: false,
                },
              };
            }
            const exists = prev.data.items.some((s) => s.id === nextSession.id);
            return {
              ...prev,
              data: {
                ...prev.data,
                items: exists
                  ? prev.data.items.map((s) =>
                      s.id === nextSession.id ? nextSession : s,
                    )
                  : [...prev.data.items, nextSession],
                totalCount: exists
                  ? prev.data.totalCount
                  : prev.data.totalCount + 1,
              },
            };
          });
        }
        showAppSuccess({
          title: "Đã tạo buổi học",
          description: `Buổi “${values.title}” đã được thêm vào lịch.`,
        });
      }
      setFormOpen(false);
      setEditingSession(null);
      setCreateDefaultStart(null);
      setViewMode("calendar");
      if (focusId) {
        setPendingFocus({ id: focusId, nonce: Date.now() });
      }
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
    if (!deleteTarget || !classId) return;
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
          <p className="truncate font-semibold text-[#2D2D2D]">
            {session.title || "Chưa đặt tiêu đề"}
          </p>
          <p className="text-xs text-[#6B6B6B]">
            {CLASS_SESSION_KIND_LABELS[session.sessionKind]}
          </p>
        </div>
      ),
    },
    {
      header: "Thời gian",
      className: "min-w-44 text-xs text-[#6B6B6B]",
      render: (session) => (
        <div className="space-y-0.5">
          <p>{formatApiDateTimeDisplay(session.startTime) || "—"}</p>
          <p>→ {formatApiDateTimeDisplay(session.endTime) || "—"}</p>
        </div>
      ),
    },
    {
      header: "Địa điểm",
      className: "max-w-48 truncate text-sm",
      render: (session) => session.location || "—",
    },
    {
      header: "Trạng thái",
      className: "w-32",
      render: (session) => (
        <ClassSessionStatusBadge status={session.status} />
      ),
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
            className="size-9 rounded-lg text-[#6B6B6B] hover:bg-[#7CB342]/10 hover:text-[#3d5c22]"
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
            className="size-9 rounded-lg text-[#6B6B6B] hover:bg-[#F5F5F0] hover:text-[#2D2D2D]"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setDeleteTarget(session)}
            aria-label={`Xóa ${session.title}`}
            className="size-9 rounded-lg text-[#E94B3C] hover:bg-[#E94B3C]/10 hover:text-[#C9362B]"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <ManagerPageHeader
        title="Lịch học"
        description="Quản lý buổi học theo từng lớp cohort."
      >
        <div className="flex items-center rounded-xl border border-[#D8D8D2] bg-white p-1">
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            aria-pressed={isCalendar}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition",
              isCalendar
                ? "bg-[#E94B3C] text-white"
                : "text-[#6B6B6B] hover:bg-[#F5F5F0]",
            )}
          >
            <LayoutGrid className="size-4" />
            Lịch
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            aria-pressed={!isCalendar}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition",
              !isCalendar
                ? "bg-[#E94B3C] text-white"
                : "text-[#6B6B6B] hover:bg-[#F5F5F0]",
            )}
          >
            <List className="size-4" />
            Danh sách
          </button>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          disabled={!classId}
          className="h-11 gap-2 rounded-xl bg-[#E94B3C] px-5 font-semibold text-white hover:bg-[#D94134] active:scale-[0.98] disabled:opacity-50"
        >
          <Plus className="size-4" />
          Tạo buổi học
        </Button>
      </ManagerPageHeader>

      <div className="px-6 pb-12">
        <div className="overflow-hidden rounded-2xl border border-[#E5E5E0] bg-white shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
          <div className="flex flex-col gap-3 border-b border-[#E5E5E0] bg-[#FAFAF5]/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-[#6B6B6B]">
                Lớp đang xem
              </p>
              <Select
                value={classId || null}
                onValueChange={(value) => updateClassId(value ?? "")}
                disabled={isClassesLoading}
              >
                <SelectTrigger className={cn(LIGHT_SELECT_TRIGGER, "max-w-[22rem]")}>
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
            <p className="text-xs text-[#6B6B6B]">
              <span className="font-mono font-bold text-[#2D2D2D]">
                {classId ? totalCount : 0}
              </span>{" "}
              buổi học
            </p>
          </div>

          {classId ? (
            <>
              <ManagerFilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Tìm theo tiêu đề hoặc địa điểm..."
                filters={[
                  {
                    key: "kind",
                    placeholder: "Loại buổi",
                    value: sessionKind,
                    onChange: (value) => {
                      markLoading();
                      setSessionKind(value || "all");
                      setPage(1);
                    },
                    options: [
                      { value: "all", label: "Mọi loại" },
                      ...Object.entries(CLASS_SESSION_KIND_LABELS).map(
                        ([value, label]) => ({ value, label }),
                      ),
                    ],
                  },
                  {
                    key: "status",
                    placeholder: "Trạng thái",
                    value: status,
                    onChange: (value) => {
                      markLoading();
                      setStatus(value || "all");
                      setPage(1);
                    },
                    options: [
                      { value: "all", label: "Mọi trạng thái" },
                      ...Object.entries(CLASS_SESSION_STATUS_LABELS).map(
                        ([value, label]) => ({ value, label }),
                      ),
                    ],
                  },
                ]}
                showClear={
                  search !== "" || sessionKind !== "all" || status !== "all"
                }
                onClearFilters={() => {
                  markLoading();
                  setSearch("");
                  setSessionKind("all");
                  setStatus("all");
                  setPage(1);
                }}
              />
              {isCalendar ? (
                filteredSessions.length === 0 && !isSessionsLoading ? (
                  <div className="p-6">
                    <ManagerEmptyState
                      title="Chưa có buổi học"
                      description="Tạo buổi học đầu tiên cho lớp này để bắt đầu lịch cohort."
                      icon={CalendarDays}
                      actionLabel="Tạo buổi học"
                      onAction={openCreate}
                    />
                  </div>
                ) : (
                  <SessionCalendar
                    sessions={filteredSessions}
                    focusSession={pendingFocus}
                    onSelectSession={(session) => {
                      setCreateDefaultStart(null);
                      setEditingSession(session);
                      setFormOpen(true);
                    }}
                    onCreateAt={openCreateAt}
                  />
                )
              ) : (
                <div className="overflow-x-auto p-6">
                  <ManagerDataTable
                    columns={columns}
                    data={filteredSessions}
                    isLoading={isSessionsLoading}
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={(nextPage) => {
                      markLoading();
                      setPage(nextPage);
                    }}
                    emptyState={
                      <ManagerEmptyState
                        title="Chưa có buổi học"
                        description="Tạo buổi học đầu tiên cho lớp này để bắt đầu lịch cohort."
                        icon={CalendarDays}
                        actionLabel="Tạo buổi học"
                        onAction={openCreate}
                      />
                    }
                  />
                </div>
              )}
            </>
          ) : (
            <div className="p-6">
              <ManagerEmptyState
                title="Chọn lớp để xem lịch"
                description="Chọn một lớp ở phía trên hoặc mở từ trang Quản lý lớp học."
                icon={CalendarDays}
                actionLabel="Đến danh sách lớp"
                actionHref="/manager/classes"
              />
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
}

export function SessionManager() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6">
          <ManagerPageHeader
            title="Lịch học"
            description="Đang tải..."
          />
        </div>
      }
    >
      <SessionManagerInner />
    </Suspense>
  );
}
