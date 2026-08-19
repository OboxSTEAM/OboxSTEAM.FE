"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  DashboardPanel,
  DashboardSectionTitle,
} from "./dashboard-panel";
import type { AttentionItem } from "./dashboard-utils";

function toneClass(tone: AttentionItem["tone"]) {
  switch (tone) {
    case "danger":
      return "text-steam-science";
    case "warn":
      return "text-steam-arts";
    case "info":
      return "text-steam-engineering";
    default:
      return "text-steam-technology";
  }
}

type DashboardActionQueueProps = {
  items: AttentionItem[];
};

/** Actionable work queue — each row links to the page that can resolve it. */
export function DashboardActionQueue({ items }: DashboardActionQueueProps) {
  return (
    <DashboardPanel>
      <DashboardSectionTitle
        title="Cần xử lý ngay"
        description="Mentor chờ duyệt · bài chờ chấm · thanh toán chờ"
      />

      {items.length === 0 ? (
        <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-steam-technology" aria-hidden />
          Không có việc cần xử lý ngay.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center justify-between gap-3 rounded-xl bg-background px-3 py-2.5 transition-colors hover:bg-secondary"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 text-xs font-semibold",
                    toneClass(item.tone),
                  )}
                >
                  {item.status}
                  <ArrowUpRight className="size-3.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  );
}
