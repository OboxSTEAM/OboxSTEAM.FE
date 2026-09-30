"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  MoreHorizontal,
  Receipt,
  RotateCcw,
  Star,
  type LucideIcon,
} from "lucide-react";

import { CertificateCongratsBox } from "@/components/certificates/certificate-congrats-box";
import { InvoiceBrowserDialog } from "@/components/payment/invoice-browser-dialog";
import { ProgramReviewDialog } from "@/components/programs/reviews/program-review-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CertificateListItem } from "@/lib/api/entities/certificate";
import type { Invoice } from "@/lib/api/entities/invoice";
import type { ProgramEnrollment } from "@/lib/api/program-enrollments";
import {
  getProgramPriceParts,
  PROGRAM_LEVEL_LABELS,
} from "@/lib/programs/constants";
import {
  canRebuyCompletedEnrollment,
  getEnrollmentDisplayStatusLabel,
  getEnrollmentRebuyHint,
  getProgramLearnHref,
} from "@/lib/programs/enrollments";
import { getProgramThumbnailUrl } from "@/lib/programs/format";
import { cn } from "@/lib/utils";

import { EnrollmentRebuyDialog } from "./enrollment-rebuy-dialog";
import { EnrollmentReviewInvite } from "./enrollment-review-invite";
import { useEnrollmentReview } from "./use-enrollment-review";

type EnrollmentCardProps = {
  enrollment: ProgramEnrollment;
  /** Issued certificate for this program — shown as the foot strip. */
  certificate?: CertificateListItem | null;
  /** Invoices for this program — opened from the overflow menu. */
  invoices?: Invoice[];
  className?: string;
  /** Set for above-the-fold thumbnails (LCP). */
  priority?: boolean;
  /** Reload the list (e.g. rebuy found a live enrollment). */
  onEnrollmentsChanged?: () => void;
};

/**
 * One primary CTA per status; the thumbnail + title open program detail;
 * rare actions (rebuy, invoices, edit review) live in the overflow menu.
 */
