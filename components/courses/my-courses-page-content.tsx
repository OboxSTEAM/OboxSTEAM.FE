"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";

import { ProgramPagination } from "@/components/programs/program-pagination";
import {
  LIGHT_SELECT_CONTENT,
  LIGHT_SELECT_ITEM,
  LIGHT_SELECT_TRIGGER,
} from "@/components/programs/program-select-styles";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { CertificateCongratsBox } from "@/components/certificates/certificate-congrats-box";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getMyCertificates } from "@/lib/api/certificates";
import type { CertificateListItem } from "@/lib/api/entities/certificate";
import {
  getMyProgramEnrollments,
  type MyProgramEnrollmentsQuery,
} from "@/lib/api/program-enrollments";
import { isParentRole, isStudentRole } from "@/lib/auth/roles";
import { showAppErrorFromUnknown } from "@/lib/errors";
import {
  DEFAULT_MY_ENROLLMENTS_QUERY,
  getMyEnrollmentsSortOptionId,
  MY_ENROLLMENTS_SORT_OPTIONS,
} from "@/lib/programs/enrollments";
import { cn } from "@/lib/utils";

import { EnrollmentCard } from "./enrollment-card";
import { EnrollmentGridSkeleton } from "./enrollment-grid-skeleton";

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="mb-8 animate-pulse space-y-3">
        <div className="h-4 w-24 rounded bg-[#E5E5E0]" />
        <div className="h-10 w-72 max-w-full rounded-lg bg-[#E5E5E0]" />
        <div className="h-5 w-96 max-w-full rounded bg-[#E5E5E0]" />
      </div>
      <EnrollmentGridSkeleton />
    </div>
  );
}

function getSortLabel(sortId: string): string {
  return (
    MY_ENROLLMENTS_SORT_OPTIONS.find((option) => option.id === sortId)?.label ??
    "Sắp xếp"
  );
}

