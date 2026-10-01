"use client";

import { useEffect, useState } from "react";

import { useAdvisoryChat } from "@/components/advisory-chat/advisory-chat-provider";
import { ChangeCard } from "@/components/advisory-chat/changes/change-card";
import { Button } from "@/components/ui/button";
import {
  useCurriculumChanges,
  type CurriculumChangesBase,
  type CurriculumChangesSelection,
} from "@/hooks/use-curriculum-changes";
import type { CurriculumChanges } from "@/lib/api";
import { cn } from "@/lib/utils";

/** Viewing the latest changes this long counts as "seen". */
const MARK_SEEN_DELAY_MS = 1500;

const BASE_OPTIONS: { value: CurriculumChangesBase; label: string; empty: string }[] = [
  {
    value: "lastApproval",
    label: "Từ lần chấp thuận",
    empty: "Không có thay đổi nào kể từ lần chấp thuận gần nhất.",
  },
  { value: "lastSeen", label: "Chưa xem", empty: "Bạn đã xem hết các thay đổi." },
  { value: "start", label: "Từ đầu", empty: "Chương trình chưa có thay đổi nào." },
];

/** "Thay đổi" tab — consolidated curriculum diff with seen tracking. */
export function CurriculumChangesPanel() {
  const {
    programId,
    capabilities,
    changesRange,
    openChanges,
    workspaceState,
    navigateToMention,
    insertMention,
  } = useAdvisoryChat();
  const [base, setBase] = useState<CurriculumChangesBase>("lastApproval");

  const selection: CurriculumChangesSelection = changesRange
    ? { kind: "range", ...changesRange }
    : { kind: "base", base };
  const { data, isLoading, error, refresh, markSeen } = useCurriculumChanges(programId, selection);
  const { refresh: refreshWorkspace } = workspaceState;

  const seenTarget =
    data && data.toVersion === data.currentVersion && data.seenVersion < data.currentVersion
      ? data.currentVersion
      : null;

  useEffect(() => {
    if (seenTarget === null) return;
    const timer = setTimeout(() => {
      void markSeen(seenTarget).then((isAccepted) => {
        if (isAccepted) void refreshWorkspace();
      });
    }, MARK_SEEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [markSeen, refreshWorkspace, seenTarget]);

  const emptyText = changesRange
    ? "Không có thay đổi nào trong khoảng phiên bản này."
    : (BASE_OPTIONS.find((option) => option.value === base)?.empty ?? "Không có thay đổi nào.");

  return (
    <div className="flex flex-col gap-3 p-3">
      {changesRange ? (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs">
          <span className="text-muted-foreground">
            Phiên bản{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {changesRange.fromVersion} → {changesRange.toVersion}
            </span>
          </span>
          <Button type="button" variant="ghost" size="xs" onClick={() => openChanges()}>
            Xem tất cả
          </Button>
        </div>
      ) : (
        <div role="group" aria-label="Mốc so sánh" className="flex gap-1 rounded-lg bg-muted p-1">
          {BASE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={base === option.value}
              onClick={() => setBase(option.value)}
              className={cn(
                "min-h-8 flex-1 rounded-md px-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                base === option.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {data ? <ChangesSummary data={data} /> : null}

      {!data && isLoading ? (
        <ChangesSkeleton />
      ) : !data ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-xs text-muted-foreground">
          <p>{error ? "Không tải được danh sách thay đổi." : "Chưa có dữ liệu thay đổi."}</p>
          <Button type="button" variant="outline" size="xs" onClick={() => void refresh()}>
            Thử lại
          </Button>
        </div>
      ) : data.items.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {data.items.map((item) => (
            <li key={`${item.targetType}:${item.targetId}`}>
              <ChangeCard
                item={item}
                onNavigate={navigateToMention}
                onMention={capabilities.canPost ? insertMention : undefined}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ChangesSummary({ data }: { data: CurriculumChanges }) {
  const { created, updated, deleted, moved } = data.summary;
  const parts = [
    created > 0 ? `${created} thêm mới` : null,
    updated > 0 ? `${updated} chỉnh sửa` : null,
    deleted > 0 ? `${deleted} đã xoá` : null,
    moved > 0 ? `${moved} di chuyển` : null,
  ].filter(Boolean);

  return (
    <p className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
      <span>{parts.length > 0 ? parts.join(" · ") : "Không có thay đổi"}</span>
      <span className="tabular-nums">
        Phiên bản {data.fromVersion} → {data.toVersion}
      </span>
    </p>
  );
}

function ChangesSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      {[0, 1, 2].map((index) => (
        <div key={index} className="space-y-2 rounded-xl border border-border p-3">
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="h-10 animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  );
}
