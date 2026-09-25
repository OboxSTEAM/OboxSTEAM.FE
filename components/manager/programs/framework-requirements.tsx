import { AlertCircle, CheckCircle2, Circle } from "lucide-react";

import type { FrameworkCheck, ProgramFramework } from "@/lib/api";
import { cn } from "@/lib/utils";

export function buildFrameworkRules(framework: ProgramFramework): string[] {
  const rules: string[] = [];
  if (framework.minModules != null) {
    rules.push(`Tối thiểu ${framework.minModules} học phần`);
  }
  if (framework.minOfflineSessions != null) {
    rules.push(
      `Tối thiểu ${framework.minOfflineSessions} mẫu hoạt động offline trong curriculum`,
    );
  }
  if (framework.minLiveSessions != null) {
    rules.push(
      `Tối thiểu ${framework.minLiveSessions} mẫu hoạt động live trong curriculum`,
    );
  }
  if (framework.requireCapstoneResearchMilestone) {
    rules.push("Bắt buộc có mốc nghiên cứu / dự án tổng kết");
  }
  return rules;
}

const CHECK_LABELS: Record<string, (expected: string) => string> = {
  MinModules: (expected) => `Tối thiểu ${expected} học phần`,
  MinOfflineSessions: (expected) => `Tối thiểu ${expected} hoạt động offline`,
  MinLiveSessions: (expected) => `Tối thiểu ${expected} hoạt động live`,
  RequireCapstoneResearchMilestone: () => "Có mốc nghiên cứu / dự án tổng kết",
};

type CheckItem = FrameworkCheck["checks"][number];

function checkTitle(item: CheckItem): string {
  const expected = item.expected?.trim() || "";
  const labeled = item.code ? CHECK_LABELS[item.code] : undefined;
  if (labeled) return labeled(expected);
  return item.label?.trim() || "Yêu cầu khung";
}

function checkProgress(item: CheckItem): string {
  const actual = item.actual?.trim() || "0";
  if (item.code === "RequireCapstoneResearchMilestone") {
    return `${actual}/1`;
  }
  const expected = item.expected?.trim();
  return expected ? `${actual}/${expected}` : actual;
}

export function FrameworkRequirements({
  framework,
  frameworkVersionNumber,
  isCategoryMismatch = false,
  variant = "inline",
  check = null,
  isCheckLoading = false,
}: {
  framework: ProgramFramework;
  frameworkVersionNumber?: number | null;
  isCategoryMismatch?: boolean;
  variant?: "inline" | "banner";
  check?: FrameworkCheck | null;
  isCheckLoading?: boolean;
}) {
  const rules = buildFrameworkRules(framework);
  const items = check?.checks ?? [];
  const doneCount = items.filter((item) => item.passed).length;
  const showChecklist = variant === "banner" && (isCheckLoading || items.length > 0);
  const overallRatio = items.length > 0 ? doneCount / items.length : 0;

  return (
    <div
      className={
        variant === "banner"
          ? "rounded-2xl border border-border bg-card px-5 py-4 shadow-[0_2px_10px_rgba(45,45,45,0.03)]"
          : "mt-2.5 rounded-lg border border-border bg-muted/40 p-3"
      }
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Yêu cầu của khung
        </p>
        <p className="text-[11px] text-muted-foreground">
          {framework.name || "Khung thẩm định"}
          {frameworkVersionNumber != null ? ` · v${frameworkVersionNumber}` : ""}
          {" · "}
          {framework.expertName || "Chưa có chuyên gia"}
        </p>
      </div>
      {showChecklist ? (
        <div className="mt-3">
          <div className="mb-3 flex items-center gap-3">
            <div
              className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={items.length}
              aria-valuenow={doneCount}
              aria-label="Tiến độ yêu cầu khung"
            >
              <div
                className="h-full rounded-full bg-[#7CB342] transition-[width] duration-300"
                style={{ width: `${overallRatio * 100}%` }}
              />
            </div>
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
              {isCheckLoading && !check ? "—" : `${doneCount}/${items.length}`}
            </span>
          </div>
          {isCheckLoading && !check ? (
            <div className="h-16 animate-pulse rounded-lg bg-muted" />
          ) : (
            <ul className="space-y-2">
              {items.map((item, index) => (
                <li
                  key={`${item.code ?? "check"}-${index}`}
                  className="flex items-center gap-2"
                >
                  {item.passed ? (
                    <CheckCircle2 className="size-3.5 shrink-0 text-[#7CB342]" aria-label="Đạt" />
                  ) : (
                    <Circle className="size-3.5 shrink-0 text-muted-foreground" aria-label="Chưa đạt" />
                  )}
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-xs",
                      item.passed ? "text-muted-foreground" : "text-foreground",
                    )}
                  >
                    {checkTitle(item)}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {checkProgress(item)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : rules.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {rules.map((rule) => (
            <li
              key={rule}
              className="flex items-start gap-1.5 text-xs leading-relaxed text-foreground"
            >
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
              {rule}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Khung này không đặt yêu cầu tối thiểu về cấu trúc.
        </p>
      )}
      {isCategoryMismatch ? (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] font-medium text-primary">
          <AlertCircle className="mt-px size-3 shrink-0" />
          Khung này thuộc thể loại khác với chương trình — hãy kiểm tra lại.
        </p>
      ) : null}
    </div>
  );
}
