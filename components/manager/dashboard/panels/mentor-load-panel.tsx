"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { getMentorInitials } from "@/components/mentors/mentor-profile-content";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { OperationsOverview } from "@/lib/api";
import { getExpertAvatarUrl } from "@/lib/programs/format";
import { cn } from "@/lib/utils";

import { DashboardPanel, DashboardSectionTitle } from "../dashboard-panel";
import { formatCount } from "../dashboard-utils";

type MentorLoadPanelProps = {
  operations: OperationsOverview;
};

type MentorRow = {
  mentorId: string;
  name: string;
  title: string | null;
  avatarUrl: string | null;
  assigned: number;
  pending: number;
  max: number;
  utilization: number;
};

function loadBarClass(utilization: number): string {
  if (utilization >= 0.9) return "bg-steam-science";
  if (utilization >= 0.7) return "bg-steam-arts";
  return "bg-steam-engineering";
}

function SummaryStat({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone?: "warn" | "danger" | "neutral";
}) {
  return (
    <div className="min-w-0 rounded-xl bg-secondary/70 px-3 py-2.5">
      <p
        className={cn(
          "font-heading text-xl font-black tabular-nums tracking-tight sm:text-2xl",
          tone === "danger" && "text-steam-science",
          tone === "warn" && "text-steam-arts",
          (!tone || tone === "neutral") && "text-foreground",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export function MentorLoadPanel({ operations }: MentorLoadPanelProps) {
  const pagination = operations.mentorUtilization;

  const rows: MentorRow[] = React.useMemo(() => {
    return pagination.items
      .map((mentor) => {
        const max = mentor.max > 0 ? mentor.max : Math.max(mentor.assigned, 1);
        return {
          mentorId: mentor.mentorId,
          name: mentor.mentorName?.trim() || "Mentor",
          title: mentor.title?.trim() || null,
          avatarUrl: getExpertAvatarUrl(mentor.avatarUrl),
          assigned: mentor.assigned,
          pending: mentor.pending,
          max,
          utilization: Math.min(1, mentor.assigned / max),
        };
      })
      .sort((a, b) => {
        if (b.utilization !== a.utilization) {
          return b.utilization - a.utilization;
        }
        return b.pending - a.pending;
      });
  }, [pagination.items]);

  const pendingTotal = rows.reduce((sum, row) => sum + row.pending, 0);
  const nearCapacityCount = rows.filter((row) => row.utilization >= 0.9).length;
  const avgUtilization =
    rows.length > 0
      ? rows.reduce((sum, row) => sum + row.utilization, 0) / rows.length
      : 0;
  const totalKnown =
    pagination.totalCount > 0 ? pagination.totalCount : rows.length;
  const hasMore = pagination.hasNext || totalKnown > rows.length;

  return (
    <DashboardPanel className="h-full">
      <DashboardSectionTitle
        title="Khối lượng giảng dạy của mentor"
        description="Xếp theo mức tải · ưu tiên mentor gần đầy và có yêu cầu chờ"
      />

      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Chưa có dữ liệu tải mentor.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <SummaryStat
              value={`${(avgUtilization * 100).toFixed(0)}%`}
              label="TB tải"
            />
            <SummaryStat
              value={formatCount(nearCapacityCount)}
              label="Gần đầy"
              tone={nearCapacityCount > 0 ? "danger" : "neutral"}
            />
            <SummaryStat
              value={formatCount(pendingTotal)}
              label="Chờ duyệt"
              tone={pendingTotal > 0 ? "warn" : "neutral"}
            />
          </div>

          <ul className="max-h-[220px] space-y-3 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] sm:max-h-[260px] lg:max-h-[280px] [&::-webkit-scrollbar]:hidden">
            {rows.map((row) => {
              const ratio = Math.min(100, row.utilization * 100);
              return (
                <li key={row.mentorId}>
                  <div className="flex items-start gap-3">
                    <Avatar className="size-10 shrink-0">
                      {row.avatarUrl ? (
                        <AvatarImage src={row.avatarUrl} alt="" />
                      ) : null}
                      <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
                        {getMentorInitials(row.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {row.name}
                          </p>
                          {row.title ? (
                            <p className="truncate text-[11px] text-muted-foreground">
                              {row.title}
                            </p>
                          ) : null}
                        </div>
                        <p className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                          {formatCount(row.assigned)}/{formatCount(row.max)}
                        </p>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={cn(
                            "h-full rounded-full transition-[width] duration-300",
                            loadBarClass(row.utilization),
                          )}
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </div>

                    {row.pending > 0 ? (
                      <span className="mt-1 shrink-0 rounded-md bg-steam-arts/15 px-2 py-1 text-[10px] font-semibold tabular-nums text-steam-arts">
                        {formatCount(row.pending)} chờ
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>

          {hasMore ? (
            <p className="text-[11px] text-muted-foreground">
              Đang hiện {formatCount(rows.length)} / {formatCount(totalKnown)}{" "}
              mentor
            </p>
          ) : null}
        </div>
      )}

      <Link
        href="/manager/experts"
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-steam-engineering hover:underline"
      >
        Duyệt mentor
        <ArrowUpRight className="size-3.5" />
      </Link>
    </DashboardPanel>
  );
}
