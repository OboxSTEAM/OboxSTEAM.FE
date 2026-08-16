"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronRight,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getParentChildProgression,
  type ParentBlocker,
  type ParentChildProgression,
  type ParentEnrollmentBrief,
  type ParentProgressEvent,
} from "@/lib/api";
import { isParentRole } from "@/lib/auth/roles";
import { showAppErrorFromUnknown } from "@/lib/errors";
import {
  clampProgressPercent,
  formatParentDate,
  formatParentDateTime,
  getEnrollmentStatusPillClass,
  getParentEnrollmentProgressionHref,
  getParentLinkedDisplayName,
  getParentLinkedInitials,
  getProgramEnrollmentStatusLabel,
  MODULE_TYPE_LABELS,
  PARENT_BLOCKER_FALLBACK_LABELS,
  PARENT_PROGRESS_EVENT_LABELS,
} from "@/lib/parent/progression";
import { PROGRAM_LEVEL_LABELS } from "@/lib/programs/constants";
import { getProgramThumbnailUrl } from "@/lib/programs/format";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";

import { ParentProgressBar } from "./parent-progress-bar";

function ProgressionSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6 px-4 py-10 sm:px-6">
      <div className="h-4 w-32 rounded bg-[#E5E5E0]" />
      <div className="h-24 rounded-2xl bg-[#E5E5E0]" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-20 rounded-xl bg-[#E5E5E0]" />
        <div className="h-20 rounded-xl bg-[#E5E5E0]" />
        <div className="h-20 rounded-xl bg-[#E5E5E0]" />
      </div>
      <div className="h-48 rounded-2xl bg-[#E5E5E0]" />
      <div className="h-40 rounded-2xl bg-[#E5E5E0]" />
    </div>
  );
}

function StatusPill({ status }: { status: ParentEnrollmentBrief["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        getEnrollmentStatusPillClass(status),
      )}
    >
      {getProgramEnrollmentStatusLabel(status)}
    </span>
  );
}

function BlockerList({ blockers }: { blockers: ParentBlocker[] }) {
  if (blockers.length === 0) return null;

  return (
    <ul className="mt-3 space-y-1.5">
      {blockers.map((blocker, index) => (
        <li
          key={`${blocker.code}-${blocker.moduleId ?? index}`}
          className="flex items-start gap-2 rounded-lg border border-[#E94B3C]/20 bg-[#FFF0EE] px-2.5 py-2 text-xs text-[#a82a1e]"
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            {blocker.message?.trim() ||
              PARENT_BLOCKER_FALLBACK_LABELS[blocker.code]}
          </span>
        </li>
      ))}
    </ul>
  );
}

