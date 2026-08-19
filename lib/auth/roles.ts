export type AccountRole = "Parent" | "Student" | "Mentor" | "Manager" | "Admin";

/** Normalize API/session role strings to app role literals. */
export function normalizeAccountRole(
  role: string | null | undefined,
): AccountRole | null {
  if (!role) return null;
  const normalized = role.trim().toLowerCase();
  if (normalized === "parent") return "Parent";
  if (normalized === "student") return "Student";
  if (normalized === "mentor") return "Mentor";
  if (normalized === "manager") return "Manager";
  if (normalized === "admin" || normalized === "superadmin") return "Admin";
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

export function isAdminRole(role: string | null | undefined): boolean {
  return normalizeAccountRole(role) === "Admin";
}

export function isMentorRole(role: string | null | undefined): boolean {
  return normalizeAccountRole(role) === "Mentor";
}

/** Manager console (`/manager/*`) — matches BE `[Authorize(Roles = "Admin,Manager")]`. */
export function canAccessManagerArea(role: string | null | undefined): boolean {
  const normalized = normalizeAccountRole(role);
  return normalized === "Manager" || normalized === "Admin";
}
