"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut, User } from "lucide-react";

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
import { clearAuthSession } from "@/lib/auth/session";
import { useCurrentUser } from "@/hooks/use-current-user";

const LOGO_URL =
  "https://oboxsteam-bucket-main.s3.ap-southeast-1.amazonaws.com/Seed/Material/logo-obox.png";

function getInitials(name?: string | null): string {
  if (!name?.trim()) return "M";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function ManagerHeader({ title }: { title?: string }) {
  const router = useRouter();
  const { profile } = useCurrentUser();

  function handleLogout() {
    clearAuthSession();
    router.replace("/login");
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#E5E5E0] bg-white px-6">
      {/* Page title slot */}
      <div>
        {title ? (
          <h1 className="font-heading text-lg font-semibold text-[#2D2D2D]">{title}</h1>
        ) : null}
      </div>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center gap-2.5 rounded-full outline-none ring-2 ring-transparent transition hover:ring-[#E5E5E0] focus-visible:ring-[#4FC3F7]"
          aria-label="Tài khoản"
        >
          <Avatar className="size-9">
            {profile?.avatarUrl ? (
              <AvatarImage src={profile.avatarUrl} alt={profile.fullName ?? "Manager"} />
            ) : null}
            <AvatarFallback className="bg-[#E94B3C]/10 text-sm font-semibold text-[#E94B3C]">
              {getInitials(profile?.fullName)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium text-[#2D2D2D] sm:block">
            {profile?.fullName ?? profile?.email ?? "Manager"}
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-60">
          {/* Label must be inside DropdownMenuGroup (Base UI requirement) */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-2.5 py-0.5">
                <Image
                  src={LOGO_URL}
                  alt="OboxSTEAM"
                  width={20}
                  height={20}
                  className="rounded-sm"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#2D2D2D]">
                    {profile?.fullName ?? profile?.email ?? "Manager"}
                  </p>
                  <p className="truncate text-xs text-[#6B6B6B]">{profile?.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => router.push("/profile")}
              className="cursor-pointer"
            >
              <User className="mr-2 size-4" aria-hidden />
              Hồ sơ cá nhân
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-[#E94B3C] focus:text-[#E94B3C]"
            >
              <LogOut className="mr-2 size-4" aria-hidden />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
