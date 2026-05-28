"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ACCOUNT_NAV_ITEMS,
  LOGOUT_NAV_ITEM,
} from "@/lib/auth/account-nav";
import { clearAuthSession, type StoredAuthSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

type UserAccountMenuProps = {
  session: StoredAuthSession;
  scrolled: boolean;
};

function getInitials(displayName: string, email: string): string {
  const source = displayName.trim() || email.split("@")[0] || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function UserAccountMenu({ session, scrolled }: UserAccountMenuProps) {
  const router = useRouter();
  const email = session.user?.email ?? "";
  const displayName = session.user?.displayName ?? email.split("@")[0] ?? "Học viên";
  const initials = getInitials(displayName, email);

  const handleLogout = () => {
    clearAuthSession();
    router.push("/");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2",
          scrolled
            ? "focus-visible:ring-[#E94B3C]/40 focus-visible:ring-offset-[#FAFAF5]"
            : "focus-visible:ring-white/50 focus-visible:ring-offset-transparent",
        )}
        aria-label="Menu tài khoản"
      >
        <Avatar className="size-11 ring-2 ring-white/25 sm:size-12">
          {session.user?.avatarUrl ? (
            <AvatarImage src={session.user.avatarUrl} alt={displayName} />
          ) : null}
          <AvatarFallback
            className={cn(
              "text-sm font-semibold sm:text-base",
              scrolled
                ? "bg-[#E94B3C] text-white"
                : "bg-white/15 text-white backdrop-blur-sm",
            )}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="z-[60] w-64 p-1.5"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-2 font-normal">
            <p className="text-base font-medium text-foreground">{displayName}</p>
            {email ? (
              <p className="truncate text-sm text-muted-foreground">{email}</p>
            ) : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {ACCOUNT_NAV_ITEMS.map((item) => (
            <DropdownMenuItem
              key={item.href}
              render={<Link href={item.href} />}
              className="gap-2.5 px-2 py-2 text-base"
            >
              <item.icon className="size-[1.125rem] text-muted-foreground" />
              <span>{item.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            onClick={handleLogout}
            className="gap-2.5 px-2 py-2 text-base"
          >
            <LOGOUT_NAV_ITEM.icon className="size-[1.125rem]" />
            <span>{LOGOUT_NAV_ITEM.label}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
