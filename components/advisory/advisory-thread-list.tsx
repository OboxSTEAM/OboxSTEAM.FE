"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdvisoryThread } from "@/lib/api";
import {
  ADVISORY_THREAD_TYPE_LABELS,
  ADVISORY_TARGET_TYPE_LABELS,
  getThreadStatusLabel,
} from "@/lib/expert/advisory-labels";
import { cn } from "@/lib/utils";

type ThreadFilter = "all" | "RequiredChange" | "Suggestion";

type AdvisoryThreadListProps = {
  threads: AdvisoryThread[];
  selectedThreadId: string | null;
  onSelect: (threadId: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  showFilters?: boolean;
};

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function AdvisoryThreadList({
  threads,
  selectedThreadId,
  onSelect,
  isLoading = false,
  emptyMessage = "Chưa có nhận xét.",
  showFilters = true,
}: AdvisoryThreadListProps) {
  const [filter, setFilter] = useState<ThreadFilter>("all");
  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  const sorted = [...threads]
    .filter((thread) => filter === "all" || thread.type === filter || thread.type === "General")
    .sort((left, right) => {
      if (left.type === "General") return -1;
      if (right.type === "General") return 1;
      return (
        new Date(right.lastMessageAt).getTime() -
        new Date(left.lastMessageAt).getTime()
      );
    });

  return (
    <div>
      {showFilters ? (
        <div className="flex gap-1 border-b border-border p-2">
          {(
            [
              ["all", "Tất cả"],
              ["RequiredChange", "Bắt buộc sửa"],
              ["Suggestion", "Gợi ý"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={filter === value ? "default" : "ghost"}
              className="h-7 rounded-lg px-2 text-[11px]"
              onClick={() => setFilter(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      ) : null}
      {sorted.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
    <ul className="divide-y divide-border" role="listbox" aria-label="Nhận xét">
      {sorted.map((thread) => {
        const isSelected = thread.id === selectedThreadId;
        const isRequired = thread.type === "RequiredChange";
        return (
          <li key={thread.id}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onSelect(thread.id)}
              aria-selected={isSelected}
              className={cn(
                "h-auto w-full justify-start rounded-none px-4 py-3 text-left hover:bg-muted/60",
                isSelected && "bg-primary/5 hover:bg-primary/8",
              )}
            >
              <div className="flex w-full min-w-0 items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                    isRequired
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <MessageSquare className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      className={cn(
                        "rounded-md text-[10px] font-semibold",
                        isRequired
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-foreground",
                      )}
                    >
                      {ADVISORY_THREAD_TYPE_LABELS[thread.type]}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="rounded-md border-border text-[10px] font-medium text-muted-foreground"
                    >
                      {getThreadStatusLabel(thread.type, thread.status)}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-foreground">
                    {thread.targetLabel ||
                      ADVISORY_TARGET_TYPE_LABELS[thread.targetType]}
                  </p>
                  {thread.targetContext ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {thread.targetContext}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {thread.authorName || "—"} · {formatRelativeTime(thread.lastMessageAt)} ·{" "}
                    {thread.messageCount} tin
                  </p>
                </div>
              </div>
            </Button>
          </li>
        );
      })}
    </ul>
      )}
    </div>
  );
}
