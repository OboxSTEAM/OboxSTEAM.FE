"use client";

import { useMemo } from "react";
import { Loader2, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RebuyClass, RebuyClassCatalog } from "@/lib/api";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { CLASS_SESSION_KIND_LABELS } from "@/lib/classes/constants";
import { formatProgramPrice } from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

type ContinuityClassPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalog: RebuyClassCatalog | null;
  loadState: "idle" | "loading" | "ready" | "error";
  selectingId: string | null;
  onSelect: (classId: string) => void;
  onRetryLoad?: () => void;
  title?: string;
  description?: string;
};

function classKindLabel(item: RebuyClass): string {
  if (item.status === "Open") return "Lớp mới · học lại từ đầu";
  if (item.status === "InProgress") return "Lớp đang chạy · giữ tiến độ phù hợp";
  return item.status;
}

function creditSummary(item: RebuyClass): string | null {
  const copied = item.modules.filter((m) => m.creditHint === "Copied").length;
  const redo = item.modules.filter((m) => m.creditHint === "RedoWithClass").length;
  if (copied === 0 && redo === 0) return null;
  const parts: string[] = [];
  if (copied > 0) parts.push(`giữ ${copied} module`);
  if (redo > 0) parts.push(`học lại ${redo} module`);
  return parts.join(" · ");
}

