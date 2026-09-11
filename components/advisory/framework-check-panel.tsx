"use client";

import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

import type { FrameworkCheck } from "@/lib/api";
import { cn } from "@/lib/utils";

type FrameworkCheckPanelProps = {
  check: FrameworkCheck;
  /** Drop top margin when embedded under a section title or board header. */
  className?: string;
  compact?: boolean;
};

export function FrameworkCheckPanel({
  check,
  className,
  compact = false,
}: FrameworkCheckPanelProps) {
  const passedCount = check.checks.filter((item) => item.passed).length;
  const totalCount = check.checks.length;
  const ordered = [...check.checks].sort((a, b) => {
    if (a.passed === b.passed) return 0;
    return a.passed ? 1 : -1;
  });

  return (
    <div className={cn(!compact && "mt-4", className)}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {check.allPassed ? (
          <CheckCircle2 className="size-4 text-[#7CB342]" aria-hidden />
        ) : (
          <XCircle className="size-4 text-primary" aria-hidden />
        )}
        <span className="text-sm font-medium text-foreground">
          {check.allPassed
            ? "Đáp ứng yêu cầu khung"
            : "Còn mục chưa đáp ứng"}
        </span>
        {totalCount > 0 ? (
          <span className="text-xs tabular-nums text-muted-foreground">
            {passedCount}/{totalCount} đạt
          </span>
        ) : null}
      </div>

      {totalCount === 0 ? (
        <p className="text-sm text-muted-foreground">Không có mục kiểm tra.</p>
      ) : (
        <div className="overflow-x-auto">
          <table
            className={cn(
              "w-full border-collapse text-sm",
              compact ? "min-w-[360px]" : "min-w-[420px]",
            )}
          >
            <thead>
              <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="w-8 py-2 pr-2 font-semibold" scope="col">
                  <span className="sr-only">Trạng thái</span>
                </th>
                <th className="py-2 pr-4 font-semibold" scope="col">
                  Tiêu chí
                </th>
                <th className="py-2 pr-4 font-semibold" scope="col">
                  Yêu cầu
                </th>
                <th className="py-2 font-semibold" scope="col">
                  Thực tế
                </th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((item, index) => {
                const statusLabel = item.passed ? "Đạt" : "Chưa đạt";

                return (
                  <tr
                    key={`${item.code}-${index}`}
                    className="border-b border-border/70 last:border-b-0"
                  >
                    <td className="py-2.5 pr-2 align-top">
                      {item.passed ? (
                        <CheckCircle2
                          className="size-3.5 text-[#7CB342]"
                          aria-label={statusLabel}
                        />
                      ) : (
                        <AlertCircle
                          className="size-3.5 text-primary"
                          aria-label={statusLabel}
                        />
                      )}
                    </td>
                    <td className="py-2.5 pr-4 align-top font-medium text-foreground">
                      {item.label || item.code}
                    </td>
                    <td className="py-2.5 pr-4 align-top text-muted-foreground">
                      {item.expected?.trim() || "—"}
                    </td>
                    <td
                      className={cn(
                        "py-2.5 align-top tabular-nums",
                        item.passed
                          ? "text-muted-foreground"
                          : "font-medium text-foreground",
                      )}
                    >
                      {item.actual?.trim() || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
