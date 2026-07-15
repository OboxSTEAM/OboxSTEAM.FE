"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  ChevronRight,
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  Settings2,
  Users,
  User,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { clearAuthSession } from "@/lib/auth/session";
import {
  matchProgramDetailId,
  platformFocusFromPath,
  type PlatformCurriculumFocus,
} from "@/lib/manager/curriculum-focus";

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

type NavItem = {
  title: string;
  url: string;
  focus?: PlatformCurriculumFocus;
};

/**
 * - Parent group label navigates (e.g. Chương trình học → list).
 * - Chevron alone expands/collapses children.
 * - Module / Course / Activity deep-link into the open program via ?node=.
 */
function resolveNavHref(item: NavItem, programId: string | null): string {
  if (item.focus === "program") {
    return "/manager/programs";
  }
  if (programId && item.focus) {
    return `/manager/programs/${programId}?node=${item.focus}`;
  }
  return item.url;
}

function isNavItemActive(
  item: NavItem,
  pathname: string,
  programId: string | null,
  curriculumFocus: PlatformCurriculumFocus | null,
): boolean {
  if (item.focus === "program") {
    // List / create
    if (
      pathname === "/manager/programs" ||
      pathname.startsWith("/manager/programs/create")
    ) {
      return true;
    }
    // Program detail at program-level edit (no deeper node)
    return !!programId && curriculumFocus === "program";
  }

  if (programId) {
    if (item.focus) return curriculumFocus === item.focus;
    return pathname === item.url || pathname.startsWith(item.url + "/");
  }

  if (item.focus) return false;
  return pathname === item.url || pathname.startsWith(item.url + "/");
}

