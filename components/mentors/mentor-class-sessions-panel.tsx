"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardCheck,
  LayoutGrid,
  List,
  MapPin,
} from "lucide-react";

import { SessionCalendar } from "@/components/manager/classes/session-calendar";
import { ClassSessionStatusBadge } from "@/components/manager/classes/class-status-badge";
import {
  ManagerDataTable,
  type ColumnDef,
} from "@/components/manager/shared/data-table";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerFilterBar } from "@/components/manager/shared/filter-bar";
import { Button } from "@/components/ui/button";
import type { ClassSession } from "@/lib/api";
import {
  CLASS_SESSION_KIND_LABELS,
  CLASS_SESSION_STATUS_LABELS,
} from "@/lib/classes/constants";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { cn } from "@/lib/utils";

type MentorClassSessionsPanelProps = {
  sessions: ClassSession[];
  isLoading?: boolean;
  onTakeAttendance: (session: ClassSession) => void;
};

export function MentorClassSessionsPanel({
  sessions,
  isLoading = false,
  onTakeAttendance,
}: MentorClassSessionsPanelProps) {
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [search, setSearch] = useState("");
  const [sessionKind, setSessionKind] = useState("all");
  const [status, setStatus] = useState("all");

  const isCalendar = viewMode === "calendar";

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessions.filter((session) => {
      if (sessionKind !== "all" && session.sessionKind !== sessionKind) {
        return false;
      }
      if (status !== "all" && session.status !== status) {
        return false;
      }
      if (!q) return true;
      return (
        session.title?.toLowerCase().includes(q) ||
        session.location?.toLowerCase().includes(q) ||
        false
      );
    });
  }, [sessions, search, sessionKind, status]);

  const columns: ColumnDef<ClassSession>[] = useMemo(
    () => [
      {
        header: "Buổi học",
        render: (session) => (
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">
              {session.title || "Buổi học"}
            </p>
            <p className="text-xs text-muted-foreground">
              {CLASS_SESSION_KIND_LABELS[session.sessionKind] ??
                session.sessionKind}
            </p>
          </div>
        ),
      },
      {
        header: "Thời gian",
        className: "min-w-44 text-xs text-muted-foreground",
        render: (session) => (
          <div className="space-y-0.5">
            <p>{formatApiDateTimeDisplay(session.startTime) || "—"}</p>
            <p>→ {formatApiDateTimeDisplay(session.endTime) || "—"}</p>
          </div>
        ),
      },
      {
        header: "Địa điểm",
        className: "min-w-0 max-w-[13rem] w-[13rem] overflow-hidden",
        render: (session) => {
          const location = session.location?.trim();
          if (!location) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }

          const isUrl = /^https?:\/\//i.test(location);

          return (
            <div className="flex min-w-0 max-w-full items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              {isUrl ? (
                <a
                  href={location}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={location}
                  className="min-w-0 flex-1 truncate text-primary hover:underline"
                >
                  {location}
                </a>
              ) : (
                <span title={location} className="min-w-0 flex-1 truncate">
                  {location}
                </span>
              )}
            </div>
          );
        },
      },
      {
        header: "Trạng thái",
        className: "w-40 whitespace-nowrap",
        render: (session) => (
          <ClassSessionStatusBadge status={session.status} />
        ),
      },
      {
        header: "",
        className: "w-36 whitespace-nowrap text-right",
        render: (session) =>
          session.requiresAttendance ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onTakeAttendance(session)}
              className="h-8 rounded-lg border-border"
            >
              <ClipboardCheck className="size-3.5" />
              Điểm danh
            </Button>
          ) : null,
      },
    ],
    [onTakeAttendance],
  );

  const hasFilters =
    search.trim() !== "" || sessionKind !== "all" || status !== "all";

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border bg-muted/40 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-3 sm:justify-start">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CalendarDays className="size-4 text-primary" />
            Lịch buổi học
          </p>
          <p className="font-mono text-xs text-muted-foreground sm:hidden">
            {filteredSessions.length}/{sessions.length} buổi
          </p>
        </div>

        <div className="flex items-center gap-3">
          <p className="hidden font-mono text-xs text-muted-foreground sm:block">
            <span className="font-bold text-foreground">
              {filteredSessions.length}
            </span>
            {hasFilters ? ` / ${sessions.length}` : ""} buổi
          </p>
          <div className="inline-flex rounded-xl border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              aria-pressed={isCalendar}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition",
                isCalendar
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
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
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <List className="size-4" />
              Danh sách
            </button>
          </div>
        </div>
      </div>

      <ManagerFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm theo tiêu đề hoặc địa điểm..."
        filters={[
          {
            key: "kind",
            placeholder: "Loại buổi",
            value: sessionKind,
            onChange: (value) => setSessionKind(value || "all"),
            options: [
              { value: "all", label: "Mọi loại" },
              ...Object.entries(CLASS_SESSION_KIND_LABELS).map(
                ([value, label]) => ({
                  value,
                  label,
                }),
              ),
            ],
          },
          {
            key: "status",
            placeholder: "Trạng thái",
            value: status,
            onChange: (value) => setStatus(value || "all"),
            options: [
              { value: "all", label: "Mọi trạng thái" },
              ...Object.entries(CLASS_SESSION_STATUS_LABELS).map(
                ([value, label]) => ({
                  value,
                  label,
                }),
              ),
            ],
          },
        ]}
        showClear={hasFilters}
        onClearFilters={() => {
          setSearch("");
          setSessionKind("all");
          setStatus("all");
        }}
      />

      {isCalendar ? (
        filteredSessions.length === 0 && !isLoading ? (
          <div className="p-6">
            <ManagerEmptyState
              title={hasFilters ? "Không có buổi khớp bộ lọc" : "Chưa có buổi học"}
              description={
                hasFilters
                  ? "Thử xóa bộ lọc để xem toàn bộ lịch lớp."
                  : "Quản lý sẽ tạo lịch học cho lớp. Bạn có thể điểm danh khi buổi học sẵn sàng."
              }
              icon={CalendarDays}
              actionLabel={hasFilters ? "Xóa bộ lọc" : undefined}
              onAction={
                hasFilters
                  ? () => {
                      setSearch("");
                      setSessionKind("all");
                      setStatus("all");
                    }
                  : undefined
              }
            />
          </div>
        ) : (
          <div className={cn(isLoading && "opacity-60")}>
            <SessionCalendar
              sessions={filteredSessions}
              onSelectSession={(session) => {
                if (session.requiresAttendance) {
                  onTakeAttendance(session);
                }
              }}
            />
          </div>
        )
      ) : (
        <div className="overflow-x-auto p-6">
          <ManagerDataTable
            columns={columns}
            data={filteredSessions}
            isLoading={isLoading}
            emptyState={
              <ManagerEmptyState
                title={hasFilters ? "Không có buổi khớp bộ lọc" : "Chưa có buổi học"}
                description={
                  hasFilters
                    ? "Thử xóa bộ lọc để xem toàn bộ lịch lớp."
                    : "Quản lý sẽ tạo lịch học cho lớp. Bạn có thể điểm danh khi buổi học sẵn sàng."
                }
                icon={CalendarDays}
              />
            }
          />
        </div>
      )}
    </section>
  );
}
