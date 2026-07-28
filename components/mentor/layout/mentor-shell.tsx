"use client";

import * as React from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { MentorHeader } from "@/components/mentor/layout/mentor-header";
import { MentorSidebar } from "@/components/mentor/layout/mentor-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isMentorRole } from "@/lib/auth/roles";

function resolvePageTitle(pathname: string): string {
  if (pathname.startsWith("/mentor/requests")) return "Yêu cầu của tôi";
  if (pathname.startsWith("/mentor/board")) return "Bảng lớp";
  return "Mentor";
}

function MentorShellSkeleton() {
  return (
    <div className="flex h-screen animate-pulse overflow-hidden bg-[#FAFAF5]">
      <div className="w-64 shrink-0 border-r border-[#E5E5E0] bg-[#F5F5F0]" />
      <div className="flex flex-1 flex-col">
        <div className="h-16 shrink-0 border-b border-[#E5E5E0] bg-white" />
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-7xl space-y-4">
            <div className="h-8 w-64 rounded-lg bg-[#E5E5E0]" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="h-48 rounded-xl bg-[#E5E5E0]" />
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
      router.replace("/");
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
      <SidebarInset className="flex flex-1 flex-col overflow-hidden bg-[#FAFAF5]">
        <MentorHeader title={resolvePageTitle(pathname)} />
        <main className="flex-1 overflow-auto bg-[#FAFAF5]">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
