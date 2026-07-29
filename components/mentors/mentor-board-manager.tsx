"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Send,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { ClassStatusBadge } from "@/components/manager/classes/class-status-badge";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerFilterBar } from "@/components/manager/shared/filter-bar";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { ProgramPagination } from "@/components/programs/program-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  createClassMentorRequest,
  getMentorBoard,
  getPrograms,
  type MentorBoardClass,
} from "@/lib/api";
import { CLASS_STATUS_LABELS } from "@/lib/classes/constants";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

type SortValue = "startDate-asc" | "startDate-desc" | "name-asc";

const SORT_OPTIONS = [
  { value: "startDate-asc", label: "Ngày bắt đầu ↑" },
  { value: "startDate-desc", label: "Ngày bắt đầu ↓" },
  { value: "name-asc", label: "Tên A–Z" },
];

const MATCH_SKILL_OPTIONS = [
  { value: "all", label: "Mọi lớp" },
  { value: "matched", label: "Khớp kỹ năng của tôi" },
];

function toSortQuery(sort: SortValue) {
  const [sortBy, direction] = sort.split("-") as ["startDate" | "name", "asc" | "desc"];
  return {
    sortBy,
    isDescending: direction === "desc",
  };
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = formatApiDateTimeDisplay(startDate);
  const end = formatApiDateTimeDisplay(endDate);
  if (!start && !end) return "Chưa có lịch";
  if (start && end) return `${start} → ${end}`;
  return start || end;
}

function BoardCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-6 w-3/4" />
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-2/3" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-5 h-10 w-full rounded-lg" />
    </div>
  );
}

type BoardClassCardProps = {
  classItem: MentorBoardClass;
  onApply: (classItem: MentorBoardClass) => void;
  onViewRequests?: () => void;
};

