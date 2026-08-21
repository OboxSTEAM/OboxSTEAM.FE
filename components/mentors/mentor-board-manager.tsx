"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Send,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { ClassDateRange } from "@/components/classes/class-date-range";
import { ClassScheduleSummary } from "@/components/classes/class-schedule-summary";
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
  getClassById,
  getMentorBoard,
  getMyClassMentorRequests,
  getMyMentorSkills,
  getPrograms,
  type ClassMentorRequest,
  type MentorBoardClass,
} from "@/lib/api";
import type { SkillSummary } from "@/lib/api/entities/skill";
import { isMentorBoardClass } from "@/lib/classes/constants";
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

type UnifiedBoardItem =
  | { kind: "board"; classItem: MentorBoardClass; priority: number }
  | { kind: "approved"; request: ClassMentorRequest; priority: number };

function boardPriority(classItem: MentorBoardClass): number {
  if (classItem.hasPendingRequestFromMe) return 0;
  return 2;
}

function toSortQuery(sort: SortValue) {
  const [sortBy, direction] = sort.split("-") as ["startDate" | "name", "asc" | "desc"];
  return {
    sortBy,
    isDescending: direction === "desc",
  };
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
  mySkillIds: Set<string>;
  onApply: (classItem: MentorBoardClass) => void;
  onViewRequests?: () => void;
};

