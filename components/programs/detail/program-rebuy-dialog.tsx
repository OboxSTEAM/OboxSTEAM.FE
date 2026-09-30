"use client";

import { useRef, useState } from "react";

import { ContinuityClassPickerDialog } from "@/components/curriculum/recovery/continuity-class-picker-dialog";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { getProgramRebuyClasses } from "@/lib/api";
import { ApiRequestError } from "@/lib/api/errors";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { isClassSeatUnavailableError } from "@/lib/payment/checkout-hold-error";

import { ProgramEnrollPaymentDialog } from "./program-enroll-payment-dialog";
import { useProgramSelectedClass } from "./program-selected-class-context";

type ProgramRebuyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;
  /** rebuy-classes returned 409 (a live enrollment exists) — caller refreshes enrollments. */
  onUnavailable?: () => void;
};

/**
 * Rebuy (Completed / Failed / Dropped): rebuy-classes → select-class (5-min hold) → pay.
 * Backend creates a new ProgramEnrollment; never POST /api/class-enrollments here.
 */
export function ProgramRebuyDialog({
  open,
  onOpenChange,
  programId,
  onUnavailable,
}: ProgramRebuyDialogProps) {
  const { selectClass, releaseHold, holdExpiresAt } = useProgramSelectedClass();

  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  /** Kept after hold expiry so the payment dialog can show "hết hạn" instead of vanishing. */
  const [payClassId, setPayClassId] = useState<string | null>(null);
  const isChangingClassRef = useRef(false);

  const {
    data: catalog,
    isLoading,
    hasError,
    retry: reloadCatalog,
  } = useClientFetch({
    enabled: open,
    minSkeletonMs: 0,
    fetcher: async () => {
      const result = await getProgramRebuyClasses(programId);
      if (!result?.data) {
        throw new Error("Rebuy catalog missing data.");
      }
      return result.data;
    },
    deps: [open, programId],
    onError: (error) => {
      showAppErrorFromUnknown(error, "programs.rebuy");
      if (error instanceof ApiRequestError && error.status === 409) {
        onOpenChange(false);
        onUnavailable?.();
      }
    },
  });

  const loadState = isLoading
    ? "loading"
    : hasError
      ? "error"
      : catalog
        ? "ready"
        : "idle";

  async function handleSelect(classId: string) {
    setSelectingId(classId);
    try {
      await selectClass(classId);
      setPayClassId(classId);
      isChangingClassRef.current = false;
      onOpenChange(false);
      setPaymentOpen(true);
    } catch (error) {
      // selectClass already toasts the backend message.
      if (isClassSeatUnavailableError(error)) {
        reloadCatalog();
      }
    } finally {
      setSelectingId(null);
    }
  }

  const handlePickerOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen && isChangingClassRef.current) {
      isChangingClassRef.current = false;
      void releaseHold();
    }
  };

  const handleChangeClass = () => {
    isChangingClassRef.current = true;
    onOpenChange(true);
  };

  return (
    <>
      <ContinuityClassPickerDialog
        open={open}
        onOpenChange={handlePickerOpenChange}
        catalog={catalog}
        loadState={loadState}
        selectingId={selectingId}
        onSelect={(classId) => void handleSelect(classId)}
        onRetryLoad={reloadCatalog}
        title="Học lại chương trình"
        description="Chọn lớp để giữ chỗ 5 phút, sau đó thanh toán. Lớp mờ là lớp chưa đủ điều kiện."
        emptyMessage="Hiện chưa có lớp đang tuyển sinh"
        showCheckoutSummary
      />

      {payClassId && catalog ? (
        <ProgramEnrollPaymentDialog
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          programId={programId}
          classId={payClassId}
          price={catalog.checkoutAmount}
          priceBadge={catalog.withinRebuyWindow ? "Giảm 50%" : null}
          holdExpiresAt={holdExpiresAt}
          onDismiss={() => void releaseHold()}
          onChangeClass={handleChangeClass}
        />
      ) : null}
    </>
  );
}
