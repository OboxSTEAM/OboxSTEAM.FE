/** Normalize API/session role strings to app role literals. */
export function normalizeAccountRole(
  role: string | null | undefined,
): "Parent" | "Student" | "Mentor" | "Manager" | null {
  if (!role) return null;
  const normalized = role.trim().toLowerCase();
  if (normalized === "parent") return "Parent";
  if (normalized === "student") return "Student";
  if (normalized === "mentor") return "Mentor";
  if (normalized === "manager") return "Manager";
  if (role === "Parent" || role === "Student" || role === "Mentor" || role === "Manager") return role;
  return null;
}

export function isParentRole(role: string | null | undefined): boolean {
  return normalizeAccountRole(role) === "Parent";
}

export function isStudentRole(role: string | null | undefined): boolean {
  return normalizeAccountRole(role) === "Student";
}

export function isManagerRole(role: string | null | undefined): boolean {
  return normalizeAccountRole(role) === "Manager";
}