function BoardClassCard({
  classItem,
  onApply,
  onViewRequests,
}: BoardClassCardProps) {
  const displayName = classItem.name?.trim() || classItem.code?.trim() || "Lớp học";
  const displayCode = classItem.code?.trim();

  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {displayCode ? (
            <p className="font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {displayCode}
            </p>
          ) : null}
          <h3 className="mt-1 font-heading text-lg font-bold text-foreground">
            {displayName}
          </h3>
        </div>
        <ClassStatusBadge status={classItem.status} />
      </div>

      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-[#4FC3F7]" />
          {formatDateRange(classItem.startDate, classItem.endDate)}
        </p>
        {classItem.scheduleSummary ? (
          <p className="flex items-start gap-2">
            <Clock3 className="mt-0.5 size-4 shrink-0 text-[#7E57C2] dark:text-[#a78bfa]" />
            <span>{classItem.scheduleSummary}</span>
          </p>
        ) : null}
        <p className="flex items-center gap-2">
          <UsersRound className="size-4 shrink-0 text-[#7CB342] dark:text-[#b8e086]" />
          Sức chứa {classItem.maxCapacity} học viên
          {classItem.pendingRequestCount > 0
            ? ` · ${classItem.pendingRequestCount} yêu cầu đang chờ`
            : ""}
        </p>
      </div>

      {classItem.requiredSkills.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {classItem.requiredSkills.map((skill) => (
            <Badge
              key={skill.id}
              variant="outline"
              className="rounded-full border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground"
            >
              {skill.name || skill.code || "Kỹ năng"}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {classItem.matchesMySkills ? (
          <Badge className="rounded-full bg-[#7CB342]/15 px-2.5 py-0.5 text-xs font-semibold text-[#3d5c22] hover:bg-[#7CB342]/15 dark:text-[#b8e086]">
            <Sparkles className="mr-1 size-3" />
            Khớp kỹ năng
          </Badge>
        ) : null}
        <Badge
          variant="outline"
          className="rounded-full border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
        >
          {CLASS_STATUS_LABELS[classItem.status]}
        </Badge>
      </div>

      <div className="mt-auto pt-5">
        {classItem.hasPendingRequestFromMe ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled
              className="h-10 flex-1 rounded-lg border-[#4FC3F7]/30 bg-[#4FC3F7]/10 text-[#0d6e9c] dark:text-[#7dd3fc]"
            >
              <CheckCircle2 className="size-4" />
              Đã gửi yêu cầu
            </Button>
            {onViewRequests ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onViewRequests}
                className="h-10 rounded-lg text-muted-foreground hover:text-foreground"
              >
                Xem yêu cầu
              </Button>
            ) : null}
          </div>
        ) : (
          <Button
            type="button"
            onClick={() => onApply(classItem)}
            className="h-10 w-full rounded-lg bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Send className="size-4" />
            Đăng ký dạy lớp
          </Button>
        )}
      </div>
    </article>
  );
}

export type MentorBoardManagerProps = {
  /** Hide page header when nested in assignment hub. */
  embedded?: boolean;
  /** Tighter card grid when hub shows a side panel. */
  denserGrid?: boolean;
  /** Called after a request is submitted successfully. */
  onApplied?: () => void;
  /** Open / focus the requests panel (embedded hub). */
  onViewRequests?: () => void;
};

export function MentorBoardManager({
  embedded = false,
  denserGrid = false,
  onApplied,
  onViewRequests,
}: MentorBoardManagerProps = {}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [matchSkillsFilter, setMatchSkillsFilter] = useState("all");
  const [sort, setSort] = useState<SortValue>("startDate-asc");
  const [page, setPage] = useState(1);
  const [applyTarget, setApplyTarget] = useState<MentorBoardClass | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { data: programsData } = useClientFetch({
    fetcher: () => getPrograms({ page: 1, pageSize: 100 }),
    deps: [],
    onError: () => undefined,
  });

  const programOptions = useMemo(() => {
    const items = programsData?.data?.items ?? [];
    return [
      { value: "all", label: "Mọi chương trình" },
      ...items.map((program) => ({
        value: program.id,
        label: program.name?.trim() || program.code?.trim() || "Chương trình",
      })),
    ];
  }, [programsData]);

  const sortQuery = toSortQuery(sort);

  const { data, isLoading, markLoading, retry } = useClientFetch({
    fetcher: () =>
      getMentorBoard({
        search: debouncedSearch || undefined,
        programId: programFilter === "all" ? undefined : programFilter,
        matchMySkills: matchSkillsFilter === "matched" ? true : undefined,
        page,
        pageSize: 12,
        sortBy: sortQuery.sortBy,
        isDescending: sortQuery.isDescending,
      }),
    deps: [debouncedSearch, programFilter, matchSkillsFilter, page, sort],
    onError: (error) => showAppErrorFromUnknown(error, "classMentorRequests.board"),
  });

  const classes = data?.data?.items ?? [];
  const pagination = data?.data;

  const hasActiveFilters =
    search.trim() !== "" ||
    programFilter !== "all" ||
    matchSkillsFilter !== "all" ||
    sort !== "startDate-asc";

  function handleFilterChange<T>(setter: (value: T) => void, value: T) {
    markLoading();
    setter(value);
    setPage(1);
  }

  function handleClearFilters() {
    markLoading();
    setSearch("");
    setDebouncedSearch("");
    setProgramFilter("all");
    setMatchSkillsFilter("all");
    setSort("startDate-asc");
    setPage(1);
  }

  async function handleApplyConfirm() {
    if (!applyTarget) return;
    setIsSubmitting(true);
    try {
      await createClassMentorRequest({
        classId: applyTarget.id,
        message: message.trim() || null,
      });
      showAppSuccess({
        title: "Đã gửi yêu cầu",
        description: `Yêu cầu dạy lớp ${applyTarget.name || applyTarget.code || ""} đang chờ quản lý duyệt.`,
      });
      setApplyTarget(null);
      setMessage("");
      retry();
      onApplied?.();
    } catch (error) {
      showAppErrorFromUnknown(error, "classMentorRequests.create");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={cn("flex min-h-full flex-col", embedded && "min-h-0")}>
      {embedded ? null : (
        <ManagerPageHeader
          title="Bảng lớp"
          description="Xem các lớp đang tuyển mentor và gửi yêu cầu đăng ký dạy."
        />
      )}

      <ManagerFilterBar
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
        }}
        searchPlaceholder="Tìm theo tên hoặc mã lớp..."
        filters={[
          {
            key: "program",
            placeholder: "Chương trình",
            value: programFilter,
            onChange: (value) => handleFilterChange(setProgramFilter, value),
            options: programOptions,
            wide: true,
          },
          {
            key: "skills",
            placeholder: "Kỹ năng",
            value: matchSkillsFilter,
            onChange: (value) => handleFilterChange(setMatchSkillsFilter, value),
            options: MATCH_SKILL_OPTIONS,
          },
          {
            key: "sort",
            placeholder: "Sắp xếp",
            value: sort,
            onChange: (value) => handleFilterChange(setSort, value as SortValue),
            options: SORT_OPTIONS,
          },
        ]}
        showClear={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />

      <div className={cn("flex-1 py-6", embedded ? "px-4 lg:px-6" : "px-6")}>
        {isLoading && classes.length === 0 ? (
          <div
            className={cn(
              "grid gap-4 md:grid-cols-2",
              !denserGrid && "xl:grid-cols-3",
            )}
          >
            {[...Array(6)].map((_, index) => (
              <BoardCardSkeleton key={index} />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <ManagerEmptyState
            title="Chưa có lớp phù hợp"
            description="Thử đổi bộ lọc hoặc quay lại sau khi có lớp mới mở tuyển mentor."
            actionLabel={hasActiveFilters ? "Xóa bộ lọc" : undefined}
            onAction={hasActiveFilters ? handleClearFilters : undefined}
          />
        ) : (
          <>
            <div
              className={cn(
                "grid gap-4 md:grid-cols-2",
                !denserGrid && "xl:grid-cols-3",
                isLoading && "opacity-60",
              )}
            >
              {classes.map((classItem) => (
                <BoardClassCard
                  key={classItem.id}
                  classItem={classItem}
                  onApply={setApplyTarget}
                  onViewRequests={onViewRequests}
                />
              ))}
            </div>

            {pagination ? (
              <ProgramPagination
                theme="light"
                className="mt-8"
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                hasPrevious={pagination.hasPrevious}
                hasNext={pagination.hasNext}
                onPageChange={(nextPage) => {
                  markLoading();
                  setPage(nextPage);
                }}
              />
            ) : null}
          </>
        )}
      </div>

      <Dialog
        open={applyTarget != null}
        onOpenChange={(open) => {
          if (!open) {
            setApplyTarget(null);
            setMessage("");
          }
        }}
      >
        <DialogPopup className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Gửi yêu cầu dạy lớp</DialogTitle>
            <DialogDescription>
              {applyTarget
                ? `Bạn muốn đăng ký dạy lớp ${applyTarget.name || applyTarget.code || ""}. Quản lý sẽ xem xét và phản hồi.`
                : null}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label
              htmlFor="mentor-request-message"
              className="text-sm font-medium text-foreground"
            >
              Lời nhắn (tuỳ chọn)
            </label>
            <Textarea
              id="mentor-request-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Chia sẻ kinh nghiệm hoặc lý do bạn phù hợp với lớp này..."
              rows={4}
              maxLength={1000}
              className="resize-none border-border bg-background/60"
            />
            <p className="text-right text-xs text-muted-foreground">
              {message.length}/1000
            </p>
          </div>

          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline" className="rounded-lg" />
              }
            >
              Huỷ
            </DialogClose>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleApplyConfirm}
              className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