function RequiredSkillChips({
  requiredSkills,
  mySkillIds,
  className,
}: {
  requiredSkills: SkillSummary[];
  mySkillIds: Set<string>;
  className?: string;
}) {
  if (requiredSkills.length === 0) return null;

  const matchedCount = requiredSkills.filter((skill) =>
    mySkillIds.has(skill.id),
  ).length;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Kỹ năng lớp yêu cầu
        </p>
        <span
          className={cn(
            "rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums",
            matchedCount === requiredSkills.length
              ? "bg-[#7CB342]/15 text-[#3d5c22] dark:text-[#b8e086]"
              : matchedCount > 0
                ? "bg-[#4FC3F7]/12 text-[#0d6e9c] dark:text-[#7dd3fc]"
                : "bg-muted text-muted-foreground",
          )}
        >
          {matchedCount}/{requiredSkills.length} khớp
        </span>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {requiredSkills.map((skill) => {
          const matched = mySkillIds.has(skill.id);
          return (
            <li key={skill.id}>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  matched
                    ? "border-[#7CB342]/40 bg-[#7CB342]/12 text-[#3d5c22] dark:text-[#b8e086]"
                    : "border-dashed border-border bg-background text-muted-foreground",
                )}
              >
                {matched ? (
                  <CheckCircle2 className="mr-1 size-3 shrink-0" aria-hidden />
                ) : null}
                {skill.name || skill.code || "Kỹ năng"}
              </Badge>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BoardClassCard({
  classItem,
  mySkillIds,
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

      <div className="mt-4 space-y-3 text-sm text-muted-foreground">
        <div className="flex items-start gap-2">
          <CalendarDays className="mt-0.5 size-4 shrink-0 text-[#4FC3F7]" />
          <ClassDateRange
            startDate={classItem.startDate}
            endDate={classItem.endDate}
            layout="inline"
            className="min-w-0"
          />
        </div>
        {classItem.scheduleSummary ? (
          <div className="flex items-start gap-2">
            <Clock3 className="mt-0.5 size-4 shrink-0 text-[#7E57C2] dark:text-[#a78bfa]" />
            <ClassScheduleSummary
              summary={classItem.scheduleSummary}
              className="text-sm text-muted-foreground [&_p]:text-muted-foreground [&_p.font-medium]:text-foreground"
            />
          </div>
        ) : null}
        <p className="flex items-center gap-2">
          <UsersRound className="size-4 shrink-0 text-[#7CB342] dark:text-[#b8e086]" />
          Sức chứa {classItem.maxCapacity} học viên
          {classItem.pendingRequestCount > 0
            ? ` · ${classItem.pendingRequestCount} yêu cầu đang chờ`
            : ""}
        </p>
      </div>

      <RequiredSkillChips
        requiredSkills={classItem.requiredSkills}
        mySkillIds={mySkillIds}
        className="mt-4"
      />

      {classItem.matchesMySkills ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge className="rounded-full bg-[#7CB342]/15 px-2.5 py-0.5 text-xs font-semibold text-[#3d5c22] hover:bg-[#7CB342]/15 dark:text-[#b8e086]">
            <Sparkles className="mr-1 size-3" />
            Khớp kỹ năng của bạn
          </Badge>
        </div>
      ) : null}

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

function ApprovedClassCard({
  request,
  onPreview,
}: {
  request: ClassMentorRequest;
  onPreview: (request: ClassMentorRequest) => void;
}) {
  const displayName =
    request.className?.trim() || request.classCode?.trim() || "Lớp học";

  return (
    <article className="flex h-full flex-col rounded-2xl border border-[#7CB342]/25 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {request.classCode ? (
            <p className="font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {request.classCode}
            </p>
          ) : null}
          <h3 className="mt-1 font-heading text-lg font-bold text-foreground">
            {displayName}
          </h3>
        </div>
        <Badge className="rounded-full bg-[#7CB342]/15 px-2.5 py-0.5 text-xs font-semibold text-[#3d5c22] hover:bg-[#7CB342]/15 dark:text-[#b8e086]">
          <CheckCircle2 className="mr-1 size-3" />
          Đã nhận
        </Badge>
      </div>

      <div className="mt-4 space-y-0.5 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Duyệt nhận
        </p>
        <ClassDateRange
          startDate={request.decidedAt || request.createdAt}
          layout="inline"
        />
      </div>

      {request.decisionNote?.trim() ? (
        <p className="mt-2 line-clamp-2 text-xs text-foreground/80">
          Phản hồi: {request.decisionNote}
        </p>
      ) : null}

      <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={() => onPreview(request)}
          className="h-10 flex-1 rounded-lg border-border"
        >
          Xem thông tin
        </Button>
        <Button
          type="button"
          variant="outline"
          nativeButton={false}
          render={<Link href={`/mentor/classes/${request.classId}`} />}
          className="h-10 flex-1 rounded-lg border-[#7CB342]/30 bg-[#7CB342]/10 text-[#3d5c22] dark:text-[#b8e086]"
        >
          Mở lớp
          <ExternalLink className="size-3.5" />
        </Button>
      </div>
    </article>
  );
}

function ApprovedClassPreviewDialog({
  request,
  open,
  onOpenChange,
  mySkillIds,
}: {
  request: ClassMentorRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mySkillIds: Set<string>;
}) {
  const { data, isLoading, hasError, retry } = useClientFetch({
    enabled: open && request != null,
    fetcher: async () => {
      if (!request) return null;
      const result = await getClassById(request.classId);
      return result?.data ?? null;
    },
    deps: [open, request?.classId],
    onError: (error) => showAppErrorFromUnknown(error, "classes.detail"),
  });

  const displayName =
    data?.name?.trim() ||
    request?.className?.trim() ||
    data?.code?.trim() ||
    request?.classCode?.trim() ||
    "Lớp học";
  const displayCode = data?.code?.trim() || request?.classCode?.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thông tin lớp đã nhận</DialogTitle>
          <DialogDescription>
            Xem nhanh lịch, sĩ số và kỹ năng lớp — giống lúc đăng ký dạy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
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
            {data ? <ClassStatusBadge status={data.status} /> : null}
          </div>

          {hasError ? (
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-4 text-center">
              <p className="text-sm text-muted-foreground">
                Không tải được chi tiết lớp.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={retry}
                className="mt-3 rounded-lg"
              >
                Thử lại
              </Button>
            </div>
          ) : isLoading && !data ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ) : data ? (
            <>
              <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3.5 text-sm">
                <div className="flex items-start gap-2">
                  <CalendarDays className="mt-0.5 size-4 shrink-0 text-[#4FC3F7]" />
                  <ClassDateRange
                    startDate={data.startDate}
                    endDate={data.endDate}
                    layout="inline"
                    className="min-w-0"
                  />
                </div>
                {data.scheduleSummary ? (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <Clock3 className="mt-0.5 size-4 shrink-0 text-[#7E57C2] dark:text-[#a78bfa]" />
                    <ClassScheduleSummary summary={data.scheduleSummary} />
                  </div>
                ) : null}
                <p className="flex items-center gap-2 text-muted-foreground">
                  <UsersRound className="size-4 shrink-0 text-[#7CB342] dark:text-[#b8e086]" />
                  {data.seatsTaken}/{data.maxCapacity} học viên
                </p>
              </div>

              <RequiredSkillChips
                requiredSkills={data.requiredSkills}
                mySkillIds={mySkillIds}
              />
            </>
          ) : null}

          {request?.message?.trim() ? (
            <div className="rounded-lg border border-[#FDD835]/40 bg-[#FDD835]/10 px-3 py-2.5">
              <p className="text-xs font-semibold text-foreground">
                Lời nhắn của bạn
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-foreground/90">
                {request.message}
              </p>
            </div>
          ) : null}

          {request?.decisionNote?.trim() ? (
            <div className="rounded-lg border border-border bg-background px-3 py-2.5">
              <p className="text-xs font-semibold text-foreground">
                Phản hồi quản lý
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                {request.decisionNote}
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <DialogClose
            render={
              <Button type="button" variant="outline" className="rounded-lg" />
            }
          >
            Đóng
          </DialogClose>
          {request ? (
            <Button
              type="button"
              nativeButton={false}
              render={<Link href={`/mentor/classes/${request.classId}`} />}
              className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Mở lớp
              <ExternalLink className="size-3.5" />
            </Button>
          ) : null}
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

export type MentorBoardManagerProps = {
  /** Hide page header when nested in assignment hub. */
  embedded?: boolean;
  /** Tighter card grid when hub shows a side panel. */
  denserGrid?: boolean;
  /** Bump after mentor edits skills so match chips refresh. */
  skillsVersion?: number;
  /** Called after a request is submitted successfully. */
  onApplied?: () => void;
  /** Open / focus the requests panel (embedded hub). */
  onViewRequests?: () => void;
};

export function MentorBoardManager({
  embedded = false,
  denserGrid = false,
  skillsVersion = 0,
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
  const [previewRequest, setPreviewRequest] = useState<ClassMentorRequest | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { data: mySkillsData } = useClientFetch({
    fetcher: async () => {
      const result = await getMyMentorSkills();
      return result?.data ?? [];
    },
    deps: [skillsVersion],
    onError: () => undefined,
  });

  const mySkillIds = useMemo(
    () => new Set((mySkillsData ?? []).map((item) => item.skillId)),
    [mySkillsData],
  );

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

  const {
    data: boardData,
    isLoading: isBoardLoading,
    markLoading,
    retry: retryBoard,
  } = useClientFetch({
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
    deps: [
      debouncedSearch,
      programFilter,
      matchSkillsFilter,
      page,
      sort,
      skillsVersion,
    ],
    onError: (error) => showAppErrorFromUnknown(error, "classMentorRequests.board"),
  });

  const {
    data: mineData,
    isLoading: isMineLoading,
    retry: retryMine,
  } = useClientFetch({
    fetcher: () =>
      getMyClassMentorRequests({
        page: 1,
        pageSize: 50,
      }),
    deps: [skillsVersion],
    onError: (error) => showAppErrorFromUnknown(error, "classMentorRequests.mine"),
  });

  const classes = (boardData?.data?.items ?? []).filter((item) =>
    isMentorBoardClass(item.status),
  );
  const boardPagination = boardData?.data;
  const myRequests = mineData?.data?.items ?? [];

  const approvedRequests = useMemo(
    () => myRequests.filter((item) => item.status === "Approved"),
    [myRequests],
  );

  const unifiedItems = useMemo((): UnifiedBoardItem[] => {
    const boardIds = new Set(classes.map((item) => item.id));
    const query = debouncedSearch.toLowerCase();

    const boardItems: UnifiedBoardItem[] = classes.map((classItem) => ({
      kind: "board",
      classItem,
      priority: boardPriority(classItem),
    }));

    const approvedExtras: UnifiedBoardItem[] = approvedRequests
      .filter((request) => !boardIds.has(request.classId))
      .filter((request) => {
        if (!query) return true;
        const name = request.className?.toLowerCase() ?? "";
        const code = request.classCode?.toLowerCase() ?? "";
        return name.includes(query) || code.includes(query);
      })
      .map((request) => ({
        kind: "approved" as const,
        request,
        priority: 1,
      }));

    return [...approvedExtras, ...boardItems].sort(
      (left, right) => left.priority - right.priority,
    );
  }, [classes, approvedRequests, debouncedSearch]);

  const isLoading = isBoardLoading || (isMineLoading && myRequests.length === 0);
  const listEmpty = unifiedItems.length === 0;

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
    if (!applyTarget || !isMentorBoardClass(applyTarget.status)) return;
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
      retryBoard();
      retryMine();
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
          description="Lớp Chờ mentor (đã cover lịch), chưa có mentor — và lớp bạn đã xin / đã nhận."
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
        {isLoading && listEmpty ? (
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
        ) : listEmpty ? (
          <ManagerEmptyState
            title="Chưa có lớp phù hợp"
            description="Thử đổi bộ lọc hoặc quay lại sau khi có lớp Chờ mentor trên bảng."
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
              {unifiedItems.map((item) =>
                item.kind === "approved" ? (
                  <ApprovedClassCard
                    key={`approved-${item.request.id}`}
                    request={item.request}
                    onPreview={setPreviewRequest}
                  />
                ) : (
                  <BoardClassCard
                    key={item.classItem.id}
                    classItem={item.classItem}
                    mySkillIds={mySkillIds}
                    onApply={setApplyTarget}
                    onViewRequests={onViewRequests}
                  />
                ),
              )}
            </div>

            {boardPagination ? (
              <ProgramPagination
                theme="light"
                className="mt-8"
                currentPage={boardPagination.currentPage}
                totalPages={boardPagination.totalPages}
                hasPrevious={boardPagination.hasPrevious}
                hasNext={boardPagination.hasNext}
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

          {applyTarget && applyTarget.requiredSkills.length > 0 ? (
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
              <RequiredSkillChips
                requiredSkills={applyTarget.requiredSkills}
                mySkillIds={mySkillIds}
              />
            </div>
          ) : null}

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

      <ApprovedClassPreviewDialog
        request={previewRequest}
        open={previewRequest != null}
        onOpenChange={(open) => {
          if (!open) setPreviewRequest(null);
        }}
        mySkillIds={mySkillIds}
      />
    </div>
  );
}
