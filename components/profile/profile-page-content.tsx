"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isParentRole, isStudentRole } from "@/lib/auth/roles";

import { ProfileAvatarUpload } from "./profile-avatar-upload";
import { ProfileDetails } from "./profile-details";
import { ProfileEditForm } from "./profile-edit-form";
import { StudentParentLinkSection } from "./student-parent-link-section";

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6 px-4 py-10">
      <div className="h-8 w-48 rounded-lg bg-[#E5E5E0]" />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="h-72 rounded-xl bg-[#E5E5E0]" />
        <div className="h-96 rounded-xl bg-[#E5E5E0]" />
      </div>
    </div>
  );
}

export function ProfilePageContent() {
  const router = useRouter();
  const {
    profile,
    isAuthenticated,
    isHydrated,
    isLoading,
    error,
    applyProfileUpdate,
  } = useCurrentUser();

  useEffect(() => {
    if (!isHydrated || isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isHydrated, isLoading, router]);

  if (!isHydrated || isLoading) {
    return <ProfileSkeleton />;
  }

  if (!isAuthenticated) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="font-heading text-xl font-semibold text-[#2D2D2D]">
          Không tải được hồ sơ
        </p>
        <p className="mt-2 text-sm text-[#6B6B6B]">
          Phiên đăng nhập vẫn còn nhưng không lấy được dữ liệu. Thử đăng nhập lại
          hoặc kiểm tra kết nối API.
        </p>
        {error ? (
          <p className="mt-4 text-xs text-[#6B6B6B]">
            {error instanceof Error ? error.message : "Yêu cầu thất bại."}
          </p>
        ) : null}
      </div>
    );
  }

  const isParent = isParentRole(profile.role);
  const isStudent = isStudentRole(profile.role);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <header className="mb-8">
        <p className="text-sm font-medium text-[#E94B3C]">
          {isParent ? "Phụ huynh" : "Tài khoản"}
        </p>
        <h1 className="font-heading mt-1 text-3xl font-bold tracking-tight text-[#2D2D2D] sm:text-4xl">
          Hồ sơ cá nhân
        </h1>
        <p className="mt-2 max-w-2xl text-base text-[#6B6B6B]">
          {isParent
            ? "Quản lý thông tin tài khoản phụ huynh và liên hệ với OboxSTEAM."
            : "Quản lý ảnh đại diện và thông tin liên hệ."}
        </p>
      </header>

      {isStudent ? (
        <div className="mb-6">
          <StudentParentLinkSection />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        <Card className="border-[#E5E5E0] bg-white shadow-sm lg:row-span-2">
          <CardHeader className="border-b border-[#E5E5E0] pb-4">
            <CardTitle className="font-heading text-lg text-[#2D2D2D]">
              Ảnh đại diện
            </CardTitle>
            <CardDescription className="text-[#6B6B6B]">
              {isParent
                ? "Ảnh đại diện hiển thị trên tài khoản phụ huynh của bạn."
                : "Kéo thả ảnh chân dung — dùng cho portfolio và nhận diện lớp học."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ProfileAvatarUpload
              profile={profile}
              onUploaded={applyProfileUpdate}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-[#E5E5E0] bg-white shadow-sm">
            <CardHeader className="border-b border-[#E5E5E0]">
              <CardTitle className="font-heading text-lg text-[#2D2D2D]">
                Chỉnh sửa thông tin
              </CardTitle>
              <CardDescription>Cập nhật họ tên và số điện thoại.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ProfileEditForm profile={profile} onUpdated={applyProfileUpdate} />
            </CardContent>
          </Card>

          <ProfileDetails profile={profile} />
        </div>
      </div>
    </div>
  );
}
