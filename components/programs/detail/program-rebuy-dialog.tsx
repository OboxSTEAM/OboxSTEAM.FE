"use client";

import { useCallback, useEffect, useState } from "react";

import { ContinuityClassPickerDialog } from "@/components/curriculum/recovery/continuity-class-picker-dialog";
import {
  getProgramRebuyClasses,
  type RebuyClassCatalog,
} from "@/lib/api";
import { showAppErrorFromUnknown } from "@/lib/errors";

import { ProgramEnrollPaymentDialog } from "./program-enroll-payment-dialog";
import { useProgramSelectedClass } from "./program-selected-class-context";

type ProgramRebuyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;
  /** Catalog list price fallback if checkoutAmount missing. */
  programPrice: number;
};

/**
 * Failed/Dropped rebuy: load shared catalog → pick class → seat hold → pay.
 */
export function ProgramRebuyDialog({
  open,
  onOpenChange,
  programId,
  programPrice,
}: ProgramRebuyDialogProps) {
  const { selectClass, selectedClassId, hasValidHold, holdExpiresAt } =
    useProgramSelectedClass();

  const [catalog, setCatalog] = useState<RebuyClassCatalog | null>(null);
  const [loadState, setLoadState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const loadCatalog = useCallback(async () => {
    setLoadState("loading");
    try {
      const result = await getProgramRebuyClasses(programId);
      const next = result?.data ?? null;
      if (!next) {
        throw new Error("Rebuy catalog missing data.");
      }
      setCatalog(next);
      setLoadState("ready");
    } catch (error) {
      setCatalog(null);
      setLoadState("error");
      showAppErrorFromUnknown(error, "programs.rebuy");
    }
  }, [programId]);

  useEffect(() => {
    if (!open) {
      setPaymentOpen(false);
      setSelectingId(null);
      return;
    }
    void loadCatalog();
  }, [loadCatalog, open]);

  async function handleSelect(classId: string) {
    setSelectingId(classId);
    try {
      await selectClass(classId);
      setPaymentOpen(true);
      onOpenChange(false);
    } catch {
      // selectClass already toasts
    } finally {
      setSelectingId(null);
    }
  }

  const checkoutAmount = catalog?.checkoutAmount ?? programPrice;
  const payClassId =
    hasValidHold && selectedClassId ? selectedClassId : null;

  return (
    <>
      <ContinuityClassPickerDialog
        open={open}
        onOpenChange={onOpenChange}
        catalog={catalog}
        loadState={loadState}
        selectingId={selectingId}
        onSelect={(classId) => void handleSelect(classId)}
        onRetryLoad={() => void loadCatalog()}
        title="Đăng ký lại chương trình"
      />

      {payClassId ? (
        <ProgramEnrollPaymentDialog
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          programId={programId}
          classId={payClassId}
          price={checkoutAmount}
          holdExpiresAt={holdExpiresAt}
        />
      ) : null}
    </>
  );
}
