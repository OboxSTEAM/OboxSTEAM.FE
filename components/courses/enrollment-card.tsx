"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

import { ImageSlot } from "@/components/common/image-slot";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProgramEnrollment } from "@/lib/api/program-enrollments";
import {
  getProgramPriceParts,
  PROGRAM_LEVEL_LABELS,
} from "@/lib/programs/constants";
import { PROGRAM_ENROLLMENT_STATUS_LABELS } from "@/lib/programs/enrollments";
import { cn } from "@/lib/utils";

type EnrollmentCardProps = {
  enrollment: ProgramEnrollment;
  className?: string;
};

function formatEnrollmentDate(iso: string): string {
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

function getStatusPillClass(status: ProgramEnrollment["status"]): string {
  switch (status) {
    case "Active":
      return "border-[#7CB342]/40 bg-[#7CB342]/18 text-[#2d5016]";
    case "PendingPayment":
      return "border-[#E94B3C]/35 bg-[#FFF0EE] text-[#B71C1C]";
    case "Completed":
      return "border-[#4FC3F7]/45 bg-[#E8F7FD] text-[#1565c0]";
    case "Cancelled":
      return "border-[#D4D4CF] bg-[#F5F5F0] text-[#6B6B6B]";
    default:
      return "border-[#E5E5E0] bg-white text-[#2D2D2D]";
  }
}

function EnrollmentStatusPill({
  status,
}: {
  status: ProgramEnrollment["status"];
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide shadow-sm",
        getStatusPillClass(status),
      )}
    >
      {PROGRAM_ENROLLMENT_STATUS_LABELS[status]}
    </span>
  );
}

export function EnrollmentCard({ enrollment, className }: EnrollmentCardProps) {
  const priceParts = getProgramPriceParts(enrollment.price);
  const isPendingPayment = enrollment.status === "PendingPayment";
  const detailHref = `/programs/${enrollment.programId}`;
  const continueHref = detailHref;

  return (
    <Card
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border-[#E5E5E0] bg-white shadow-[0_2px_16px_rgba(45,45,45,0.05)] transition-shadow hover:shadow-[0_8px_24px_rgba(45,45,45,0.1)]",
        className,
      )}
    >
      <div className="p-3 pb-0">
        <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-[#E5E5E0] bg-[#F5F5F0]">
          {enrollment.thumbnailUrl ? (
            <Image
              src={enrollment.thumbnailUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <ImageSlot
              ratio="16:9"
              alt={enrollment.name}
              tone="neutral"
              className="absolute inset-0 rounded-none"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          )}
        </div>
      </div>

      <CardHeader className="gap-3 pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardDescription className="min-w-0 text-xs font-medium uppercase tracking-wide text-[#6B6B6B]">
            {enrollment.seriesName}
          </CardDescription>
          <EnrollmentStatusPill status={enrollment.status} />
        </div>
        <CardTitle className="font-heading line-clamp-2 text-lg leading-snug text-[#2D2D2D]">
          {enrollment.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 pb-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6B6B]">
          <span className="rounded-full border border-[#E5E5E0] bg-[#FAFAF5] px-2.5 py-1 font-medium text-[#2D2D2D]">
            {PROGRAM_LEVEL_LABELS[enrollment.level]}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5 shrink-0" aria-hidden />
            {enrollment.estimatedDuration}
          </span>
        </div>

        {enrollment.status === "Active" || enrollment.status === "Completed" ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#6B6B6B]">Tiến độ học</span>
              <span className="font-semibold tabular-nums text-[#2D2D2D]">
                {enrollment.progressPercent}%
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-[#E5E5E0]"
              aria-hidden
            >
              <div
                className="h-full rounded-full bg-[#4FC3F7] transition-[width] duration-300"
                style={{ width: `${enrollment.progressPercent}%` }}
              />
            </div>
          </div>
        ) : null}

        <p className="text-xs text-[#6B6B6B]">
          Đăng ký {formatEnrollmentDate(enrollment.enrolledAt)}
          {!priceParts.isFree ? (
            <>
              {" "}
              ·{" "}
              <span className="font-semibold text-[#E94B3C]">
                {priceParts.amount} {priceParts.unit}
              </span>
            </>
          ) : null}
        </p>
      </CardContent>

      <CardFooter className="mt-auto flex flex-wrap gap-2 border-t border-[#E5E5E0] px-6 pt-4 pb-6">
        <Link
          href={detailHref}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "border-[#E5E5E0] text-[#2D2D2D]",
          )}
        >
          Xem chi tiết
        </Link>
        {isPendingPayment ? (
          <Link
            href={detailHref}
            className={cn(buttonVariants({ size: "sm" }), "font-semibold")}
          >
            Hoàn tất thanh toán
          </Link>
        ) : enrollment.status === "Active" ? (
          <Link
            href={continueHref}
            className={cn(
              buttonVariants({ size: "sm" }),
              "inline-flex gap-1.5 font-semibold",
            )}
          >
            Tiếp tục học
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        ) : null}
      </CardFooter>
    </Card>
  );
}
