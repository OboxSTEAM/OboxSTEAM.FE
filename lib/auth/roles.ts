/** Normalize API/session role strings to app role literals. */
export function normalizeAccountRole(
  role: string | null | undefined,
): "Parent" | "Student" | "Mentor" | null {
  if (!role) return null;
  const normalized = role.trim().toLowerCase();
  if (normalized === "parent") return "Parent";
  if (normalized === "student") return "Student";
  if (normalized === "mentor") return "Mentor";
  if (role === "Parent" || role === "Student" || role === "Mentor") return role;
  return null;
}

export function isParentRole(role: string | null | undefined): boolean {
  return normalizeAccountRole(role) === "Parent";
}

export function isStudentRole(role: string | null | undefined): boolean {
  return normalizeAccountRole(role) === "Student";
}
