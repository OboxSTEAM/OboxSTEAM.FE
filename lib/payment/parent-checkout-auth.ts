import type { ParentCheckoutSession } from "@/lib/api/entities/payment";
import {
  decodeJwtPayload,
  readJwtEmail,
  readJwtRole,
} from "@/lib/auth/jwt-payload";
import { persistAuthSession } from "@/lib/auth/session";

/** Stores parent checkout access token before Stripe redirect (same-tab session). */
export function persistParentCheckoutAuth(
  checkout: Pick<ParentCheckoutSession, "accessToken" | "refreshToken">,
): void {
  const payload = decodeJwtPayload(checkout.accessToken);
  const email = payload ? readJwtEmail(payload) : undefined;
  const role = payload ? readJwtRole(payload) : undefined;

  persistAuthSession(
    {
      accessToken: checkout.accessToken,
      refreshToken: checkout.refreshToken ?? "",
    },
    email || role
      ? {
          ...(email ? { email } : {}),
          ...(role ? { role } : {}),
        }
      : undefined,
  );
}
