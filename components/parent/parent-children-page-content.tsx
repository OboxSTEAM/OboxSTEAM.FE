"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getParentLinks, type ParentLinkedStudent } from "@/lib/api";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { useCurrentUser } from "@/hooks/use-current-user";

function getDisplayName(account: ParentLinkedStudent): string {
  if (account.fullName?.trim()) return account.fullName.trim();
  return account.email.split("@")[0] ?? "HV";
}

function getInitials(account: ParentLinkedStudent): string {
  const name = getDisplayName(account);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatLinkedDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function LinkedStudentCard({ student }: { student: ParentLinkedStudent }) {
  return (
    <Card className="flex flex-col border-[#E5E5E0] bg-white shadow-sm">
      <CardHeader className="flex flex-row items-start gap-4 border-b border-[#E5E5E0] pb-4">
        <Avatar className="size-14 ring-2 ring-[#FAFAF5]">
          {student.avatarUrl ? (
            <AvatarImage src={student.avatarUrl} alt={getDisplayName(student)} />
          ) : null}
          <AvatarFallback className="bg-[#E94B3C]/10 text-base font-semibold text-[#E94B3C]">
            {getInitials(student)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <CardTitle className="font-heading text-lg text-[#2D2D2D]">
            {getDisplayName(student)}
          </CardTitle>
          <CardDescription className="mt-0.5 text-[#6B6B6B]">
            {student.code}
          </CardDescription>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge
              variant={student.isVerified ? "default" : "secondary"}
              className={
                student.isVerified
                  ? "bg-[#7CB342]/15 text-[#3d5c22] hover:bg-[#7CB342]/15"
                  : undefined
              }
            >
              {student.isVerified ? "Đã xác thực" : "Chưa xác thực"}
            </Badge>
            <span className="text-xs text-[#6B6B6B]">
              Liên kết {formatLinkedDate(student.createdAt)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 pt-4">
        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="text-[#6B6B6B]">Email</dt>
            <dd className="font-medium text-[#2D2D2D]">{student.email}</dd>
          </div>
          <div>
            <dt className="text-[#6B6B6B]">Số điện thoại</dt>
            <dd className="font-medium text-[#2D2D2D]">{student.phone}</dd>
          </div>
        </dl>

        <div className="mt-auto rounded-xl border border-dashed border-[#E5E5E0] bg-[#FAFAF5] p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#4FC3F7]/15 text-[#4FC3F7]">
              <BookOpen className="size-5" aria-hidden />
            </div>
            <div>
              <p className="font-heading text-sm font-semibold text-[#2D2D2D]">
                Chương trình học — sắp ra mắt
              </p>
              <p className="mt-1 text-sm text-[#6B6B6B]">
                Thông tin khóa học và tiến độ của {getDisplayName(student)} sẽ hiển thị tại
                đây.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChildrenSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6 px-4 py-10">
      <div className="h-8 w-56 rounded-lg bg-[#E5E5E0]" />
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="h-80 rounded-xl bg-[#E5E5E0]" />
        <div className="h-80 rounded-xl bg-[#E5E5E0]" />
      </div>
    </div>
  );
}

export function ParentChildrenPageContent() {
  const router = useRouter();
  const { profile, isAuthenticated, isHydrated, isLoading } = useCurrentUser();
  const [links, setLinks] = useState<ParentLinkedStudent[] | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<unknown>(null);

  useEffect(() => {
    if (!isHydrated || isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isHydrated, isLoading, router]);

  useEffect(() => {
    if (!isHydrated || isLoading || !isAuthenticated || profile?.role !== "Parent") {
      return;
    }

    let cancelled = false;

    (async () => {
      setIsFetching(true);
      setFetchError(null);
      try {
        const result = await getParentLinks();
        if (!cancelled) setLinks(result?.data ?? []);
      } catch (error) {
        if (!cancelled) {
          setFetchError(error);
          showAppErrorFromUnknown(error, "parent.links");
        }
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, isLoading, isAuthenticated, profile?.role]);

  if (!isHydrated || isLoading) {
    return <ChildrenSkeleton />;
  }

  if (!isAuthenticated) {
    return <ChildrenSkeleton />;
  }

  if (profile && profile.role !== "Parent") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="font-heading text-xl font-semibold text-[#2D2D2D]">
          Trang dành cho phụ huynh
        </p>
        <p className="mt-2 text-sm text-[#6B6B6B]">
          Tài khoản của bạn không có quyền xem thông tin học viên liên kết.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <header className="mb-8">
        <p className="text-sm font-medium text-[#E94B3C]">Phụ huynh</p>
        <h1 className="font-heading mt-1 text-3xl font-bold tracking-tight text-[#2D2D2D] sm:text-4xl">
          Thông tin con
        </h1>
        <p className="mt-2 max-w-2xl text-base text-[#6B6B6B]">
          Danh sách học viên đã liên kết với tài khoản phụ huynh của bạn.
        </p>
      </header>

      {isFetching ? (
        <ChildrenSkeleton />
      ) : fetchError ? (
        <Card className="border-[#E5E5E0] bg-white">
          <CardContent className="py-10 text-center text-sm text-[#6B6B6B]">
            Không tải được danh sách. Vui lòng thử tải lại trang.
          </CardContent>
        </Card>
      ) : links && links.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {links.map((student) => (
            <LinkedStudentCard key={student.linkedUserId} student={student} />
          ))}
        </div>
      ) : (
        <Card className="border-[#E5E5E0] bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-[#2D2D2D]">
              Chưa có học viên liên kết
            </CardTitle>
            <CardDescription className="text-[#6B6B6B]">
              Học viên cần gửi yêu cầu liên kết từ trang hồ sơ (nhập email phụ
              huynh). Sau khi bạn xác nhận qua email, học viên sẽ xuất hiện tại đây.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
