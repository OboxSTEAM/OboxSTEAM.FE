"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClipboardList, Undo2 } from "lucide-react";

import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import {
  ManagerDataTable,
  type ColumnDef,
} from "@/components/manager/shared/data-table";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { ProgramPagination } from "@/components/programs/program-pagination";
import {
  LIGHT_SELECT_CONTENT,
  LIGHT_SELECT_ITEM,
  LIGHT_SELECT_TRIGGER,
} from "@/components/programs/program-select-styles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
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
  Pending: "bg-[#FDD835]/20 text-[#8A7200] border-[#FDD835]/35",
  Approved: "bg-[#7CB342]/15 text-[#3d5c22] border-[#7CB342]/20",
  Rejected: "bg-[#E94B3C]/10 text-[#a82a1e] border-[#E94B3C]/15",
  Withdrawn: "bg-[#F5F5F0] text-[#6B6B6B] border-[#E5E5E0]",
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

export function MyClassMentorRequests() {
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
        pageSize: 20,
      }),
    deps: [statusFilter, page],
    onError: (error) => showAppErrorFromUnknown(error, "classMentorRequests.mine"),
  });

  const requests = data?.data?.items ?? [];
  const pagination = data?.data;

  const columns = useMemo<ColumnDef<ClassMentorRequest>[]>(
    () => [
      {
        header: "Lớp học",
        render: (request) => (
          <div className="min-w-0">
            {request.classCode ? (
              <p className="font-mono text-xs font-semibold uppercase tracking-wide text-[#6B6B6B]">
                {request.classCode}
              </p>
            ) : null}
            <p className="font-medium text-[#2D2D2D]">
              {request.className?.trim() || "Lớp học"}
            </p>
          </div>
        ),
      },
      {
        header: "Trạng thái",
        render: (request) => <RequestStatusBadge status={request.status} />,
      },
      {
        header: "Lời nhắn",
        render: (request) => (
          <p className="max-w-xs truncate text-sm text-[#6B6B6B]">
            {request.message?.trim() || "—"}
          </p>
        ),
      },
      {
        header: "Gửi lúc",
        render: (request) => (
          <span className="text-sm text-[#6B6B6B]">
            {formatApiDateTimeDisplay(request.createdAt) || "—"}
          </span>
        ),
      },
      {
        header: "Phản hồi",
        render: (request) => (
          <p className="max-w-xs truncate text-sm text-[#6B6B6B]">
            {request.decisionNote?.trim() ||
              (request.decidedAt
                ? formatApiDateTimeDisplay(request.decidedAt)
                : "—")}
          </p>
        ),
      },
      {
        header: "",
        className: "w-28 text-right",
        render: (request) =>
          request.status === "Pending" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setWithdrawTarget(request)}
              className="h-8 rounded-lg border-[#E5E5E0] text-[#6B6B6B] hover:text-[#2D2D2D]"
            >
              <Undo2 className="size-3.5" />
              Rút
            </Button>
          ) : null,
      },
    ],
    [],
  );

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
    <div className="flex min-h-full flex-col">
      <ManagerPageHeader
        title="Yêu cầu của tôi"
        description="Theo dõi các yêu cầu đăng ký lớp bạn đã gửi."
      >
        <Button
          type="button"
          nativeButton={false}
          render={<Link href="/mentor/board" />}
          className="h-10 rounded-lg bg-[#E94B3C] font-semibold text-white hover:bg-[#E94B3C]/90"
        >
          <ClipboardList className="size-4" />
          Xem bảng lớp
        </Button>
      </ManagerPageHeader>

      <div className="flex items-center gap-3 border-b border-[#E5E5E0] bg-white px-6 py-4">
        <Select
          value={statusFilter || null}
          onValueChange={(value) => {
            markLoading();
            setStatusFilter(value ?? "all");
            setPage(1);
          }}
        >
          <SelectTrigger className={LIGHT_SELECT_TRIGGER}>
            <span className="truncate">
              {STATUS_FILTER_OPTIONS.find((option) => option.value === statusFilter)
                ?.label ?? "Trạng thái"}
            </span>
          </SelectTrigger>
          <SelectContent
            align="start"
            alignItemWithTrigger={false}
            sideOffset={8}
            className={LIGHT_SELECT_CONTENT}
          >
            {STATUS_FILTER_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className={cn(LIGHT_SELECT_ITEM, "cursor-pointer")}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 px-6 py-6">
        {!isLoading && requests.length === 0 ? (
          <ManagerEmptyState
            title="Chưa có yêu cầu nào"
            description="Hãy xem bảng lớp và gửi yêu cầu đăng ký dạy các lớp phù hợp."
            actionLabel="Đến bảng lớp"
            actionHref="/mentor/board"
          />
        ) : (
          <>
            <ManagerDataTable
              columns={columns}
              data={requests}
              isLoading={isLoading}
            />

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
