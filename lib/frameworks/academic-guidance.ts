import {
  getFrameworkVersions,
  getProgramFrameworkById,
  type ProgramFramework,
  type ProgramFrameworkVersion,
} from "@/lib/api";

const frameworkVersionCache = new Map<string, Promise<ProgramFrameworkVersion[]>>();

/** Versions for a framework, reused across the create form and the edit tab. */
export function loadFrameworkVersions(
  frameworkId: string,
): Promise<ProgramFrameworkVersion[]> {
  const cached = frameworkVersionCache.get(frameworkId);
  if (cached) return cached;

  const pending = (async () => {
    const detail = await getProgramFrameworkById(frameworkId);
    const fromDetail = detail?.data?.versions ?? [];
    if (fromDetail.length > 0) return fromDetail;
    const versions = await getFrameworkVersions(frameworkId);
    return versions?.data ?? [];
  })();

  frameworkVersionCache.set(frameworkId, pending);
  pending.catch(() => {
    frameworkVersionCache.delete(frameworkId);
  });
  return pending;
}

/**
 * Guidance the designer should follow. Prefers the version pinned on the program,
 * then the published current version.
 */
export function academicGuidanceForDesigner(
  framework: ProgramFramework,
  versions: ProgramFrameworkVersion[],
  pinnedVersionNumber?: number | null,
): string {
  const pool = versions.length > 0 ? versions : framework.versions;
  const published = pool.filter((version) => version.isPublished);
  const pinned =
    pinnedVersionNumber != null
      ? pool.find((version) => version.versionNumber === pinnedVersionNumber)
      : undefined;
  const current =
    pinned ??
    published.find((version) => version.id === framework.currentVersionId) ??
    [...published].sort((left, right) => right.versionNumber - left.versionNumber)[0] ??
    [...pool].sort((left, right) => right.versionNumber - left.versionNumber)[0];
  return (current?.academicGuidance || framework.academicGuidance || "").trim();
}
