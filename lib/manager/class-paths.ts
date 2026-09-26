/** Manager class URLs — nested under a program when editing from Chương trình. */

export type ManagerClassDetailTab = "tong-quan" | "lich-hoc" | (string & {});

export function managerProgramClassesHref(programId: string): string {
  return `/manager/programs/${programId}?tab=classes`;
}

export function managerClassListHref(programId?: string | null): string {
  return programId ? managerProgramClassesHref(programId) : "/manager/classes";
}

export function managerClassDetailHref(
  classId: string,
  options?: {
    programId?: string | null;
    tab?: ManagerClassDetailTab;
  },
): string {
  const programId = options?.programId?.trim() || null;
  const base = programId
    ? `/manager/programs/${programId}/classes/${classId}`
    : `/manager/classes/${classId}`;

  const tab = options?.tab;
  if (!tab || tab === "tong-quan") return base;
  return `${base}?tab=${encodeURIComponent(tab)}`;
}
