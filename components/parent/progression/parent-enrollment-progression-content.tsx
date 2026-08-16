"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Lock,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getParentEnrollmentProgression,
  type ParentAssignmentOutcome,
  type ParentEnrollmentProgression,
  type ParentModuleProgress,
} from "@/lib/api";
import { isParentRole } from "@/lib/auth/roles";
import { showAppErrorFromUnknown } from "@/lib/errors";
import {
  clampProgressPercent,
  formatParentDate,
  formatParentDateTime,
  getAssignmentStatusLabel,
  getEnrollmentStatusPillClass,
  getOutcomeLabelClass,
  getParentChildProgressionHref,
  getProgramEnrollmentStatusLabel,
  MODULE_ENROLLMENT_STATUS_LABELS,
  MODULE_TYPE_LABELS,
  PARENT_MODULE_OUTCOME_LABELS,
} from "@/lib/parent/progression";
import { getProgramThumbnailUrl } from "@/lib/programs/format";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";

import { ParentProgressBar } from "./parent-progress-bar";

function DrillDownSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6 px-4 py-10 sm:px-6">
      <div className="h-4 w-40 rounded bg-[#E5E5E0]" />
      <div className="h-36 rounded-2xl bg-[#E5E5E0]" />
      <div className="h-28 rounded-2xl bg-[#E5E5E0]" />
      <div className="h-40 rounded-2xl bg-[#E5E5E0]" />
      <div className="h-40 rounded-2xl bg-[#E5E5E0]" />
    </div>
  );
}

