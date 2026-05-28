import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UserProfile } from "@/lib/api/entities/user";
import { cn } from "@/lib/utils";

type ProfileDetailsProps = {
  profile: UserProfile;
};

function DetailRow({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 border-b border-[#E5E5E0] py-3.5 last:border-0 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <dt className="text-sm font-medium text-[#6B6B6B]">{label}</dt>
      <dd className="text-sm font-medium text-[#2D2D2D] sm:text-right">{value}</dd>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function ProfileDetails({ profile }: ProfileDetailsProps) {
  return (
    <Card className="border-[#E5E5E0] bg-white shadow-sm">
      <CardHeader className="border-b border-[#E5E5E0]">
        <CardTitle className="font-heading text-xl text-[#2D2D2D]">
          Thông tin tài khoản
        </CardTitle>
        <CardDescription>
          Các trường dưới đây do hệ thống quản lý; liên hệ hỗ trợ nếu cần chỉnh sửa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl>
          <DetailRow label="Mã học viên" value={profile.code} />
          <DetailRow label="Email" value={profile.email} />
          <DetailRow label="Vai trò" value={profile.role} />
          <DetailRow
            label="Trạng thái"
            value={
              <Badge
                variant={profile.status === "Active" ? "default" : "secondary"}
                className={
                  profile.status === "Active"
                    ? "bg-[#7CB342]/15 text-[#4a7c23]"
                    : undefined
                }
              >
                {profile.status}
              </Badge>
            }
          />
          <DetailRow
            label="Xác thực email"
            value={
              profile.isEmailVerified ? (
                <span className="text-[#4a7c23]">Đã xác thực</span>
              ) : (
                <span className="text-[#E94B3C]">Chưa xác thực</span>
              )
            }
          />
          <DetailRow label="Ngày tạo tài khoản" value={formatDate(profile.createdAt)} />
        </dl>
      </CardContent>
    </Card>
  );
}
