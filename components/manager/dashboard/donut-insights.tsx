import { cn } from "@/lib/utils";

import { formatCount } from "./dashboard-utils";

export type DonutInsightSlice = {
  key: string;
  label: string;
  value: number;
  color: string;
  share: number;
};

export type DonutAttentionItem = {
  key: string;
  label: string;
  tone?: "warn" | "info" | "neutral";
};

/** Mirrors the donut as a compact 100% stacked bar. */
export function DonutStackBar({
  slices,
  className,
}: {
  slices: DonutInsightSlice[];
  className?: string;
}) {
  if (slices.length === 0) return null;

  return (
    <div
      className={cn(
        "flex h-2 w-full overflow-hidden rounded-full bg-secondary",
        className,
      )}
      role="img"
      aria-label="Thanh tỷ trọng phân bổ"
    >
      {slices.map((slice) =>
        slice.share > 0 ? (
          <div
            key={slice.key}
            className="h-full min-w-0 transition-[width] duration-300"
            style={{
              width: `${slice.share}%`,
              backgroundColor: slice.color,
            }}
            title={`${slice.label}: ${slice.share.toFixed(0)}%`}
          />
        ) : null,
      )}
    </div>
  );
}

export function DonutDominantLine({
  slices,
  unitLabel,
}: {
  slices: DonutInsightSlice[];
  unitLabel?: string;
}) {
  const dominant = [...slices].sort((a, b) => b.value - a.value)[0];
  if (!dominant) return null;

  return (
    <p className="text-center text-[10px] leading-snug text-muted-foreground">
      Chủ yếu{" "}
      <span className="font-semibold text-foreground">{dominant.label}</span>
      {" · "}
      <span className="tabular-nums font-semibold text-foreground">
        {dominant.share.toFixed(0)}%
      </span>
      {unitLabel ? (
        <span className="text-muted-foreground"> · {formatCount(dominant.value)} {unitLabel}</span>
      ) : null}
    </p>
  );
}

export function DonutAttentionChips({
  items,
  className,
}: {
  items: DonutAttentionItem[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap justify-center gap-1.5", className)}>
      {items.map((item) => (
        <span
          key={item.key}
          className={cn(
            "rounded-md px-2 py-0.5 text-[10px] font-semibold tabular-nums",
            item.tone === "warn" && "bg-steam-arts/15 text-steam-arts",
            item.tone === "info" && "bg-steam-engineering/15 text-steam-engineering",
            (!item.tone || item.tone === "neutral") &&
              "bg-secondary text-muted-foreground",
          )}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function enrollmentStatusAttention(
  slices: DonutInsightSlice[],
): DonutAttentionItem[] {
  const byStatus = new Map(slices.map((s) => [s.key, s]));
  const items: DonutAttentionItem[] = [];

  const pending = byStatus.get("PendingPayment");
  if (pending && pending.value > 0) {
    items.push({
      key: "pending-payment",
      label: `${formatCount(pending.value)} chờ thanh toán`,
      tone: "warn",
    });
  }

  const active = byStatus.get("Active");
  if (active && active.value > 0) {
    items.push({
      key: "active",
      label: `${formatCount(active.value)} đang học`,
      tone: "info",
    });
  }

  const stalled = ["Failed", "Dropped"]
    .map((key) => byStatus.get(key))
    .filter((s): s is DonutInsightSlice => !!s && s.value > 0);
  const stalledTotal = stalled.reduce((sum, s) => sum + s.value, 0);
  if (stalledTotal > 0) {
    items.push({
      key: "stalled",
      label: `${formatCount(stalledTotal)} dừng / không đạt`,
      tone: "neutral",
    });
  }

  return items.slice(0, 2);
}

export function classStatusAttention(
  slices: DonutInsightSlice[],
): DonutAttentionItem[] {
  const byStatus = new Map(slices.map((s) => [s.key, s]));
  const items: DonutAttentionItem[] = [];

  const ready = byStatus.get("ReadyForMentor");
  if (ready && ready.value > 0) {
    items.push({
      key: "ready-mentor",
      label: `${formatCount(ready.value)} chờ mentor`,
      tone: "warn",
    });
  }

  const draft = byStatus.get("Draft");
  if (draft && draft.value > 0) {
    items.push({
      key: "draft",
      label: `${formatCount(draft.value)} nháp`,
      tone: "neutral",
    });
  }

  const running = ["Open", "InProgress"]
    .map((key) => byStatus.get(key))
    .filter((s): s is DonutInsightSlice => !!s && s.value > 0);
  const runningTotal = running.reduce((sum, s) => sum + s.value, 0);
  if (runningTotal > 0) {
    items.push({
      key: "running",
      label: `${formatCount(runningTotal)} đang vận hành`,
      tone: "info",
    });
  }

  return items.slice(0, 2);
}