export function ContinuityClassPickerDialog({
  open,
  onOpenChange,
  catalog,
  loadState,
  selectingId,
  onSelect,
  onRetryLoad,
  title = "Chọn lớp học lại",
  description,
}: ContinuityClassPickerDialogProps) {
  const classes = catalog?.classes ?? [];
  const eligible = useMemo(
    () => classes.filter((item) => item.isEligible && item.seatsRemaining > 0),
    [classes],
  );
  const ineligible = useMemo(
    () => classes.filter((item) => !item.isEligible || item.seatsRemaining <= 0),
    [classes],
  );

  const amountLabel =
    catalog != null ? formatProgramPrice(catalog.checkoutAmount) : null;
  const priceHint =
    catalog == null
      ? null
      : catalog.context === "ActiveRedelivery" || catalog.withinRebuyWindow
        ? `Phí học lại: ${amountLabel} (50% giá chương trình)`
        : `Phí đăng ký lại: ${amountLabel}`;

  const defaultDescription =
    description ??
    (priceHint
      ? `${priceHint}. Chọn lớp mới để học lại từ đầu, hoặc lớp đang chạy còn ghế và đủ điều kiện để tiếp tục.`
      : "Chọn lớp phù hợp. Đóng hộp thoại nếu chưa muốn chọn — bạn vẫn giữ tiến độ hiện tại.");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Portals outside .learn-shell — re-scope tokens + solid fill */}
      <DialogPopup className="learn-shell gap-0 overflow-hidden bg-learn-surface p-0 text-learn-text sm:max-w-lg">
        <div className="relative border-b border-learn-border px-6 pb-4 pt-5">
          <DialogClose className="top-4 right-4" />
          <DialogHeader className="gap-1.5 pr-8 text-left">
            <DialogTitle className="text-lg font-semibold text-learn-text-strong">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-learn-muted">
              {defaultDescription}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {loadState === "loading" || loadState === "idle" ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-learn-muted">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Đang tải lớp phù hợp…
            </div>
          ) : loadState === "error" ? (
            <div className="space-y-3 py-8 text-center">
              <p className="text-sm text-learn-muted">
                Không tải được danh sách lớp.
              </p>
              {onRetryLoad ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-learn-border"
                  onClick={onRetryLoad}
                >
                  Thử lại
                </Button>
              ) : null}
            </div>
          ) : eligible.length === 0 && ineligible.length === 0 ? (
            <p className="py-8 text-center text-sm text-learn-muted">
              Hiện chưa có lớp phù hợp. Đóng và thử lại sau — bạn vẫn ở trạng thái
              Active.
            </p>
          ) : (
            <div className="space-y-4">
              {eligible.length > 0 ? (
                <ul className="space-y-3">
                  {eligible.map((item) => (
                    <ContinuityClassCard
                      key={item.classId}
                      item={item}
                      isBusy={selectingId === item.classId}
                      disabled={selectingId != null}
                      onSelect={onSelect}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-learn-muted">
                  Chưa có lớp đủ điều kiện. Các lớp bên dưới tạm thời không chọn
                  được.
                </p>
              )}

              {ineligible.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-learn-faint">
                    Không đủ điều kiện
                  </p>
                  <ul className="space-y-3 opacity-70">
                    {ineligible.map((item) => (
                      <ContinuityClassCard
                        key={item.classId}
                        item={item}
                        isBusy={false}
                        disabled
                        onSelect={onSelect}
                      />
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </DialogPopup>
    </Dialog>
  );
}

function ContinuityClassCard({
  item,
  isBusy,
  disabled,
  onSelect,
}: {
  item: RebuyClass;
  isBusy: boolean;
  disabled: boolean;
  onSelect: (classId: string) => void;
}) {
  const summary = creditSummary(item);
  const canPick = item.isEligible && item.seatsRemaining > 0 && !disabled;
  const isOpen = item.status === "Open";
  const isInProgress = item.status === "InProgress";

  return (
    <li>
      <button
        type="button"
        disabled={!canPick}
        aria-busy={isBusy}
        onClick={() => onSelect(item.classId)}
        className={cn(
          "w-full rounded-xl border p-4 text-left transition-colors outline-none",
          "focus-visible:ring-2 focus-visible:ring-learn-primary/40",
          canPick
            ? "border-learn-border bg-learn-surface-2/50 hover:border-learn-primary/50 hover:bg-learn-surface-2"
            : "cursor-not-allowed border-learn-border bg-learn-surface-2/30",
          isBusy && "border-learn-primary/40 bg-learn-primary/5",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-heading text-sm font-semibold text-learn-text-strong">
              {item.name?.trim() || "Lớp học lại"}
            </p>
            <p className="mt-0.5 font-mono text-xs text-learn-muted">
              {item.code?.trim() || item.classId.slice(0, 8)}
            </p>
            <p className="mt-1 text-xs text-learn-muted">{classKindLabel(item)}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <Badge
              variant="outline"
              className={cn(
                "font-normal",
                isOpen &&
                  "border-learn-success/40 bg-learn-success/10 text-learn-text-strong",
                isInProgress &&
                  "border-learn-accent/40 bg-learn-accent/10 text-learn-text-strong",
                !isOpen &&
                  !isInProgress &&
                  "border-learn-border text-learn-muted",
              )}
            >
              {isOpen ? "Lớp mới" : isInProgress ? "Đang chạy" : item.status}
            </Badge>
            <Badge
              variant="outline"
              className="border-learn-border text-learn-muted"
            >
              {item.seatsTaken}/{item.maxCapacity} ghế
              {item.seatsRemaining > 0
                ? ` · còn ${item.seatsRemaining}`
                : " · đã đầy"}
            </Badge>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-learn-muted">
          <span>Bắt đầu {formatApiDateTimeDisplay(item.startDate)}</span>
          {item.mentorName?.trim() ? (
            <span className="inline-flex items-center gap-1">
              <Users className="size-3" aria-hidden />
              {item.mentorName.trim()}
            </span>
          ) : null}
        </div>

        {summary ? (
          <p className="mt-2 text-xs font-medium text-learn-primary">{summary}</p>
        ) : null}

        {!item.isEligible && item.ineligibleReason?.trim() ? (
          <p className="mt-2 text-xs text-learn-muted">
            {item.ineligibleReason.trim()}
          </p>
        ) : null}

        {item.moduleSessions.length > 0 ? (
          <ul className="mt-3 space-y-1.5 border-t border-learn-border pt-3">
            {item.moduleSessions.slice(0, 4).map((session) => (
              <li
                key={session.sessionId}
                className="flex flex-wrap items-center gap-2 text-xs"
              >
                <Badge
                  variant="secondary"
                  className="border-learn-border bg-learn-surface font-normal text-learn-text"
                >
                  {CLASS_SESSION_KIND_LABELS[session.sessionKind] ??
                    session.sessionKind}
                </Badge>
                <span className="text-learn-text-strong">
                  {session.title?.trim() || "Buổi học"}
                </span>
                <span className="text-learn-muted">
                  {formatApiDateTimeDisplay(session.startTime)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <span
          className={cn(
            "mt-3 flex h-9 w-full items-center justify-center rounded-lg text-sm font-medium",
            canPick
              ? "bg-learn-primary text-white"
              : "bg-learn-surface-3 text-learn-muted",
          )}
        >
          {isBusy ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Đang chọn…
            </span>
          ) : canPick ? (
            "Chọn lớp này"
          ) : (
            "Không chọn được"
          )}
        </span>
      </button>
    </li>
  );
}