export function MyCoursesPageContent() {
  const router = useRouter();
  const { profile, isAuthenticated, isHydrated, isLoading } = useCurrentUser();
  const [query, setQuery] = useState<MyProgramEnrollmentsQuery>(
    DEFAULT_MY_ENROLLMENTS_QUERY,
  );

  useEffect(() => {
    if (!isHydrated || isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login?returnUrl=%2Fcourses");
    }
  }, [isAuthenticated, isHydrated, isLoading, router]);

  const canFetch =
    isHydrated &&
    !isLoading &&
    isAuthenticated &&
    profile != null &&
    isStudentRole(profile.role);

  const { data, isLoading: isFetching, hasError, markLoading, retry } =
    useClientFetch({
      enabled: canFetch,
      fetcher: async () => {
        const result = await getMyProgramEnrollments(query);
        return result?.data ?? null;
      },
      deps: [query, canFetch],
      onError: (error) => showAppErrorFromUnknown(error, "enrollments.list"),
    });

  const { data: certificates } = useClientFetch({
    enabled: canFetch,
    fetcher: async () => {
      try {
        const result = await getMyCertificates();
        return result?.data ?? [];
      } catch {
        // Degrade silently — enrollment list should still render.
        return [];
      }
    },
    deps: [canFetch],
  });

  const certificatesByProgramId = new Map<string, CertificateListItem>();
  for (const certificate of certificates ?? []) {
    if (!certificatesByProgramId.has(certificate.programId)) {
      certificatesByProgramId.set(certificate.programId, certificate);
    }
  }

  const handleSortChange = useCallback(
    (sortId: string | null) => {
      if (!sortId) return;

      const option = MY_ENROLLMENTS_SORT_OPTIONS.find(
        (item) => item.id === sortId,
      );
      if (!option) return;

      markLoading();
      setQuery({
        ...DEFAULT_MY_ENROLLMENTS_QUERY,
        sortBy: option.sortBy,
        isDescending: option.isDescending,
      });
    },
    [markLoading],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      markLoading();
      setQuery((current) => ({
        ...current,
        page,
      }));
    },
    [markLoading],
  );

  if (!isHydrated || isLoading) {
    return <PageSkeleton />;
  }

  if (!isAuthenticated) {
    return <PageSkeleton />;
  }

  if (profile && isParentRole(profile.role)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="font-heading text-xl font-semibold text-[#2D2D2D]">
          Trang dành cho học viên
        </p>
        <p className="mt-2 text-sm text-[#6B6B6B]">
          Phụ huynh có thể theo dõi con tại mục Thông tin con.
        </p>
        <Button
          type="button"
          className="mt-6"
          onClick={() => router.push("/parent/children")}
        >
          Đi tới Thông tin con
        </Button>
      </div>
    );
  }

  if (profile && !isStudentRole(profile.role)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="font-heading text-xl font-semibold text-[#2D2D2D]">
          Không có quyền truy cập
        </p>
        <p className="mt-2 text-sm text-[#6B6B6B]">
          Tài khoản này không thể xem danh sách khóa học học viên.
        </p>
      </div>
    );
  }

  const enrollments = data?.items ?? [];
  const sortId = getMyEnrollmentsSortOptionId(query);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <header className="mb-8">
        <p className="text-sm font-medium text-[#E94B3C]">Tài khoản</p>
        <h1 className="font-heading mt-1 text-3xl font-bold tracking-tight text-[#2D2D2D] sm:text-4xl">
          Khóa học của tôi
        </h1>
        <p className="mt-2 max-w-2xl text-base text-[#6B6B6B]">
          Các chương trình bạn đã đăng ký, tiến độ học và trạng thái thanh toán.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#6B6B6B]">
          {data
            ? `${data.totalCount.toLocaleString("vi-VN")} chương trình`
            : "Đang tải…"}
        </p>

        <Select value={sortId} onValueChange={handleSortChange}>
          <SelectTrigger className={LIGHT_SELECT_TRIGGER} size="default">
            <span className="truncate">{getSortLabel(sortId)}</span>
          </SelectTrigger>
          <SelectContent
            className={LIGHT_SELECT_CONTENT}
            alignItemWithTrigger={false}
            sideOffset={8}
            align="end"
          >
            {MY_ENROLLMENTS_SORT_OPTIONS.map((option) => (
              <SelectItem
                key={option.id}
                value={option.id}
                className={LIGHT_SELECT_ITEM}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isFetching ? (
        <EnrollmentGridSkeleton />
      ) : hasError ? (
        <Card className="border-[#E5E5E0] bg-white">
          <CardHeader className="text-center">
            <CardTitle className="font-heading text-lg text-[#2D2D2D]">
              Không tải được danh sách
            </CardTitle>
            <CardDescription className="text-[#6B6B6B]">
              Vui lòng thử lại sau vài giây.
            </CardDescription>
            <Button type="button" className="mx-auto mt-4 w-fit" onClick={retry}>
              Thử lại
            </Button>
          </CardHeader>
        </Card>
      ) : enrollments.length === 0 ? (
        <Card className="border-[#E5E5E0] bg-white shadow-sm">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex size-14 items-center justify-center rounded-2xl bg-[#4FC3F7]/15 text-[#4FC3F7]">
              <BookOpen className="size-7" aria-hidden />
            </div>
            <CardTitle className="font-heading text-xl text-[#2D2D2D]">
              Chưa có khóa học nào
            </CardTitle>
            <CardDescription className="max-w-md text-[#6B6B6B]">
              Khám phá chương trình STEAM trên trang chủ và đăng ký để bắt đầu
              hành trình học tập.
            </CardDescription>
            <Link
              href="/#programs"
              className={cn(buttonVariants(), "mt-4")}
            >
              Xem chương trình
            </Link>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment) => {
              const certificate = certificatesByProgramId.get(
                enrollment.programId,
              );

              if (!certificate) {
                return (
                  <EnrollmentCard
                    key={enrollment.id}
                    enrollment={enrollment}
                  />
                );
              }

              return (
                <div
                  key={enrollment.id}
                  className="flex flex-col self-start overflow-hidden rounded-2xl border border-[#E5E5E0] bg-white shadow-[0_2px_16px_rgba(45,45,45,0.05)] transition-shadow hover:shadow-[0_8px_24px_rgba(45,45,45,0.1)]"
                >
                  <EnrollmentCard
                    enrollment={enrollment}
                    className="h-auto rounded-none border-0 shadow-none"
                  />
                  <CertificateCongratsBox certificate={certificate} />
                </div>
              );
            })}
          </div>

          {data ? (
            <ProgramPagination
              currentPage={data.currentPage}
              totalPages={data.totalPages}
              hasPrevious={data.hasPrevious}
              hasNext={data.hasNext}
              onPageChange={handlePageChange}
              theme="light"
            />
          ) : null}
        </>
      )}
    </div>
  );
}
