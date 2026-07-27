"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

import type { AttentionItem } from "./dashboard-utils";

function toneDot(tone: AttentionItem["tone"]) {
  switch (tone) {
    case "danger":
    case "warn":
      return "bg-destructive";
    default:
      return "bg-muted-foreground";
  }
}

type DashboardAlertStripProps = {
  items: AttentionItem[];
};

/** Slim horizontal action pills — hidden when there are no items. */
export function DashboardAlertStrip({ items }: DashboardAlertStripProps) {
  if (items.length === 0) return null;

  return (
    <div
      role="list"
      aria-label="Việc cần làm"
      className="flex flex-wrap items-center gap-2"
    >
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          role="listitem"
          className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs transition-colors hover:border-foreground/20 hover:bg-background"
        >
          <span
            className={cn("size-1.5 shrink-0 rounded-full", toneDot(item.tone))}
            aria-hidden
          />
          <span className="truncate font-semibold text-foreground">
            {item.title}
          </span>
          <span className="shrink-0 text-muted-foreground">{item.detail}</span>
          <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" />
        </Link>
      ))}
    </div>
  );
}
