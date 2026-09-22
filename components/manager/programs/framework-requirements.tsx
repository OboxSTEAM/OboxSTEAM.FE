import { AlertCircle } from "lucide-react";

import type { ProgramFramework } from "@/lib/api";

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

export function FrameworkRequirements({
  framework,
  frameworkVersionNumber,
  isCategoryMismatch = false,
  variant = "inline",
}: {
  framework: ProgramFramework;
  frameworkVersionNumber?: number | null;
  isCategoryMismatch?: boolean;
  variant?: "inline" | "banner";
}) {
  const rules = buildFrameworkRules(framework);

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
      {rules.length > 0 ? (
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
