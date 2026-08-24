"use client";

import * as React from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { MentorHeader } from "@/components/mentor/layout/mentor-header";
import { MentorSidebar } from "@/components/mentor/layout/mentor-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getRoleHomePath, isMentorRole } from "@/lib/auth/roles";

function resolvePageTitle(pathname: string): string {
  if (pathname.startsWith("/mentor/classes")) return "Lớp của tôi";
  if (pathname.startsWith("/mentor/schedule")) return "Lịch dạy";
  if (pathname.startsWith("/mentor/board")) return "Đơn đăng ký lớp";
  if (pathname.startsWith("/mentor/requests")) return "Đơn đăng ký lớp";
  if (pathname.startsWith("/mentor/recovery")) return "Yêu cầu làm lại";
  if (pathname.startsWith("/mentor/profile")) return "Hồ sơ";
  return "Mentor";
}

function MentorShellSkeleton() {
  return (
    <div className="flex h-screen animate-pulse overflow-hidden bg-background">
      <div className="w-64 shrink-0 border-r border-border bg-muted" />
      <div className="flex flex-1 flex-col">
        <div className="h-16 shrink-0 border-b border-border bg-card" />
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-7xl space-y-4">
            <div className="h-8 w-64 rounded-lg bg-muted" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="h-48 rounded-xl bg-muted" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function MentorShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, isAuthenticated, isHydrated, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isHydrated || isLoading) return;

    if (!isAuthenticated) {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    if (profile && !isMentorRole(profile.role)) {
      router.replace(getRoleHomePath(profile.role));
    }
  }, [isAuthenticated, isHydrated, isLoading, profile, pathname, router]);

  if (!isHydrated || isLoading) {
    return <MentorShellSkeleton />;
  }
  if (!isAuthenticated) {
    return <MentorShellSkeleton />;
  }
  if (profile && !isMentorRole(profile.role)) {
    return <MentorShellSkeleton />;
  }

  return (
    <SidebarProvider className="h-screen overflow-hidden">
      <MentorSidebar />
      <SidebarInset className="flex flex-1 flex-col overflow-hidden bg-background">
        <MentorHeader title={resolvePageTitle(pathname)} />
        <main className="flex-1 overflow-auto bg-background">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