function CollapsibleMenuGroup({
  item,
  pathname,
  programId,
  curriculumFocus,
}: {
  item: {
    title: string;
    url: string;
    icon: React.ComponentType<{ className?: string }>;
    items?: NavItem[];
  };
  pathname: string;
  programId: string | null;
  curriculumFocus: PlatformCurriculumFocus | null;
}) {
  const { state } = useSidebar();
  const isIcon = state === "collapsed";

  const isGroupActive =
    pathname.startsWith(item.url) ||
    !!item.items?.some((sub) => {
      if (sub.focus) {
        // Any curriculum focus (list or program detail) keeps the group lit
        if (pathname.startsWith("/manager/programs")) return true;
        return (
          pathname === sub.url ||
          pathname.startsWith(sub.url + "/") ||
          (programId != null && curriculumFocus === sub.focus)
        );
      }
      return pathname === sub.url || pathname.startsWith(sub.url + "/");
    });

  const [open, setOpen] = React.useState(!!isGroupActive);
  const [prevPathname, setPrevPathname] = React.useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (isGroupActive) {
      setOpen(true);
    }
  }

  React.useEffect(() => {
    if (programId && curriculumFocus) setOpen(true);
  }, [programId, curriculumFocus]);

  // Icon-collapsed rail: single highlighted button + tooltip (no chevron / submenu chrome)
  if (isIcon) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={item.title}
          isActive={isGroupActive}
          render={<Link href={item.url} />}
          className={cn(
            "w-full justify-center rounded-lg transition-all duration-200",
            isGroupActive
              ? "bg-[#E94B3C]/10 text-[#E94B3C] font-semibold"
              : "text-[#6B6B6B] hover:bg-[#F5F5F0] hover:text-[#2D2D2D]",
          )}
        >
          <item.icon
            className={cn(
              "size-4 shrink-0",
              isGroupActive ? "text-[#E94B3C]" : "text-[#6B6B6B]",
            )}
          />
          <span className="sr-only">{item.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible
      render={<SidebarMenuItem />}
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
    >
      <div
        className={cn(
          "flex w-full items-center gap-0.5 rounded-lg transition-colors",
          isGroupActive ? "bg-[#E94B3C]/10" : "hover:bg-[#F5F5F0]",
        )}
      >
        <Link
          href={item.url}
          title={item.title}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isGroupActive
              ? "font-semibold text-[#E94B3C]"
              : "text-[#6B6B6B] hover:text-[#2D2D2D]",
          )}
        >
          <item.icon
            className={cn(
              "size-4 shrink-0",
              isGroupActive ? "text-[#E94B3C]" : "text-[#6B6B6B]",
            )}
          />
          <span className="truncate">{item.title}</span>
        </Link>
        <button
          type="button"
          aria-label={open ? `Thu gọn ${item.title}` : `Mở ${item.title}`}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="mr-1 flex size-7 shrink-0 items-center justify-center rounded-md text-[#6B6B6B] transition-colors hover:bg-[#E5E5E0]/60 hover:text-[#2D2D2D]"
        >
          <ChevronRight
            className={cn(
              "size-3.5 transition-transform duration-200",
              open && "rotate-90",
            )}
          />
        </button>
      </div>
      <CollapsibleContent>
        <SidebarMenuSub className="ml-4 my-1 space-y-0.5 border-l border-[#E5E5E0]/60 pl-2">
          {item.items?.map((subItem) => {
            const href = resolveNavHref(subItem, programId);
            const isSubActive = isNavItemActive(
              subItem,
              pathname,
              programId,
              curriculumFocus,
            );
            return (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  render={<Link href={href} />}
                  isActive={false}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[13px] transition-all duration-150",
                    isSubActive
                      ? "bg-[#E94B3C]/10 font-semibold text-[#E94B3C]"
                      : "text-[#6B6B6B] hover:bg-[#F5F5F0] hover:text-[#2D2D2D]",
                  )}
                >
                  <span>{subItem.title}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ManagerSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile } = useCurrentUser();
  const { isMobile, state } = useSidebar();

  const programId = matchProgramDetailId(pathname);
  const curriculumFocus = platformFocusFromPath(
    pathname,
    searchParams.get("node"),
  );

  const navGroups = [
    {
      title: "Platform",
      items: [
        {
          title: "Dashboard",
          url: "/manager",
          icon: LayoutDashboard,
          isFlat: true as const,
        },
        {
          title: "Chương trình học",
          url: "/manager/programs",
          icon: BookOpen,
          items: [
            { title: "Chương trình", url: "/manager/programs", focus: "program" as const },
            { title: "Module", url: "/manager/programs", focus: "module" as const },
            { title: "Khóa học", url: "/manager/programs", focus: "course" as const },
            { title: "Hoạt động", url: "/manager/activities", focus: "activity" as const },
            { title: "Tài liệu", url: "/manager/materials" },
            { title: "Ngân hàng câu hỏi", url: "/manager/question-bank" },
            { title: "Milestone nghiên cứu", url: "/manager/milestones" },
            { title: "Bài tập", url: "/manager/assignments" },
          ],
        },
        {
          title: "Lớp học",
          url: "/manager/classes",
          icon: Users,
          items: [
            { title: "Lớp học", url: "/manager/classes" },
            { title: "Lịch học", url: "/manager/sessions" },
            { title: "Điểm danh", url: "/manager/attendance" },
          ],
        },
        {
          title: "Vận hành",
          url: "/manager/enrollments",
          icon: Settings2,
          items: [
            { title: "Đăng ký học", url: "/manager/enrollments" },
            { title: "Đánh giá", url: "/manager/reviews" },
            { title: "Chuyên gia", url: "/manager/experts" },
            { title: "Duyệt Mentor", url: "/manager/mentors" },
          ],
        },
      ],
    },
  ];

  function handleLogout() {
    clearAuthSession();
    router.replace("/login");
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-[#E5E5E0] bg-[#FAFAF5]">
      <SidebarHeader className="border-b border-[#E5E5E0]/60 p-3 group-data-[state=collapsed]:p-2 h-16 flex flex-row items-center justify-between transition-all duration-200">
        <Link
          href="/"
          className="flex items-center gap-2.5 overflow-hidden w-full px-2 group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:justify-center"
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg">
            <Image
              src={LOGO_URL}
              alt="OboxSTEAM"
              width={26}
              height={26}
              className="rounded-md shrink-0"
            />
          </div>
          {state !== "collapsed" && (
            <div className="flex items-center justify-between flex-1 min-w-0 ml-1 animate-in fade-in-0 duration-200">
              <span className="font-heading text-sm font-bold tracking-tight text-[#2D2D2D] truncate">
                OboxSTEAM
              </span>
              <span className="ml-2 shrink-0 rounded-full bg-[#E94B3C]/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#E94B3C]">
                Manager
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {navGroups.map((group) => (
          <SidebarGroup key={group.title} className="p-0">
            {state !== "collapsed" && (
              <SidebarGroupLabel className="px-3 font-heading text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B]/80 mb-2">
                {group.title}
              </SidebarGroupLabel>
            )}
            <SidebarMenu className="space-y-1">
              {group.items.map((item) => {
                if ("isFlat" in item && item.isFlat) {
                  const isActive = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        render={<Link href={item.url} />}
                        tooltip={item.title}
                        isActive={isActive}
                        className={cn(
                          "w-full transition-all duration-200 rounded-lg px-3 py-2 text-sm font-medium flex items-center gap-3",
                          isActive
                            ? "bg-[#E94B3C]/10 text-[#E94B3C] font-semibold"
                            : "text-[#6B6B6B] hover:bg-[#F5F5F0] hover:text-[#2D2D2D]",
                        )}
                      >
                        {item.icon && (
                          <item.icon
                            className={cn(
                              "size-4 shrink-0",
                              isActive ? "text-[#E94B3C]" : "text-[#6B6B6B]",
                            )}
                          />
                        )}
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <CollapsibleMenuGroup
                    key={item.title}
                    item={item}
                    pathname={pathname}
                    programId={programId}
                    curriculumFocus={curriculumFocus}
                  />
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-[#E5E5E0]/60 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="w-full text-left transition-all duration-200 hover:bg-[#F5F5F0] data-[state=open]:bg-[#F5F5F0]"
                  />
                }
              >
                <Avatar className="size-8 rounded-lg">
                  {profile?.avatarUrl ? (
                    <AvatarImage src={profile.avatarUrl} alt={profile.fullName ?? "Manager"} />
                  ) : null}
                  <AvatarFallback className="rounded-lg bg-[#E94B3C]/10 text-xs font-semibold text-[#E94B3C]">
                    {getInitials(profile?.fullName)}
                  </AvatarFallback>
                </Avatar>
                {state !== "collapsed" && (
                  <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                    <span className="truncate font-medium text-[#2D2D2D]">
                      {profile?.fullName ?? "Manager"}
                    </span>
                    <span className="truncate text-xs text-[#6B6B6B] font-light">
                      {profile?.email ?? "manager@obox.id"}
                    </span>
                  </div>
                )}
                {state !== "collapsed" && <ChevronsUpDown className="ml-auto size-4 text-[#6B6B6B]" />}
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-xl border border-[#E5E5E0] bg-white p-1 shadow-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2.5 px-2 py-1.5 text-left text-sm">
                      <Avatar className="size-8 rounded-lg">
                        {profile?.avatarUrl ? (
                          <AvatarImage src={profile.avatarUrl} alt={profile.fullName ?? "Manager"} />
                        ) : null}
                        <AvatarFallback className="rounded-lg bg-[#E94B3C]/10 text-xs font-semibold text-[#E94B3C]">
                          {getInitials(profile?.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold text-[#2D2D2D]">
                          {profile?.fullName ?? "Manager"}
                        </span>
                        <span className="truncate text-xs text-[#6B6B6B]">
                          {profile?.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-[#E5E5E0]/60" />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="gap-2 p-2 focus:bg-[#F5F5F0] cursor-pointer rounded-lg text-xs font-medium text-[#6B6B6B] hover:text-[#2D2D2D] disabled:opacity-50">
                    <Sparkles className="size-4 text-[#FDD835]" />
                    Upgrade to Premium
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-[#E5E5E0]/60" />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push("/profile")}
                    className="gap-2 p-2 focus:bg-[#F5F5F0] cursor-pointer rounded-lg text-[#2D2D2D]"
                  >
                    <User className="size-4 text-[#6B6B6B]" />
                    Hồ sơ cá nhân
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-[#E5E5E0]/60" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="gap-2 p-2 focus:bg-red-50 cursor-pointer rounded-lg text-[#E94B3C] focus:text-[#E94B3C]"
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
