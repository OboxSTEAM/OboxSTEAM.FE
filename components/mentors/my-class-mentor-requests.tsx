"use client";

import { useState } from "react";
import { Inbox, Undo2 } from "lucide-react";

import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import {
  THEME_SELECT_CONTENT,
  THEME_SELECT_ITEM,
  THEME_SELECT_TRIGGER,
} from "@/lib/ui/select-styles";
import { Badge } from "@/components/ui/badge";
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
  getMyClassMentorRequests,
  withdrawClassMentorRequest,
  type ClassMentorRequest,
  type ClassMentorRequestStatus,
} from "@/lib/api";
import { CLASS_MENTOR_REQUEST_STATUS_LABELS } from "@/lib/classes/constants";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Mọi trạng thái" },
  ...(Object.keys(CLASS_MENTOR_REQUEST_STATUS_LABELS) as ClassMentorRequestStatus[]).map(
    (status) => ({
      value: status,
      label: CLASS_MENTOR_REQUEST_STATUS_LABELS[status],
    }),
  ),
];

const REQUEST_STATUS_STYLES: Record<ClassMentorRequestStatus, string> = {
  Pending:
    "border-[#FDD835]/35 bg-[#FDD835]/20 text-[#8A7200] dark:text-[#fde047]",
  Approved:
    "border-[#7CB342]/20 bg-[#7CB342]/15 text-[#3d5c22] dark:text-[#b8e086]",
  Rejected:
    "border-[#E94B3C]/15 bg-[#E94B3C]/10 text-[#a82a1e] dark:text-[#ff8a80]",
  Withdrawn: "border-border bg-muted text-muted-foreground",
};

function RequestStatusBadge({ status }: { status: ClassMentorRequestStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
        REQUEST_STATUS_STYLES[status],
      )}
    >
      {CLASS_MENTOR_REQUEST_STATUS_LABELS[status]}
    </Badge>
  );
}

export type MyClassMentorRequestsProps = {
  /** Compact side-panel cards (for split hub layout). */
  panel?: boolean;
  /** Bump to force refetch (e.g. after applying from board). */
  refreshKey?: number;
  className?: string;
};

export function MyClassMentorRequests({
  panel = false,
  refreshKey = 0,
  className,
}: MyClassMentorRequestsProps = {}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [withdrawTarget, setWithdrawTarget] = useState<ClassMentorRequest | null>(
    null,
  );

  const { data, isLoading, markLoading, retry } = useClientFetch({
    fetcher: () =>
      getMyClassMentorRequests({
        status:
          statusFilter === "all"
            ? undefined
            : (statusFilter as ClassMentorRequestStatus),
        page,
        pageSize: panel ? 10 : 20,
      }),
    deps: [statusFilter, page, refreshKey, panel],
    onError: (error) => showAppErrorFromUnknown(error, "classMentorRequests.mine"),
  });

  const requests = data?.data?.items ?? [];
  const pagination = data?.data;
  const pendingCount = requests.filter((item) => item.status === "Pending").length;

  async function handleWithdrawConfirm() {
    if (!withdrawTarget) return;
    try {
      await withdrawClassMentorRequest(withdrawTarget.id);
      showAppSuccess({
        title: "Đã rút yêu cầu",
        description: `Yêu cầu dạy lớp ${withdrawTarget.className || withdrawTarget.classCode || ""} đã được huỷ.`,
      });
      setWithdrawTarget(null);
      retry();
    } catch (error) {
      showAppErrorFromUnknown(error, "classMentorRequests.withdraw");
      throw error;
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col",
        panel
          ? "h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          : "min-h-full",
        className,
      )}
    >
      <div
        className={cn(
          "shrink-0 border-b border-border",
          panel ? "bg-muted/40 px-4 py-3" : "bg-card px-6 py-4",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Inbox className="size-4 text-primary" />
              Yêu cầu của tôi
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isLoading
                ? "Đang tải..."
                : pendingCount > 0
                  ? `${pendingCount} đang chờ duyệt`
                  : `${pagination?.totalCount ?? requests.length} yêu cầu`}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <Select
            value={statusFilter || null}
            onValueChange={(value) => {
              markLoading();
              setStatusFilter(value ?? "all");
              setPage(1);
            }}
          >
            <SelectTrigger className={cn(THEME_SELECT_TRIGGER, "w-full")}>
              <span className="truncate">
                {STATUS_FILTER_OPTIONS.find((option) => option.value === statusFilter)
                  ?.label ?? "Trạng thái"}
              </span>
            </SelectTrigger>
            <SelectContent
              align="start"
              alignItemWithTrigger={false}
              sideOffset={8}
              className={THEME_SELECT_CONTENT}
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className={cn(THEME_SELECT_ITEM, "cursor-pointer")}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        className={cn(
          "min-h-0 flex-1",
          panel ? "overflow-y-auto p-3" : "px-6 py-6",
        )}
      >
        {isLoading && requests.length === 0 ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <ManagerEmptyState
            title="Chưa có yêu cầu"
            description="Đăng ký một lớp bên trái — yêu cầu sẽ hiện ngay tại đây."
            icon={Inbox}
          />
        ) : (
          <ul className="space-y-2.5">
            {requests.map((request) => (
              <li
                key={request.id}
                className="rounded-xl border border-border bg-background p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {request.classCode ? (
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {request.classCode}
                      </p>
                    ) : null}
                    <p className="truncate text-sm font-semibold text-foreground">
                      {request.className?.trim() || "Lớp học"}
                    </p>
                  </div>
                  <RequestStatusBadge status={request.status} />
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  Gửi {formatApiDateTimeDisplay(request.createdAt) || "—"}
                </p>

                {request.message?.trim() ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {request.message}
                  </p>
                ) : null}

                {request.decisionNote?.trim() ? (
                  <p className="mt-1 line-clamp-2 text-xs text-foreground/80">
                    Phản hồi: {request.decisionNote}
                  </p>
                ) : null}

                {request.status === "Pending" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setWithdrawTarget(request)}
                    className="mt-3 h-8 w-full rounded-lg border-border text-muted-foreground hover:text-foreground"
                  >
                    <Undo2 className="size-3.5" />
                    Rút yêu cầu
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {pagination && pagination.totalPages > 1 ? (
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevious || isLoading}
              onClick={() => {
                markLoading();
                setPage((current) => Math.max(1, current - 1));
              }}
              className="h-8 rounded-lg"
            >
              Trước
            </Button>
            <span className="font-mono text-xs text-muted-foreground">
              {pagination.currentPage}/{pagination.totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext || isLoading}
              onClick={() => {
                markLoading();
                setPage((current) => current + 1);
              }}
              className="h-8 rounded-lg"
            >
              Sau
            </Button>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        isOpen={withdrawTarget != null}
        onOpenChange={(open) => {
          if (!open) setWithdrawTarget(null);
        }}
        title="Rút yêu cầu?"
        description={
          withdrawTarget
            ? `Bạn có chắc muốn rút yêu cầu dạy lớp ${withdrawTarget.className || withdrawTarget.classCode || ""}?`
            : ""
        }
        confirmLabel="Rút yêu cầu"
        variant="destructive"
        onConfirm={handleWithdrawConfirm}
      />
    </div>
  );
}
