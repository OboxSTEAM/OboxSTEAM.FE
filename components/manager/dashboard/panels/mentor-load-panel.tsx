"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { OperationsOverview } from "@/lib/api";

import { DashboardPanel, DashboardSectionTitle } from "../dashboard-panel";
import { formatCount } from "../dashboard-utils";

type MentorLoadPanelProps = {
  operations: OperationsOverview;
};

export function MentorLoadPanel({ operations }: MentorLoadPanelProps) {
  const mentors = operations.mentorUtilization.items;

  return (
    <DashboardPanel>
      <DashboardSectionTitle
        title="Khối lượng giảng dạy của mentor"
        description="Số lớp đang phụ trách so với hạn mức"
      />

      {mentors.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Chưa có dữ liệu tải mentor.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {mentors.slice(0, 6).map((mentor) => {
            const cap = mentor.max > 0 ? mentor.max : Math.max(mentor.assigned, 1);
            const ratio = Math.min(100, (mentor.assigned / cap) * 100);
            return (
              <li key={mentor.mentorId} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <p className="truncate font-medium text-foreground">
                    {mentor.mentorName || "Mentor"}
                  </p>
                  <p className="shrink-0 tabular-nums text-xs text-muted-foreground">
                    {formatCount(mentor.assigned)}/{formatCount(mentor.max)}
                    {mentor.pending > 0
                      ? ` · ${formatCount(mentor.pending)} chờ`
                      : null}
                  </p>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-steam-engineering"
                    style={{ width: `${ratio}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/manager/mentors"
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-steam-engineering hover:underline"
      >
        Duyệt mentor
        <ArrowUpRight className="size-3.5" />
      </Link>
    </DashboardPanel>
  );
}