function AssignmentRow({ assignment }: { assignment: ParentAssignmentOutcome }) {
  const statusLabel = getAssignmentStatusLabel(assignment.status);
  const scoreText =
    assignment.score != null && assignment.maxPoints != null
      ? `${assignment.score}/${assignment.maxPoints}`
      : assignment.score != null
        ? String(assignment.score)
        : null;

  return (
    <li className="rounded-xl border border-[#E5E5E0] bg-[#FAFAF5]/80 px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#2D2D2D]">
            {assignment.title?.trim() || "Bài tập"}
          </p>
          <p className="mt-0.5 text-xs text-[#6B6B6B]">
            {assignment.assignmentType}
            {assignment.isRequiredForModulePass ? " · Bắt buộc" : null}
            {assignment.dueDate
              ? ` · Hạn ${formatParentDate(assignment.dueDate)}`
              : null}
          </p>
        </div>
        <Badge
          variant="secondary"
          className="h-6 shrink-0 bg-white text-[11px] text-[#2D2D2D]"
        >
          {statusLabel}
        </Badge>
      </div>
      <dl className="mt-2 grid gap-1 text-xs text-[#6B6B6B] sm:grid-cols-3">
        <div>
          <dt className="inline">Điểm: </dt>
          <dd className="inline font-medium text-[#2D2D2D]">
            {scoreText ?? "—"}
            {assignment.passed == null
              ? null
              : assignment.passed
                ? " · Đạt"
                : " · Chưa đạt"}
          </dd>
        </div>
        <div>
          <dt className="inline">Lượt làm: </dt>
          <dd className="inline font-medium text-[#2D2D2D]">
            {assignment.attemptUsed != null && assignment.maxAttempts != null
              ? `${assignment.attemptUsed}/${assignment.maxAttempts}`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="inline">Nộp / chấm: </dt>
          <dd className="inline font-medium text-[#2D2D2D]">
            {assignment.submittedAt
              ? formatParentDate(assignment.submittedAt)
              : "—"}
            {assignment.gradedAt
              ? ` · ${formatParentDate(assignment.gradedAt)}`
              : null}
          </dd>
        </div>
      </dl>
    </li>
  );
}

function ModuleTimelineCard({ module }: { module: ParentModuleProgress }) {
  const percent = clampProgressPercent(module.progressPercent);
  const isCompleted = module.status === "Completed";
  const assignments = module.assignments ?? [];
  const outcome = module.outcomeLabel;

  return (
    <Card
      className={cn(
        "border-[#E5E5E0] bg-white shadow-sm",
        module.isLocked && "opacity-90",
      )}
    >
      <CardHeader className="border-b border-[#E5E5E0] pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#6B6B6B]">
                Module {module.moduleOrder}
              </span>
              <Badge
                variant="secondary"
                className="h-5 bg-[#F5F5F0] px-1.5 text-[10px] text-[#6B6B6B]"
              >
                {MODULE_TYPE_LABELS[module.moduleType]}
              </Badge>
              {module.isLocked ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#8A7200]">
                  <Lock className="size-3.5" aria-hidden />
                  Đang khóa
                </span>
              ) : null}
            </div>
            <CardTitle className="font-heading mt-1 text-lg text-[#2D2D2D]">
              {module.moduleName?.trim() || "Module"}
            </CardTitle>
            <CardDescription className="mt-1 text-[#6B6B6B]">
              {module.status
                ? MODULE_ENROLLMENT_STATUS_LABELS[module.status]
                : "Chưa bắt đầu"}
              {module.attemptNumber != null
                ? ` · Lần thử ${module.attemptNumber}`
                : null}
              {module.finalGrade != null
                ? ` · Điểm ${module.finalGrade}`
                : null}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="font-heading text-2xl font-extrabold tabular-nums text-[#2D2D2D]">
              {percent}
              <span className="text-sm font-bold text-[#6B6B6B]">%</span>
            </p>
            {outcome ? (
              <p
                className={cn(
                  "mt-1 text-sm font-semibold",
                  getOutcomeLabelClass(outcome),
                )}
              >
                {PARENT_MODULE_OUTCOME_LABELS[outcome]}
              </p>
            ) : null}
          </div>
        </div>
        <ParentProgressBar
          percent={percent}
          completed={isCompleted}
          className="mt-3"
        />
        {module.isLocked && module.lockReason?.trim() ? (
          <p className="mt-3 rounded-lg border border-[#FDD835]/40 bg-[#FFF8E1] px-3 py-2 text-xs text-[#8A7200]">
            {module.lockReason}
          </p>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
          <div className="flex flex-wrap gap-4 text-sm">
          <p className="text-[#6B6B6B]">
            Hoạt động:{" "}
            <span className="font-semibold text-[#2D2D2D]">
              {module.activityStats
                ? `${module.activityStats.completed}/${module.activityStats.total}`
                : "—"}
            </span>
          </p>
          <p className="text-[#6B6B6B]">
            Bắt đầu:{" "}
            <span className="font-semibold text-[#2D2D2D]">
              {formatParentDate(module.startedAt)}
            </span>
          </p>
          <p className="text-[#6B6B6B]">
            Hoàn thành:{" "}
            <span className="font-semibold text-[#2D2D2D]">
              {formatParentDate(module.completedAt)}
            </span>
          </p>
        </div>

        {assignments.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B6B6B]">
              Bài tập / đánh giá
            </p>
            <ul className="space-y-2">
              {assignments.map((assignment) => (
                <AssignmentRow
                  key={assignment.assignmentId}
                  assignment={assignment}
                />
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-[#6B6B6B]">
            Chưa có bài tập trong module này.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function ParentEnrollmentProgressionContent() {
  const router = useRouter();
  const params = useParams<{ studentId: string; enrollmentId: string }>();
  const studentId = typeof params.studentId === "string" ? params.studentId : "";
  const enrollmentId =
    typeof params.enrollmentId === "string" ? params.enrollmentId : "";
  const { profile, isAuthenticated, isHydrated, isLoading } = useCurrentUser();

  const [data, setData] = useState<ParentEnrollmentProgression | null>(null);
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
    if (!studentId || !enrollmentId) {
      setIsFetching(false);
      setFetchError(new Error("Missing path params"));
      return;
    }

    let cancelled = false;

    (async () => {
      setIsFetching(true);
      setFetchError(null);
      try {
        const result = await getParentEnrollmentProgression(
          studentId,
          enrollmentId,
        );
        if (!cancelled) setData(result?.data ?? null);
      } catch (error) {
        if (!cancelled) {
          setFetchError(error);
          setData(null);
          showAppErrorFromUnknown(error, "parent.enrollment-progression");
        }
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isHydrated,
    isLoading,
    isAuthenticated,
    profile,
    studentId,
    enrollmentId,
  ]);

  if (!isHydrated || isLoading || !isAuthenticated) {
    return <DrillDownSkeleton />;
  }

  if (profile && !isParentRole(profile.role)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="font-heading text-xl font-semibold text-[#2D2D2D]">
          Trang dành cho phụ huynh
        </p>
        <p className="mt-2 text-sm text-[#6B6B6B]">
          Tài khoản của bạn không có quyền xem chi tiết chương trình.
        </p>
      </div>
    );
  }

  if (isFetching) {
    return <DrillDownSkeleton />;
  }

  const backHref = studentId
    ? getParentChildProgressionHref(studentId)
    : "/parent/children";

  if (fetchError || !data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B6B6B] transition-colors hover:text-[#2D2D2D]"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Quay lại tiến độ học viên
        </Link>
        <Card className="mt-6 border-[#E5E5E0] bg-white">
          <CardContent className="py-10 text-center text-sm text-[#6B6B6B]">
            Không tải được chi tiết chương trình. Vui lòng thử tải lại trang.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { enrollment, classInfo } = data;
  const modules = data.modules ?? [];
  const percent = clampProgressPercent(enrollment.progressPercent);
  const isCompleted = enrollment.status === "Completed";
  const thumbnailUrl = getProgramThumbnailUrl(enrollment.thumbnailUrl);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B6B6B] transition-colors hover:text-[#2D2D2D]"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Quay lại tiến độ học viên
      </Link>

      <Card className="mt-6 overflow-hidden border-[#E5E5E0] bg-white shadow-sm">
        <div className="grid sm:grid-cols-[12rem_1fr]">
          <div className="relative min-h-40 bg-[#F5F5F0] sm:min-h-full">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={enrollment.programName ?? "Chương trình"}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 12rem"
                priority
              />
            ) : (
              <div className="flex h-full min-h-40 items-center justify-center text-[#4FC3F7]">
                <BookOpen className="size-10" aria-hidden />
              </div>
            )}
          </div>
          <div className="p-5 sm:p-6">
            <p className="text-sm font-medium text-[#E94B3C]">
              Chi tiết chương trình
            </p>
            <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="font-heading text-2xl font-bold tracking-tight text-[#2D2D2D] sm:text-3xl">
                  {enrollment.programName ?? "Chương trình"}
                </h1>
                {enrollment.programCode ? (
                  <p className="mt-1 text-sm text-[#6B6B6B]">
                    {enrollment.programCode}
                  </p>
                ) : null}
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                  getEnrollmentStatusPillClass(enrollment.status),
                )}
              >
                {getProgramEnrollmentStatusLabel(enrollment.status)}
              </span>
            </div>

            <div className="mt-5">
              <div className="mb-1.5 flex items-end justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wide text-[#6B6B6B]">
                  Tiến độ tổng
                </p>
                <p className="font-heading text-2xl font-extrabold tabular-nums leading-none text-[#2D2D2D]">
                  {percent}
                  <span className="text-sm font-bold text-[#6B6B6B]">%</span>
                </p>
              </div>
              <ParentProgressBar percent={percent} completed={isCompleted} />
            </div>

            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-[#6B6B6B]">Đăng ký</dt>
                <dd className="font-medium text-[#2D2D2D]">
                  {formatParentDate(enrollment.enrolledAt)}
                </dd>
              </div>
              <div>
                <dt className="text-[#6B6B6B]">Bắt đầu</dt>
                <dd className="font-medium text-[#2D2D2D]">
                  {formatParentDate(enrollment.startedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-[#6B6B6B]">Truy cập gần nhất</dt>
                <dd className="font-medium text-[#2D2D2D]">
                  {formatParentDateTime(enrollment.lastAccessedAt)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </Card>

      {classInfo ? (
        <Card className="mt-4 border-[#E5E5E0] bg-white shadow-sm">
          <CardContent className="flex items-start gap-3 py-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#7E57C2]/12 text-[#7E57C2]">
              <Users className="size-5" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#2D2D2D]">
                {classInfo.className?.trim() || "Lớp học"}
              </p>
              <p className="mt-0.5 text-sm text-[#6B6B6B]">
                Mentor: {classInfo.mentorName?.trim() || "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <section className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle2 className="size-5 text-[#7CB342]" aria-hidden />
          <h2 className="font-heading text-xl font-bold text-[#2D2D2D]">
            Lộ trình module
          </h2>
          <span className="text-sm text-[#6B6B6B]">
            {modules.length} module
          </span>
        </div>

        {modules.length > 0 ? (
          <div className="space-y-4">
            {modules.map((module) => (
              <ModuleTimelineCard key={module.moduleId} module={module} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-[#E5E5E0] bg-[#FAFAF5]">
            <CardContent className="py-8 text-center text-sm text-[#6B6B6B]">
              Chưa có dữ liệu module cho chương trình này.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
