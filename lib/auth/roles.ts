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

/**
 * Default screen after login when there is no deep `returnUrl`.
 * Student / Parent stay on the marketing landing page.
 */
export function getRoleHomePath(role: string | null | undefined): string {
  if (canAccessManagerArea(role)) return "/manager";
  if (isMentorRole(role)) return "/mentor/classes";
  return "/";
}

/** Prefer staff consoles when a JWT carries multiple role claims. */
export function getPreferredRoleHomePath(
  roles: Array<string | null | undefined>,
): string {
  if (roles.some((role) => canAccessManagerArea(role))) return "/manager";
  if (roles.some((role) => isMentorRole(role))) return "/mentor/classes";
  return "/";
}

/**
 * Whether any of `roles` may open `path` after login.
 * Staff consoles are role-gated; other relative paths are allowed for any role.
 */
export function canRolesAccessPath(
  roles: Array<string | null | undefined>,
  path: string,
): boolean {
  if (path === "/manager" || path.startsWith("/manager/")) {
    return roles.some((role) => canAccessManagerArea(role));
  }
  if (path === "/mentor" || path.startsWith("/mentor/")) {
    return roles.some((role) => isMentorRole(role));
  }
  return true;
}
