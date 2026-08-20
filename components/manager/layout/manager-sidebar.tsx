"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut, Search, User } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { clearAuthSession } from "@/lib/auth/session";
import {
  isManagerNavItemActive,
  MANAGER_NAV_GROUPS,
} from "@/lib/manager/nav";
import { cn } from "@/lib/utils";

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

type ManagerSidebarProps = {
  onOpenSearch?: () => void;
};

export function ManagerSidebar({ onOpenSearch }: ManagerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useCurrentUser();
  const { isMobile, state } = useSidebar();
  const [navQuery, setNavQuery] = React.useState("");

  const filteredGroups = React.useMemo(() => {
    const q = navQuery.trim().toLowerCase();
    if (!q) return MANAGER_NAV_GROUPS;
    return MANAGER_NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.label.toLowerCase().includes(q),
      ),
    })).filter((group) => group.items.length > 0);
  }, [navQuery]);

  function handleLogout() {
    clearAuthSession();
    router.replace("/login");
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-background">
      <SidebarHeader className="flex h-16 flex-row items-center justify-between border-b border-border/60 p-3 transition-all duration-200 group-data-[state=collapsed]:p-2">
        <Link
          href="/"
          className="flex w-full items-center gap-2.5 overflow-hidden px-2 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-0"
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg">
            <Image
              src={LOGO_URL}
              alt="OboxSTEAM"
              width={26}
              height={26}
              className="shrink-0 rounded-md"
            />
          </div>
          {state !== "collapsed" ? (
            <div className="ml-1 flex min-w-0 flex-1 animate-in items-center justify-between fade-in-0 duration-200">
              <span className="truncate font-heading text-sm font-bold tracking-tight text-foreground">
                OboxSTEAM
              </span>
              <span className="ml-2 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-primary">
                Manager
              </span>
            </div>
          ) : null}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {state !== "collapsed" ? (
          <div className="mb-3 px-1">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={navQuery}
                onChange={(event) => setNavQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && onOpenSearch) {
                    event.preventDefault();
                    onOpenSearch();
                  }
                }}
                placeholder="Lọc mục menu…"
                className="h-9 rounded-lg border-border bg-background pl-8 text-sm"
                aria-label="Lọc mục điều hướng"
              />
            </div>
            {onOpenSearch ? (
              <button
                type="button"
                onClick={onOpenSearch}
                className="mt-1.5 w-full px-1 text-left text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Mở tìm kiếm toàn cục ⌘K
              </button>
            ) : null}
          </div>
        ) : (
          <SidebarMenu className="mb-2">
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Tìm kiếm (⌘K)"
                onClick={onOpenSearch}
                className="justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Search className="size-4" />
                <span className="sr-only">Tìm kiếm</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}

        {filteredGroups.map((group) => (
          <SidebarGroup key={group.title} className="p-0 pb-3">
            {state !== "collapsed" ? (
              <SidebarGroupLabel className="mb-2 px-3 font-heading text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                {group.title}
              </SidebarGroupLabel>
            ) : null}
            <SidebarMenu className="space-y-1">
              {group.items.map((item) => {
                const isActive = isManagerNavItemActive(item.href, pathname);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      tooltip={item.label}
                      isActive={isActive}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary/10 font-semibold text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "size-4 shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/60 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="w-full text-left transition-all duration-200 hover:bg-muted data-[state=open]:bg-muted"
                  />
                }
              >
                <Avatar className="size-8 rounded-lg">
                  {profile?.avatarUrl ? (
                    <AvatarImage
                      src={profile.avatarUrl}
                      alt={profile.fullName ?? "Manager"}
                    />
                  ) : null}
                  <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                    {getInitials(profile?.fullName)}
                  </AvatarFallback>
                </Avatar>
                {state !== "collapsed" ? (
                  <>
                    <div className="ml-2 grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium text-foreground">
                        {profile?.fullName ?? "Manager"}
                      </span>
                      <span className="truncate text-xs font-light text-muted-foreground">
                        {profile?.email ?? "manager@obox.id"}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                  </>
                ) : null}
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-xl border border-border bg-card p-1 shadow-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2.5 px-2 py-1.5 text-left text-sm">
                      <Avatar className="size-8 rounded-lg">
                        {profile?.avatarUrl ? (
                          <AvatarImage
                            src={profile.avatarUrl}
                            alt={profile.fullName ?? "Manager"}
                          />
                        ) : null}
                        <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                          {getInitials(profile?.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold text-foreground">
                          {profile?.fullName ?? "Manager"}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {profile?.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-border/60" />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push("/profile")}
                    className="cursor-pointer gap-2 rounded-lg p-2 text-foreground focus:bg-muted focus:text-foreground not-data-[variant=destructive]:focus:**:!text-foreground"
                  >
                    <User className="size-4 !text-foreground" />
                    Hồ sơ cá nhân
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-border/60" />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleLogout}
                  className="cursor-pointer gap-2 rounded-lg p-2 focus:bg-red-50 focus:text-primary focus:**:text-primary"
                >
                  <LogOut className="size-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
