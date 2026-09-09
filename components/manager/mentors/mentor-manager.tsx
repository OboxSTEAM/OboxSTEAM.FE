"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Plus } from "lucide-react";

import { MentorFormDialog } from "@/components/manager/mentors/mentor-form-dialog";
import {
  ManagerDataTable,
  type ColumnDef,
} from "@/components/manager/shared/data-table";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerFilterBar } from "@/components/manager/shared/filter-bar";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  createMentorAccount,
  getMentors,
  type Mentor,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import type { CreateMentorAccountInput } from "@/lib/validations/mentors";

const PAGE_SIZE = 10;

function getInitials(name: string | null): string {
  if (!name?.trim()) return "M";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function MentorManager() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, markLoading, retry } = useClientFetch({
    fetcher: () =>
      getMentors({
        search: debouncedSearch || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    deps: [debouncedSearch, page],
    onError: (error) => showAppErrorFromUnknown(error, "mentors.list"),
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const mentors = data?.data?.items ?? [];
  const totalPages = data?.data?.totalPages ?? 1;
  const totalCount = data?.data?.totalCount ?? 0;

  async function handleCreate(values: CreateMentorAccountInput) {
    setIsSubmitting(true);
    try {
      await createMentorAccount(values);
      showAppSuccess({
        title: "Đã tạo Mentor",
        description: `${values.fullName} đã được tạo. Mật khẩu tạm đã gửi tới ${values.email}.`,
      });
      setFormOpen(false);
      retry();
    } catch (error) {
      showAppErrorFromUnknown(error, "mentors.create");
    } finally {
      setIsSubmitting(false);
    }
  }

  const columns: ColumnDef<Mentor>[] = [
    {
      header: "Mentor",
      render: (mentor) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-10 border border-border">
            <AvatarImage
              src={mentor.avatarUrl || undefined}
              alt={mentor.fullName || mentor.code || "Mentor"}
            />
            <AvatarFallback className="bg-primary/10 font-heading text-xs font-bold text-primary">
              {getInitials(mentor.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">
              {mentor.fullName || "Chưa cập nhật tên"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {mentor.email || "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Mã",
      className: "w-28",
      render: (mentor) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {mentor.code || "—"}
        </span>
      ),
    },
    {
      header: "Trạng thái",
      className: "w-28",
      render: (mentor) => (
        <Badge
          variant="secondary"
          className={
            mentor.status === "Active"
              ? "rounded-md bg-emerald-500/10 text-[11px] text-emerald-700 dark:text-emerald-400"
              : "rounded-md bg-muted text-[11px] text-muted-foreground"
          }
        >
          {mentor.status === "Active" ? "Hoạt động" : "Khoá"}
        </Badge>
      ),
    },
    {
      header: "Lớp đang dạy",
      className: "w-32 tabular-nums",
      render: (mentor) => (
        <span className="text-sm text-foreground">
          {mentor.assignedClassCount}
          <span className="text-muted-foreground">
            {" "}
            / {mentor.effectiveMaxConcurrentClasses}
          </span>
        </span>
      ),
    },
    {
      header: "Tổ chức",
      className: "max-w-48",
      render: (mentor) => (
        <span className="block truncate" title={mentor.organization ?? undefined}>
          {mentor.organization || "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <ManagerPageHeader
        title="Mentor"
        description="Tạo tài khoản mentor và theo dõi tải lớp đang phụ trách."
        breadcrumbs={[{ label: "Mentor" }]}
      >
        <Button
          type="button"
          className="h-10 gap-1.5 rounded-xl font-semibold"
          onClick={() => setFormOpen(true)}
        >
          <Plus className="size-4" />
          Tạo Mentor
        </Button>
      </ManagerPageHeader>

      <div className="px-6 pb-12">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
          <div className="flex items-center justify-between border-b border-border bg-background/70 px-6 py-3">
            <p className="text-xs font-medium text-muted-foreground">
              <span className="font-mono font-bold text-foreground">
                {totalCount}
              </span>{" "}
              mentor trong hệ thống
            </p>
          </div>

          <ManagerFilterBar
            searchValue={search}
            onSearchChange={(value) => {
              markLoading();
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder="Tìm theo tên hoặc email…"
            showClear={search !== ""}
            onClearFilters={() => {
              markLoading();
              setSearch("");
              setPage(1);
            }}
          />

          <div className="p-6">
            <ManagerDataTable
              columns={columns}
              data={mentors}
              isLoading={isLoading}
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(nextPage) => {
                markLoading();
                setPage(nextPage);
              }}
              emptyState={
                <ManagerEmptyState
                  icon={GraduationCap}
                  title="Chưa có mentor"
                  description="Tạo tài khoản mentor để họ đăng nhập, nhận lớp và giảng dạy."
                />
              }
            />
          </div>
        </div>
      </div>

      <MentorFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        isSubmitting={isSubmitting}
        onSubmit={handleCreate}
      />
    </div>
  );
}
