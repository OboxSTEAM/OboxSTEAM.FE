"use client";

import * as React from "react";
import { Suspense, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

import { ExpertHeader } from "@/components/expert/layout/expert-header";
import { ExpertSidebar } from "@/components/expert/layout/expert-sidebar";
import { canAccessExpertArea, getRoleHomePath } from "@/lib/auth/roles";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

/** Map pathname prefix to page title shown in header. */
function resolvePageTitle(pathname: string): string {
  if (pathname === "/expert") return "Chuyên gia";
  if (pathname.startsWith("/expert/reviews")) return "Duyệt chương trình";
  if (pathname.startsWith("/expert/frameworks")) return "Khung chương trình";
  if (pathname.startsWith("/expert/schedule")) return "Lịch đồng hành";
  if (pathname.startsWith("/expert/profile")) return "Hồ sơ chuyên môn";
  return "Expert";
}

function ExpertShellSkeleton() {
  return (
    <div className="flex h-screen animate-pulse overflow-hidden bg-background">
      <div className="w-64 shrink-0 border-r border-border bg-muted" />
      <div className="flex flex-1 flex-col">
        <div className="h-16 shrink-0 border-b border-border bg-card" />
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-7xl space-y-4">
            <div className="h-8 w-64 rounded-lg bg-border" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-border" />
              ))}
            </div>
            <div className="h-64 rounded-xl bg-border" />
          </div>
        </main>
      </div>
    </div>
  );
}

export function ExpertShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, isAuthenticated, isHydrated, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isHydrated || isLoading) return;

    if (!isAuthenticated) {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    // Wait until profile is loaded before checking role. Wrong-role users go
    // to their own home (e.g. manager → /manager), not always landing.
    if (profile && !canAccessExpertArea(profile.role)) {
      router.replace(getRoleHomePath(profile.role));
    }
  }, [isAuthenticated, isHydrated, isLoading, profile, pathname, router]);

  // Show skeleton while hydrating, loading, or pending redirect
  if (!isHydrated || isLoading) {
    return <ExpertShellSkeleton />;
  }
  if (!isAuthenticated) {
    return <ExpertShellSkeleton />;
  }
  if (profile && !canAccessExpertArea(profile.role)) {
    return <ExpertShellSkeleton />;
  }

  const pageTitle = resolvePageTitle(pathname);

  return (
    <SidebarProvider className="h-screen overflow-hidden">
      <Suspense
        fallback={
          <div className="w-64 shrink-0 border-r border-border bg-background" />
        }
      >
        <ExpertSidebar />
      </Suspense>
      <SidebarInset className="flex flex-1 flex-col overflow-hidden bg-background">
        <ExpertHeader title={pageTitle} />
        <main className="flex-1 overflow-auto bg-background">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
