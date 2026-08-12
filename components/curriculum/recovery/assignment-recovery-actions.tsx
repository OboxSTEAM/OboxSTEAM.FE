"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { AssessmentRecoveryRequest } from "@/lib/api/entities/assessment-recovery-request";
import type { ClassRedeliveryRequest } from "@/lib/api/entities/class-redelivery-request";
import type { ModuleType } from "@/lib/api/entities/module";
import {
  findOpenRecovery,
  findOpenRedelivery,
  resolveRecoveryAction,
  type RecoveryAction,
} from "@/lib/curriculum/recovery-decision";
import {
  withdrawAssessmentRecoveryRequest,
  withdrawClassRedeliveryRequest,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

import { AssessmentRecoveryRequestDialog } from "./assessment-recovery-request-dialog";
import { ClassRedeliveryRequestDialog } from "./class-redelivery-request-dialog";
import { RetakeCheckoutDialog } from "./retake-checkout-dialog";

type AssignmentRecoveryActionsProps = {
  moduleType: ModuleType;
  moduleEnrollmentId: string;
  assignmentId: string;
  attemptNumber: number;
  maxAttempts: number;
  /** Failed attempt with no free retries left (or Theory window grant). */
  showRecoveryUi: boolean;
  needsDeadlineGrant?: boolean;
  recoveryRequests: AssessmentRecoveryRequest[];
  redeliveryRequests: ClassRedeliveryRequest[];
  onRetry?: () => void;
  isRetrying?: boolean;
  onRequestsChanged: () => void;
  className?: string;
};

const STATUS_COPY: Record<
  Extract<
    RecoveryAction,
    | "wait-recovery"
    | "wait-manager"
    | "wait-redelivery-payment"
    | "request-recovery"
    | "request-redelivery"
  >,
  { title: string; description: string }
> = {
  "wait-recovery": {
    title: "Đang chờ mentor duyệt",
    description: "Yêu cầu làm thêm lần đã gửi. Bạn có thể rút lại nếu cần.",
  },
  "wait-manager": {
    title: "Đang chờ xếp lớp",
    description:
      "Yêu cầu học lại lớp đang được xử lý. Bạn sẽ thanh toán khi có lớp phù hợp.",
  },
  "wait-redelivery-payment": {
    title: "Sẵn sàng thanh toán học lại",
    description: "Lớp đích đã khớp. Thanh toán phí học lại để hoàn tất chuyển lớp.",
  },
  "request-recovery": {
    title: "Hết lượt làm bài",
    description: "Xin mentor thêm lượt làm (cùng lớp hiện tại).",
  },
  "request-redelivery": {
    title: "Cần học lại lớp",
    description:
      "Bạn đã dùng hết yêu cầu làm thêm. Xin học lại module trên lớp khác.",
  },
};

export function AssignmentRecoveryActions({
  moduleType,
  moduleEnrollmentId,
  assignmentId,
  attemptNumber,
  maxAttempts,
  showRecoveryUi,
  needsDeadlineGrant = false,
  recoveryRequests,
  redeliveryRequests,
  onRetry,
  isRetrying = false,
  onRequestsChanged,
  className,
}: AssignmentRecoveryActionsProps) {
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [redeliveryOpen, setRedeliveryOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const action = useMemo(
    () =>
      resolveRecoveryAction({
        moduleType,
        attemptNumber,
        maxAttempts,
        needsDeadlineGrant,
        recoveryRequests,
        redeliveryRequests,
        moduleEnrollmentId,
        assignmentId,
      }),
    [
      moduleType,
      attemptNumber,
      maxAttempts,
      needsDeadlineGrant,
      recoveryRequests,
      redeliveryRequests,
      moduleEnrollmentId,
      assignmentId,
    ],
  );

  const openRecovery = findOpenRecovery(
    recoveryRequests,
    moduleEnrollmentId,
    assignmentId,
  );
  const openRedelivery = findOpenRedelivery(
    redeliveryRequests,
    moduleEnrollmentId,
  );

  if (!showRecoveryUi && action === "retry") {
    if (!onRetry) return null;
    return (
      <div
        className={cn(
          "flex shrink-0 flex-wrap items-center gap-2 border-t border-learn-border px-4 py-2.5 sm:px-5",
          className,
        )}
      >
        <Button
          type="button"
          variant="outline"
          className="ml-auto border-learn-border"
          disabled={isRetrying}
          onClick={onRetry}
        >
          {isRetrying ? "Đang mở bài..." : "Làm lại"}
        </Button>
      </div>
    );
  }

  if (!showRecoveryUi && action === "none") return null;

  const effectiveAction =
    showRecoveryUi || action !== "retry" ? action : "retry";

  if (effectiveAction === "retry") {
    if (!onRetry) return null;
    return (
      <div
        className={cn(
          "flex shrink-0 flex-wrap items-center gap-2 border-t border-learn-border px-4 py-2.5 sm:px-5",
          className,
        )}
      >
        <Button
          type="button"
          variant="outline"
          className="ml-auto border-learn-border"
          disabled={isRetrying}
          onClick={onRetry}
        >
          {isRetrying ? "Đang mở bài..." : "Làm lại"}
        </Button>
      </div>
    );
  }

  if (effectiveAction === "none") return null;

  const copy = STATUS_COPY[effectiveAction];

  async function handleWithdrawRecovery() {
    if (!openRecovery) return;
    setIsWithdrawing(true);
    try {
      await withdrawAssessmentRecoveryRequest(openRecovery.id);
      showAppSuccess({ title: "Đã rút yêu cầu làm lại" });
      onRequestsChanged();
    } catch (error) {
      showAppErrorFromUnknown(error, "assessment-recovery.create");
    } finally {
      setIsWithdrawing(false);
    }
  }

  async function handleWithdrawRedelivery() {
    if (!openRedelivery) return;
    setIsWithdrawing(true);
    try {
      await withdrawClassRedeliveryRequest(openRedelivery.id);
      showAppSuccess({ title: "Đã rút yêu cầu học lại lớp" });
      onRequestsChanged();
    } catch (error) {
      showAppErrorFromUnknown(error, "class-redelivery.create");
    } finally {
      setIsWithdrawing(false);
    }
  }

  return (
    <>
      <div
        className={cn(
          "space-y-3 border-t border-learn-border px-4 py-3 sm:px-5",
          className,
        )}
      >
        <div>
          <p className="font-heading text-sm font-semibold text-learn-text-strong">
            {copy.title}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-learn-muted">
            {copy.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {effectiveAction === "request-recovery" ? (
            <Button
              type="button"
              className="bg-learn-primary text-white hover:bg-learn-primary/90"
              onClick={() => setRecoveryOpen(true)}
            >
              Xin làm thêm lần
            </Button>
          ) : null}

          {effectiveAction === "request-redelivery" ? (
            <Button
              type="button"
              className="bg-learn-primary text-white hover:bg-learn-primary/90"
              onClick={() => setRedeliveryOpen(true)}
            >
              Xin học lại lớp
            </Button>
          ) : null}

          {effectiveAction === "wait-recovery" ? (
            <Button
              type="button"
              variant="outline"
              className="border-learn-border"
              disabled={isWithdrawing}
              onClick={() => void handleWithdrawRecovery()}
            >
              {isWithdrawing ? "Đang rút…" : "Rút yêu cầu"}
            </Button>
          ) : null}

          {effectiveAction === "wait-manager" && openRedelivery ? (
            <Button
              type="button"
              variant="outline"
              className="border-learn-border"
              disabled={isWithdrawing}
              onClick={() => void handleWithdrawRedelivery()}
            >
              {isWithdrawing ? "Đang rút…" : "Rút yêu cầu"}
            </Button>
          ) : null}

          {effectiveAction === "wait-redelivery-payment" &&
          openRedelivery?.retakeModuleEnrollmentId ? (
            <Button
              type="button"
              className="bg-learn-primary text-white hover:bg-learn-primary/90"
              onClick={() => setCheckoutOpen(true)}
            >
              Thanh toán học lại
            </Button>
          ) : null}
        </div>
      </div>

      <AssessmentRecoveryRequestDialog
        open={recoveryOpen}
        onOpenChange={setRecoveryOpen}
        moduleEnrollmentId={moduleEnrollmentId}
        assignmentId={assignmentId}
        onCreated={onRequestsChanged}
      />
      <ClassRedeliveryRequestDialog
        open={redeliveryOpen}
        onOpenChange={setRedeliveryOpen}
        moduleEnrollmentId={moduleEnrollmentId}
        onCreated={onRequestsChanged}
      />
      {openRedelivery?.retakeModuleEnrollmentId ? (
        <RetakeCheckoutDialog
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          retakeModuleEnrollmentId={openRedelivery.retakeModuleEnrollmentId}
        />
      ) : null}
    </>
  );
}