function EnrollmentBriefCard({
  studentId,
  enrollment,
}: {
  studentId: string;
  enrollment: ParentEnrollmentBrief;
}) {
  const href = getParentEnrollmentProgressionHref(
    studentId,
    enrollment.enrollmentId,
  );
  const percent = clampProgressPercent(enrollment.progressPercent);
  const isCompleted = enrollment.status === "Completed";
  const thumbnailUrl = getProgramThumbnailUrl(enrollment.thumbnailUrl);
  const blockers = enrollment.blockers ?? [];
  const levelLabel = enrollment.level
    ? PROGRAM_LEVEL_LABELS[enrollment.level]
    : null;

  return (
    <Card className="overflow-hidden border-[#E5E5E0] bg-white shadow-sm">
      <div className="grid sm:grid-cols-[9rem_1fr]">
        <div className="relative min-h-36 bg-[#F5F5F0] sm:min-h-full">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={enrollment.programName ?? "Chương trình"}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 9rem"
            />
          ) : (
            <div className="flex h-full min-h-36 items-center justify-center text-[#4FC3F7]">
              <BookOpen className="size-8" aria-hidden />
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <CardHeader className="space-y-2 pb-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="font-heading text-lg text-[#2D2D2D]">
                  {enrollment.programName ?? "Chương trình"}
                </CardTitle>
                <CardDescription className="mt-0.5 text-[#6B6B6B]">
                  {[enrollment.programCode, levelLabel]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </CardDescription>
              </div>
              <StatusPill status={enrollment.status} />
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-4 pt-0">
            <div>
              <div className="mb-1.5 flex items-end justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wide text-[#6B6B6B]">
                  Tiến độ
                </p>
                <p className="font-heading text-xl font-extrabold tabular-nums leading-none text-[#2D2D2D]">
                  {percent}
                  <span className="text-sm font-bold text-[#6B6B6B]">%</span>
                </p>
              </div>
              <ParentProgressBar percent={percent} completed={isCompleted} />
            </div>

            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[#6B6B6B]">Module hiện tại</dt>
                <dd className="font-medium text-[#2D2D2D]">
                  {enrollment.currentModule?.moduleName?.trim() || "—"}
                  {enrollment.currentModule ? (
                    <span className="mt-0.5 block text-xs font-normal text-[#6B6B6B]">
                      {MODULE_TYPE_LABELS[enrollment.currentModule.moduleType]}
                      {enrollment.currentModule.progressPercent != null
                        ? ` · ${clampProgressPercent(enrollment.currentModule.progressPercent)}%`
                        : null}
                    </span>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="text-[#6B6B6B]">Hoạt động gần nhất</dt>
                <dd className="font-medium text-[#2D2D2D]">
                  {enrollment.currentActivity?.activityName?.trim() || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[#6B6B6B]">Truy cập gần nhất</dt>
                <dd className="font-medium text-[#2D2D2D]">
                  {formatParentDateTime(enrollment.lastAccessedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-[#6B6B6B]">Đăng ký</dt>
                <dd className="font-medium text-[#2D2D2D]">
                  {formatParentDate(enrollment.enrolledAt)}
                </dd>
              </div>
            </dl>

            <BlockerList blockers={blockers} />

            <div className="mt-auto pt-1">
              <Link
                href={href}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 w-full justify-between rounded-xl border-[#E5E5E0] sm:w-auto sm:min-w-[11rem]",
                )}
              >
                Xem chi tiết
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

function MilestoneRow({ event }: { event: ParentProgressEvent }) {
  return (
    <li className="flex gap-3 border-b border-[#E5E5E0] px-4 py-3 last:border-b-0">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#7CB342]/15 text-[#7CB342]">
        <Calendar className="size-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#2D2D2D]">
          {event.title?.trim() || PARENT_PROGRESS_EVENT_LABELS[event.type]}
        </p>
        {event.subtitle?.trim() ? (
          <p className="mt-0.5 text-xs text-[#6B6B6B]">{event.subtitle}</p>
        ) : null}
        <p className="mt-1 text-xs text-[#6B6B6B]">
          {formatParentDateTime(event.occurredAt)}
        </p>
      </div>
    </li>
  );
}

export function ParentChildProgressionContent() {
  const router = useRouter();
  const params = useParams<{ studentId: string }>();
  const studentId = typeof params.studentId === "string" ? params.studentId : "";
  const { profile, isAuthenticated, isHydrated, isLoading } = useCurrentUser();

  const [data, setData] = useState<ParentChildProgression | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<unknown>(null);

  useEffect(() => {
    if (!isHydrated || isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isHydrated, isLoading, router]);

  useEffect(() => {
    if (!isHydrated || isLoading || !isAuthenticated) return;
    if (profile && !isParentRole(profile.role)) {
      setIsFetching(false);
      return;
    }
    if (!studentId) {
      setIsFetching(false);
      setFetchError(new Error("Missing studentId"));
      return;
    }

    let cancelled = false;

    (async () => {
      setIsFetching(true);
      setFetchError(null);
      try {
        const result = await getParentChildProgression(studentId);
        if (!cancelled) setData(result?.data ?? null);
      } catch (error) {
        if (!cancelled) {
          setFetchError(error);
          setData(null);
          showAppErrorFromUnknown(error, "parent.progression");
        }
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, isLoading, isAuthenticated, profile, studentId]);

  if (!isHydrated || isLoading || !isAuthenticated) {
    return <ProgressionSkeleton />;
  }

  if (profile && !isParentRole(profile.role)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="font-heading text-xl font-semibold text-[#2D2D2D]">
          Trang dành cho phụ huynh
        </p>
        <p className="mt-2 text-sm text-[#6B6B6B]">
          Tài khoản của bạn không có quyền xem tiến độ học viên liên kết.
        </p>
      </div>
    );
  }

  if (isFetching) {
    return <ProgressionSkeleton />;
  }

  if (fetchError || !data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        <Link
          href="/parent/children"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B6B6B] transition-colors hover:text-[#2D2D2D]"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Quay lại danh sách con
        </Link>
        <Card className="mt-6 border-[#E5E5E0] bg-white">
          <CardContent className="py-10 text-center text-sm text-[#6B6B6B]">
            Không tải được tiến độ. Vui lòng thử tải lại trang.
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = getParentLinkedDisplayName(data.student);
  const enrollments = data.enrollments ?? [];
  const milestones = data.recentMilestones ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <Link
        href="/parent/children"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B6B6B] transition-colors hover:text-[#2D2D2D]"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Quay lại danh sách con
      </Link>

      <header className="mt-6 mb-8">
        <p className="text-sm font-medium text-[#E94B3C]">Tiến độ học tập</p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar className="size-16 ring-2 ring-white">
            {data.student.avatarUrl ? (
              <AvatarImage src={data.student.avatarUrl} alt={displayName} />
            ) : null}
            <AvatarFallback className="bg-[#E94B3C]/10 text-lg font-semibold text-[#E94B3C]">
              {getParentLinkedInitials(data.student)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-[#2D2D2D] sm:text-4xl">
              {displayName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {data.student.code ? (
                <span className="text-sm text-[#6B6B6B]">{data.student.code}</span>
              ) : null}
              <Badge
                variant={data.student.isVerified ? "default" : "secondary"}
                className={
                  data.student.isVerified
                    ? "bg-[#7CB342]/15 text-[#3d5c22] hover:bg-[#7CB342]/15"
                    : undefined
                }
              >
                {data.student.isVerified ? "Đã xác thực" : "Chưa xác thực"}
              </Badge>
              <span className="text-xs text-[#6B6B6B]">
                Liên kết {formatParentDate(data.student.linkedAt)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <section className="mb-8 grid gap-3 sm:grid-cols-3">
        <Card className="border-[#E5E5E0] bg-white shadow-sm">
          <CardContent className="pt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B6B6B]">
              Đang học
            </p>
            <p className="mt-1 font-heading text-3xl font-extrabold tabular-nums text-[#2D2D2D]">
              {data.summary.activeEnrollmentCount}
            </p>
          </CardContent>
        </Card>
        <Card className="border-[#E5E5E0] bg-white shadow-sm">
          <CardContent className="pt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B6B6B]">
              Đã hoàn thành
            </p>
            <p className="mt-1 font-heading text-3xl font-extrabold tabular-nums text-[#2D2D2D]">
              {data.summary.completedEnrollmentCount}
            </p>
          </CardContent>
        </Card>
        <Card className="border-[#E5E5E0] bg-white shadow-sm">
          <CardContent className="pt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B6B6B]">
              Truy cập gần nhất
            </p>
            <p className="mt-2 text-sm font-semibold text-[#2D2D2D]">
              {formatParentDateTime(data.summary.lastAccessedAt)}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-bold text-[#2D2D2D]">
            Chương trình học
          </h2>
          <span className="text-sm text-[#6B6B6B]">
            {enrollments.length} chương trình
          </span>
        </div>

        {enrollments.length > 0 ? (
          <div className="space-y-4">
            {enrollments.map((enrollment) => (
              <EnrollmentBriefCard
                key={enrollment.enrollmentId}
                studentId={studentId}
                enrollment={enrollment}
              />
            ))}
          </div>
        ) : (
          <Card className="border-[#E5E5E0] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-lg text-[#2D2D2D]">
                Chưa có chương trình
              </CardTitle>
              <CardDescription className="text-[#6B6B6B]">
                {displayName} chưa ghi danh chương trình nào, hoặc đang chờ
                thanh toán / kích hoạt.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </section>

      <section>
        <h2 className="font-heading mb-4 text-xl font-bold text-[#2D2D2D]">
          Cột mốc gần đây
        </h2>
        {milestones.length > 0 ? (
          <Card className="border-[#E5E5E0] bg-white shadow-sm">
            <ul className="divide-y-0">
              {milestones.map((event, index) => (
                <MilestoneRow
                  key={event.id ?? `${event.type}-${event.occurredAt}-${index}`}
                  event={event}
                />
              ))}
            </ul>
          </Card>
        ) : (
          <Card className="border-dashed border-[#E5E5E0] bg-[#FAFAF5]">
            <CardContent className="flex items-center gap-3 py-6 text-sm text-[#6B6B6B]">
              <ChevronRight className="size-4 shrink-0 text-[#4FC3F7]" aria-hidden />
              Chưa có cột mốc gần đây để hiển thị.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
