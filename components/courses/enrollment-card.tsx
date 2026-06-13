"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

import { ImageSlot } from "@/components/common/image-slot";
import { Badge } from "@/components/ui/badge";
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

function getStatusBadgeClass(status: ProgramEnrollment["status"]): string {
  switch (status) {
    case "Active":
      return "bg-[#7CB342]/15 text-[#3d5c22] hover:bg-[#7CB342]/15";
    case "PendingPayment":
      return "bg-[#FDD835]/20 text-[#6b5a00] hover:bg-[#FDD835]/20";
    case "Completed":
      return "bg-[#4FC3F7]/15 text-[#1565c0] hover:bg-[#4FC3F7]/15";
    case "Cancelled":
      return "bg-[#E5E5E0] text-[#6B6B6B] hover:bg-[#E5E5E0]";
    default:
      return "";
  }
}

export function EnrollmentCard({ enrollment, className }: EnrollmentCardProps) {
  const priceParts = getProgramPriceParts(enrollment.price);
  const isPendingPayment = enrollment.status === "PendingPayment";
  const detailHref = `/programs/${enrollment.programId}`;
  const continueHref = detailHref;

  return (
    <Card
      className={cn(
        "flex h-full flex-col overflow-hidden border-[#E5E5E0] bg-white shadow-sm transition-shadow hover:shadow-[0_8px_24px_rgba(45,45,45,0.08)]",
        className,
      )}
    >
      <div className="relative aspect-[16/9] border-b border-[#E5E5E0] bg-[#F5F5F0]">
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
        <div className="absolute left-3 top-3">
          <Badge className={getStatusBadgeClass(enrollment.status)}>
            {PROGRAM_ENROLLMENT_STATUS_LABELS[enrollment.status]}
          </Badge>
        </div>
      </div>

      <CardHeader className="gap-2 pb-3">
        <CardDescription className="text-xs font-medium uppercase tracking-wide text-[#6B6B6B]">
          {enrollment.seriesName}
        </CardDescription>
        <CardTitle className="font-heading line-clamp-2 text-lg leading-snug text-[#2D2D2D]">
          {enrollment.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 pb-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6B6B]">
          <span className="rounded-full bg-[#FAFAF5] px-2.5 py-1 font-medium text-[#2D2D2D]">
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

      <CardFooter className="mt-auto flex flex-wrap gap-2 border-t border-[#E5E5E0] pt-4">
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
