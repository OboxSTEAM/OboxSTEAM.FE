"use client";

import { useMemo, useState } from "react";
import { Check, Inbox, RotateCcw, X } from "lucide-react";

import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  LIGHT_SELECT_CONTENT,
  LIGHT_SELECT_ITEM,
  LIGHT_SELECT_TRIGGER,
} from "@/components/programs/program-select-styles";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  assignTargetClassRedeliveryRequest,
  getClasses,
  getPendingManagerClassRedeliveryRequests,
  rejectClassRedeliveryRequest,
  type ClassRedeliveryRequest,
} from "@/lib/api";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

type ClassRedeliveryQueueProps = {
  /** When true, hide the reload toolbar (parent owns refresh). */
  embedded?: boolean;
};

/** Flat PendingManager assign/reject queue — secondary fallback for WS7. */
export function ClassRedeliveryQueue({
  embedded = false,
}: ClassRedeliveryQueueProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] =
    useState<ClassRedeliveryRequest | null>(null);
  const [rejectTarget, setRejectTarget] =
    useState<ClassRedeliveryRequest | null>(null);
  const [targetClassId, setTargetClassId] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState("");

  const { data, isLoading, retry, markLoading } = useClientFetch({
    fetcher: async () => {
      const result = await getPendingManagerClassRedeliveryRequests();
      return result?.data ?? [];
    },
    deps: [],
    onError: (error) => showAppErrorFromUnknown(error, "class-redelivery.list"),
  });

  const { data: classesData, isLoading: isClassesLoading } = useClientFetch({
    enabled: assignTarget != null,
    fetcher: async () => {
      const result = await getClasses({
        page: 1,
        pageSize: 100,
        status: "Open",
      });
      return result?.data?.items ?? [];
    },
    deps: [assignTarget?.id, assignTarget?.moduleId],
    onError: (error) => showAppErrorFromUnknown(error, "generic"),
  });

  const requests = data ?? [];
  const classes = useMemo(() => {
    const items = classesData ?? [];
    if (!assignTarget) return items;
    return items.filter((item) => item.programId);
  }, [assignTarget, classesData]);

  async function handleAssign() {
    if (!assignTarget || !targetClassId) return;
    setBusyId(assignTarget.id);
    try {
      await assignTargetClassRedeliveryRequest(assignTarget.id, {
        targetClassId,
        decisionNote: decisionNote.trim() || null,
      });
      showAppSuccess({ title: "Đã chỉ định lớp học lại" });
      setAssignTarget(null);
      setTargetClassId(null);
      setDecisionNote("");
      markLoading();
      retry();
    } catch (error) {
      showAppErrorFromUnknown(error, "class-redelivery.decide");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    setBusyId(rejectTarget.id);
    try {
      await rejectClassRedeliveryRequest(rejectTarget.id, {
        decisionNote: decisionNote.trim() || null,
      });
      showAppSuccess({ title: "Đã từ chối yêu cầu học lại" });
      setRejectTarget(null);
      setDecisionNote("");
      markLoading();
      retry();
    } catch (error) {
      showAppErrorFromUnknown(error, "class-redelivery.decide");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {!embedded ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-2 rounded-xl border-border"
            onClick={() => {
              markLoading();
              retry();
            }}
          >
            <RotateCcw className="size-4" aria-hidden />
            Tải lại
          </Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-6">
            <ManagerEmptyState
              icon={Inbox}
              title="Không có yêu cầu chờ xử lý"
              description="Khi hệ thống không tự khớp lớp, yêu cầu PendingManager sẽ hiện ở đây."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {requests.map((request) => {
              const isBusy = busyId === request.id;
              return (
                <li
                  key={request.id}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-[#FDD835]/35 bg-[#FDD835]/20 text-[#8A7200]"
                      >
                        {request.status}
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">
                        {request.id.slice(0, 8)}…
                      </span>
                    </div>
                    <p className="text-sm text-foreground">
                      Module{" "}
                      <span className="font-mono text-xs">
                        {request.moduleId.slice(0, 8)}…
                      </span>
                      {" · "}Lớp nguồn{" "}
                      <span className="font-mono text-xs">
                        {request.sourceClassId.slice(0, 8)}…
                      </span>
                    </p>
                    {request.requestMessage?.trim() ? (
                      <p className="rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs">
                        {request.requestMessage.trim()}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      Gửi lúc {formatApiDateTimeDisplay(request.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={isBusy}
                      aria-label="Từ chối"
                      className="size-9 rounded-lg text-primary hover:bg-primary/10"
                      onClick={() => {
                        setDecisionNote("");
                        setRejectTarget(request);
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={isBusy}
                      aria-label="Chỉ định lớp"
                      className={cn(
                        "size-9 rounded-lg text-[#3d5c22] hover:bg-[#7CB342]/15",
                      )}
                      onClick={() => {
                        setTargetClassId(null);
                        setDecisionNote("");
                        setAssignTarget(request);
                      }}
                    >
                      <Check className="size-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog
        open={assignTarget != null}
        onOpenChange={(open) => !open && setAssignTarget(null)}
      >
        <DialogPopup className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉ định lớp đích</DialogTitle>
            <DialogDescription>
              Chọn lớp Open phù hợp để học viên thanh toán phí học lại.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Lớp đích</Label>
              <Select
                value={targetClassId ?? undefined}
                onValueChange={(value) => setTargetClassId(value)}
              >
                <SelectTrigger className={LIGHT_SELECT_TRIGGER}>
                  <span className="truncate">
                    {isClassesLoading
                      ? "Đang tải lớp…"
                      : targetClassId
                        ? classes.find((item) => item.id === targetClassId)
                            ?.name || targetClassId
                        : "Chọn lớp"}
                  </span>
                </SelectTrigger>
                <SelectContent className={LIGHT_SELECT_CONTENT}>
                  {classes.map((item) => (
                    <SelectItem
                      key={item.id}
                      value={item.id}
                      className={LIGHT_SELECT_ITEM}
                    >
                      {item.name || item.code || item.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assign-note">Ghi chú</Label>
              <Textarea
                id="assign-note"
                value={decisionNote}
                onChange={(event) => setDecisionNote(event.target.value)}
                className="min-h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAssignTarget(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={!targetClassId || busyId != null}
              onClick={() => void handleAssign()}
            >
              Chỉ định
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      <Dialog
        open={rejectTarget != null}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      >
        <DialogPopup className="max-w-md">
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu học lại</DialogTitle>
            <DialogDescription>
              Học viên sẽ nhận trạng thái Rejected.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={decisionNote}
            onChange={(event) => setDecisionNote(event.target.value)}
            placeholder="Lý do (không bắt buộc)"
            className="min-h-24"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectTarget(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busyId != null}
              onClick={() => void handleReject()}
            >
              Từ chối
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
