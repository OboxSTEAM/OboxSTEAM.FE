"use client";

import { CheckCircle2, CircleAlert } from "lucide-react";

import { useOptionalAdvisoryChat } from "@/components/advisory-chat/advisory-chat-provider";
import { Button } from "@/components/ui/button";
import type { AffectedCurriculumLink, ProgramFrameworkCheck } from "@/lib/api";
import { frameworkCheckProgress, frameworkCheckTitle } from "@/lib/frameworks/rule-labels";
import { cn } from "@/lib/utils";

const MAX_VISIBLE_LINKS = 4;

type FrameworkCheckListProps = {
  check: ProgramFrameworkCheck | null;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  /** Called after a successful jump to an affected component (e.g. close the dialog). */
  onNavigated?: () => void;
};

/** Live framework rules; failing rules list the components to fix. */
export function FrameworkCheckList({
  check,
  isLoading,
  error,
  onRetry,
  onNavigated,
}: FrameworkCheckListProps) {
  if (!check && isLoading) {
    return (
      <div className="space-y-2" aria-hidden>
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-9 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
        ))}
      </div>
    );
  }

  if (!check) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground">
        <span>{error ? "Không tải được kết quả kiểm tra khung." : "Chưa có kết quả kiểm tra khung."}</span>
        <Button variant="outline" size="xs" onClick={onRetry}>
          Thử lại
        </Button>
      </div>
    );
  }

  if (check.checks.length === 0) {
    return (
      <p className="rounded-lg bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground">
        Không áp dụng khung — chương trình chưa gắn khung thẩm định nào.
      </p>
    );
  }

  const ordered = [...check.checks].sort((a, b) => Number(a.passed) - Number(b.passed));

  return (
    <ul className="space-y-1.5">
      {ordered.map((item, index) => {
        const progress = frameworkCheckProgress(item);
        return (
          <li
            key={`${item.code || "check"}-${index}`}
            className={cn(
              "rounded-lg px-3 py-2",
              item.passed ? "bg-muted/40" : "bg-amber-500/10",
            )}
          >
            <div className="flex items-start gap-2">
              {item.passed ? (
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-label="Đạt" />
              ) : (
                <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-700 dark:text-amber-400" aria-label="Chưa đạt" />
              )}
              <span
                className={cn(
                  "min-w-0 flex-1 text-xs leading-relaxed",
                  item.passed ? "text-muted-foreground" : "font-medium text-foreground",
                )}
              >
                {frameworkCheckTitle(item)}
              </span>
              {progress ? (
                <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                  {progress}
                </span>
              ) : null}
            </div>
            {!item.passed && item.affectedCurriculumLinks.length > 0 ? (
              <AffectedLinks links={item.affectedCurriculumLinks} onNavigated={onNavigated} />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function AffectedLinks({
  links,
  onNavigated,
}: {
  links: AffectedCurriculumLink[];
  onNavigated?: () => void;
}) {
  const chat = useOptionalAdvisoryChat();
  const visible = links.slice(0, MAX_VISIBLE_LINKS);
  const hiddenCount = links.length - visible.length;

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1 pl-5.5">
      {visible.map((link) => {
        const label = link.label || "Mục không tên";
        if (!chat) {
          return (
            <span key={`${link.targetType}:${link.id}`} className="rounded-md bg-background px-1.5 py-0.5 text-[11px] text-foreground">
              {label}
            </span>
          );
        }
        return (
          <button
            key={`${link.targetType}:${link.id}`}
            type="button"
            onClick={() => {
              const isNavigated = chat.navigateToMention({ targetType: link.targetType, targetId: link.id });
              if (isNavigated) onNavigated?.();
            }}
            className="max-w-full truncate rounded-md bg-background px-1.5 py-0.5 text-[11px] text-primary underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {label}
          </button>
        );
      })}
      {hiddenCount > 0 ? (
        <span className="text-[11px] text-muted-foreground">+{hiddenCount} mục khác</span>
      ) : null}
    </div>
  );
}
