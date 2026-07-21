"use client";

import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

import { ManagerHeader } from "@/components/manager/layout/manager-header";
import { ManagerSidebar } from "@/components/manager/layout/manager-sidebar";
import { ManagerCommandPalette } from "@/components/manager/command-palette/manager-command-palette";
import { isManagerRole } from "@/lib/auth/roles";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Suspense } from "react";

/** Map pathname prefix to page title shown in header. */
function resolvePageTitle(pathname: string): string {
  if (pathname === "/manager") return "Tổng quan";
  if (pathname.startsWith("/manager/programs")) return "Chương trình";
  if (pathname.startsWith("/manager/courses")) return "Khóa học";
  if (pathname.startsWith("/manager/activities")) return "Hoạt động";
  if (pathname.startsWith("/manager/materials")) return "Tài liệu";
  if (pathname.startsWith("/manager/question-bank")) return "Ngân hàng câu hỏi";
  if (pathname.startsWith("/manager/milestones")) return "Milestone";
  if (pathname.startsWith("/manager/classes")) return "Lớp học";
  if (pathname.startsWith("/manager/sessions")) return "Lịch học";
  if (pathname.startsWith("/manager/attendance")) return "Điểm danh";
  if (pathname.startsWith("/manager/assignments")) return "Bài tập";
  if (pathname.startsWith("/manager/enrollments")) return "Đăng ký học";
  if (pathname.startsWith("/manager/reviews")) return "Đánh giá";
  if (pathname.startsWith("/manager/experts")) return "Chuyên gia";
  if (pathname.startsWith("/manager/mentors")) return "Duyệt Mentor";
  return "Manager";
}

function ManagerShellSkeleton() {
  return (
    <div className="flex h-screen animate-pulse overflow-hidden bg-[#FAFAF5]">
      <div className="w-64 shrink-0 border-r border-[#E5E5E0] bg-[#F5F5F0]" />
      <div className="flex flex-1 flex-col">
        <div className="h-16 shrink-0 border-b border-[#E5E5E0] bg-white" />
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-7xl space-y-4">
            <div className="h-8 w-64 rounded-lg bg-[#E5E5E0]" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-[#E5E5E0]" />
              ))}
            </div>
            <div className="h-64 rounded-xl bg-[#E5E5E0]" />
          </div>
        </main>
      </div>
    </div>
  );
}

export function ManagerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, isAuthenticated, isHydrated, isLoading } = useCurrentUser();
  const [commandOpen, setCommandOpen] = useState(false);

  const openCommand = useCallback(() => setCommandOpen(true), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!isHydrated || isLoading) return;

    // Debug: remove after verifying role from BE
    console.debug("[ManagerShell] guard check", {
      isAuthenticated,
      role: profile?.role,
      isManagerRole: profile ? isManagerRole(profile.role) : "no profile yet",
    });

    if (!isAuthenticated) {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    // Wait until profile is loaded before checking role
    if (profile && !isManagerRole(profile.role)) {
      router.replace("/");
    }
  }, [isAuthenticated, isHydrated, isLoading, profile, pathname, router]);

  // Show skeleton while hydrating, loading, or pending redirect
  if (!isHydrated || isLoading) {
    return <ManagerShellSkeleton />;
  }
  if (!isAuthenticated) {
    return <ManagerShellSkeleton />;
  }
  if (profile && !isManagerRole(profile.role)) {
    return <ManagerShellSkeleton />;
  }

  const pageTitle = resolvePageTitle(pathname);

  return (
    <SidebarProvider className="h-screen overflow-hidden">
      <Suspense fallback={<div className="w-64 shrink-0 border-r border-[#E5E5E0] bg-[#FAFAF5]" />}>
        <ManagerSidebar />
      </Suspense>
      <SidebarInset className="flex flex-1 flex-col overflow-hidden bg-[#FAFAF5]">
        <ManagerHeader title={pageTitle} onOpenCommand={openCommand} />
        <main className="flex-1 overflow-auto bg-[#FAFAF5]">
          {children}
        </main>
      </SidebarInset>
      <ManagerCommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </SidebarProvider>
  );
}
