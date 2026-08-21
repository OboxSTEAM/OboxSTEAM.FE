type JwtPayloadRecord = Record<string, unknown>;

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

/** Best-effort JWT payload decode for client-side session hints (not verified). */
export function decodeJwtPayload(token: string): JwtPayloadRecord | null {
  try {
    const segment = token.split(".")[1];
    if (!segment) return null;
    return JSON.parse(decodeBase64Url(segment)) as JwtPayloadRecord;
  } catch {
    return null;
  }
}

function readStringClaim(payload: JwtPayloadRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

export function readJwtEmail(payload: JwtPayloadRecord): string | undefined {
  return readStringClaim(payload, [
    "email",
    "unique_name",
    "preferred_username",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
  ]);
}

export function readJwtRole(payload: JwtPayloadRecord): string | undefined {
  return readJwtRoles(payload)[0];
}

/** All role claims from a JWT (ASP.NET may emit a string or string[]). */
export function readJwtRoles(payload: JwtPayloadRecord): string[] {
  const keys = [
    "role",
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
  ];
  const roles: string[] = [];

  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      roles.push(value.trim());
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.trim()) {
          roles.push(item.trim());
        }
      }
    }
  }

  return roles;
}
