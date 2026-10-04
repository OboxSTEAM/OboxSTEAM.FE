"use client";

import { useClientFetch } from "@/hooks/use-client-fetch";
import type { ProgramFramework } from "@/lib/api";
import {
  academicGuidanceForDesigner,
  loadFrameworkVersions,
} from "@/lib/frameworks/academic-guidance";

type ProgramAcademicGuidanceTabProps = {
  framework: ProgramFramework | null;
  frameworkVersionNumber?: number | null;
  isFrameworkLoading?: boolean;
};

/** Read-only academic guidance for the framework pinned to this program. */
export function ProgramAcademicGuidanceTab({
  framework,
  frameworkVersionNumber = null,
  isFrameworkLoading = false,
}: ProgramAcademicGuidanceTabProps) {
  const frameworkId = framework?.id ?? null;
  const inlineVersions = framework?.versions ?? [];
  const {
    data: loadedVersions,
    isLoading: isVersionsLoading,
    hasError,
  } = useClientFetch({
    enabled: frameworkId != null && inlineVersions.length === 0,
    fetcher: () => loadFrameworkVersions(frameworkId!),
    deps: [frameworkId],
    minSkeletonMs: 0,
  });

  const versions = inlineVersions.length > 0 ? inlineVersions : (loadedVersions ?? []);
  const versionsMatch =
    versions.length === 0 ||
    versions.every((version) => version.frameworkId === frameworkId);
  const guidance =
    framework && versionsMatch
      ? academicGuidanceForDesigner(framework, versions, frameworkVersionNumber)
      : "";
  const isWaiting =
    isFrameworkLoading ||
    (Boolean(framework) && (!versionsMatch || (isVersionsLoading && !guidance)));

  return (
    <section className="max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
        Chuẩn nền
      </p>
      <h2 className="mt-1 font-heading text-lg font-bold text-foreground">
        Chuẩn học thuật
      </h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Định hướng sư phạm của khung đang gắn. Mở thẻ này khi soạn curriculum để đối chiếu.
      </p>

      {isWaiting ? (
        <div className="mt-5 h-28 animate-pulse rounded-xl bg-muted" />
      ) : !framework ? (
        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          Chương trình chưa gắn khung thẩm định, nên không có chuẩn học thuật để theo.
        </p>
      ) : (
        <>
          <p className="mt-5 text-sm font-semibold text-foreground">
            {framework.name || "Khung thẩm định"}
            {frameworkVersionNumber != null ? ` · v${frameworkVersionNumber}` : ""}
          </p>
          {guidance ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground">
              {guidance}
            </p>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {hasError
                ? "Không tải được hướng dẫn học thuật của khung này."
                : "Khung này chưa ghi hướng dẫn học thuật."}
            </p>
          )}
        </>
      )}
    </section>
  );
}