export function EnrollmentCard({
  enrollment,
  certificate = null,
  invoices = [],
  className,
  priority = false,
  onEnrollmentsChanged,
}: EnrollmentCardProps) {
  const [isRebuyOpen, setIsRebuyOpen] = useState(false);
  const [isInvoicesOpen, setIsInvoicesOpen] = useState(false);
  const review = useEnrollmentReview({
    programId: enrollment.programId,
    reviewId: enrollment.reviewId,
  });

  const priceParts = getProgramPriceParts(enrollment.price ?? 0);
  const detailHref = `/programs/${enrollment.programId}`;
  const learnHref = getProgramLearnHref(enrollment.programId);
  const isCompleted = enrollment.status === "Completed";
  const thumbnailUrl = getProgramThumbnailUrl(enrollment.thumbnailUrl);
  const rebuyHint = getEnrollmentRebuyHint(enrollment);
  const primaryAction = getPrimaryAction(enrollment, detailHref, learnHref);
  const canRebuy = canRebuyCompletedEnrollment(enrollment);
  const hasCertificateStrip = isCompleted && Boolean(certificate?.code?.trim());
  const showReviewInvite =
    isCompleted && !hasCertificateStrip && !review.hasReview;

  const sortedInvoices = useMemo(
    () =>
      [...invoices].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [invoices],
  );

  const menuItems: OverflowMenuItem[] = [];
  if (canRebuy) {
    menuItems.push({
      key: "rebuy",
      label: "Học lại",
      icon: RotateCcw,
      onClick: () => setIsRebuyOpen(true),
    });
  }
  if (isCompleted && !showReviewInvite) {
    menuItems.push({
      key: "review",
      label: review.hasReview ? "Sửa đánh giá" : "Đánh giá",
      icon: Star,
      isIconFilled: review.hasReview,
      disabled: review.isResolving,
      onClick: () => void review.openReview(),
    });
  }
  if (sortedInvoices.length > 0) {
    menuItems.push({
      key: "invoices",
      label:
        sortedInvoices.length === 1
          ? "Hóa đơn thanh toán"
          : `Hóa đơn thanh toán (${sortedInvoices.length})`,
      icon: Receipt,
      onClick: () => setIsInvoicesOpen(true),
    });
  }

  return (
    <Card
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border-[#E5E5E0] bg-white shadow-[0_2px_16px_rgba(45,45,45,0.05)] transition-shadow hover:shadow-[0_8px_24px_rgba(45,45,45,0.1)]",
        className,
      )}
    >
      <Link
        href={detailHref}
        className="group/detail flex flex-col gap-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4FC3F7]"
      >
        <span className="sr-only">Xem chi tiết: </span>
        <div className="p-3 pb-0">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-[#E5E5E0] bg-[#F5F5F0]">
            <Image
              src={thumbnailUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover motion-safe:transition-transform motion-safe:duration-300 group-hover/detail:scale-[1.03]"
              priority={priority}
            />
          </div>
        </div>

        <CardHeader className="gap-3 pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardDescription className="min-w-0 text-xs font-medium uppercase tracking-wide text-[#6B6B6B]">
              {enrollment.seriesName || "Chương trình"}
            </CardDescription>
            <EnrollmentStatusPill enrollment={enrollment} />
          </div>
          <CardTitle className="font-heading line-clamp-2 text-lg leading-snug text-[#2D2D2D] decoration-[#E94B3C]/50 decoration-2 underline-offset-4 group-hover/detail:underline">
            {enrollment.name || "Chưa đặt tên"}
          </CardTitle>
        </CardHeader>
      </Link>

      <CardContent className="flex flex-1 flex-col gap-4 pb-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6B6B]">
          <span className="rounded-full border border-[#E5E5E0] bg-[#FAFAF5] px-2.5 py-1 font-medium text-[#2D2D2D]">
            {PROGRAM_LEVEL_LABELS[enrollment.level]}
          </span>
          {enrollment.estimatedDuration ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5 shrink-0" aria-hidden />
              {enrollment.estimatedDuration}
            </span>
          ) : null}
        </div>

        {enrollment.status === "Active" || isCompleted ? (
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

        {rebuyHint ? (
          <p className="text-xs leading-relaxed text-[#1565c0]">{rebuyHint}</p>
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

      <div className="mt-auto">
        <CardFooter className="gap-2 border-t border-[#E5E5E0] bg-transparent px-4 py-4">
          <Link
            href={primaryAction.href}
            className={cn(
              buttonVariants({
                variant: primaryAction.isOutline ? "outline" : "default",
                size: "lg",
              }),
              "h-10 flex-1 justify-center font-semibold",
              primaryAction.isOutline && "border-[#E5E5E0] text-[#2D2D2D]",
            )}
          >
            {primaryAction.label}
            {primaryAction.hasArrow ? (
              <ArrowRight className="size-4" aria-hidden />
            ) : null}
          </Link>

          {menuItems.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-lg"
                    className="size-10 shrink-0 border-[#E5E5E0] text-[#2D2D2D]"
                    aria-label="Thêm hành động"
                  />
                }
              >
                <MoreHorizontal className="size-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-xl border border-[#E5E5E0] bg-white p-1 shadow-lg"
              >
                {menuItems.map(
                  ({ key, label, icon: Icon, isIconFilled, disabled, onClick }) => (
                    <DropdownMenuItem
                      key={key}
                      disabled={disabled}
                      onClick={onClick}
                      className="cursor-pointer gap-2 rounded-lg px-2 py-2 text-[#2D2D2D] focus:bg-[#F5F5F0] focus:text-[#2D2D2D] not-data-[variant=destructive]:focus:**:text-[#2D2D2D]"
                    >
                      <Icon
                        className={cn(
                          "size-4",
                          isIconFilled
                            ? "fill-[#FDD835] !text-[#FDD835]"
                            : "!text-[#6B6B6B]",
                        )}
                        aria-hidden
                      />
                      {label}
                    </DropdownMenuItem>
                  ),
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </CardFooter>

        {hasCertificateStrip && certificate ? (
          <CertificateCongratsBox certificate={certificate} />
        ) : showReviewInvite ? (
          <EnrollmentReviewInvite
            onClick={() => void review.openReview()}
            isResolving={review.isResolving}
          />
        ) : null}
      </div>

      {canRebuy ? (
        <EnrollmentRebuyDialog
          programId={enrollment.programId}
          open={isRebuyOpen}
          onOpenChange={setIsRebuyOpen}
          onUnavailable={onEnrollmentsChanged}
        />
      ) : null}

      {isCompleted ? (
        <ProgramReviewDialog
          programId={enrollment.programId}
          programName={enrollment.name}
          {...review.dialogProps}
        />
      ) : null}

      {sortedInvoices.length > 0 ? (
        <InvoiceBrowserDialog
          invoices={sortedInvoices}
          open={isInvoicesOpen}
          onOpenChange={setIsInvoicesOpen}
          programName={enrollment.name}
          programThumbnailUrl={enrollment.thumbnailUrl}
        />
      ) : null}
    </Card>
  );
}

function EnrollmentStatusPill({
  enrollment,
}: {
  enrollment: ProgramEnrollment;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide shadow-sm",
        getStatusPillClass(enrollment),
      )}
    >
      {getEnrollmentDisplayStatusLabel(enrollment)}
    </span>
  );
}

function getPrimaryAction(
  enrollment: ProgramEnrollment,
  detailHref: string,
  learnHref: string,
): PrimaryAction {
  switch (enrollment.status) {
    case "PendingPayment":
      return { label: "Hoàn tất thanh toán", href: detailHref };
    case "Active":
      return {
        label: enrollment.isRebuy ? "Tiếp tục học lại" : "Tiếp tục học",
        href: learnHref,
        hasArrow: true,
      };
    case "Completed":
      return { label: "Xem lại khóa học", href: learnHref, hasArrow: true };
    case "Failed":
    case "Dropped":
      return { label: "Đăng ký lại", href: detailHref, hasArrow: true };
    default:
      return { label: "Xem chi tiết", href: detailHref, isOutline: true };
  }
}

function formatEnrollmentDate(iso: string | null): string {
  if (!iso) return "—";
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

function getStatusPillClass(enrollment: ProgramEnrollment): string {
  if (enrollment.isRebuy && enrollment.status === "Active") {
    return "border-[#4FC3F7]/45 bg-[#E8F7FD] text-[#1565c0]";
  }

  switch (enrollment.status) {
    case "Active":
      return "border-[#7CB342]/40 bg-[#7CB342]/18 text-[#2d5016]";
    case "PendingPayment":
      return "border-[#E94B3C]/35 bg-[#FFF0EE] text-[#B71C1C]";
    case "Deferred":
      return "border-[#FDD835]/45 bg-[#FFF8E1] text-[#8A7200]";
    case "Completed":
      return "border-[#4FC3F7]/45 bg-[#E8F7FD] text-[#1565c0]";
    case "Failed":
      return "border-[#E94B3C]/40 bg-[#FFF0EE] text-[#a82a1e]";
    case "Dropped":
      return "border-[#D4D4CF] bg-[#F5F5F0] text-[#6B6B6B]";
    default:
      return "border-[#E5E5E0] bg-white text-[#2D2D2D]";
  }
}

type PrimaryAction = {
  label: string;
  href: string;
  hasArrow?: boolean;
  isOutline?: boolean;
};

type OverflowMenuItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  isIconFilled?: boolean;
  disabled?: boolean;
  onClick: () => void;
};
