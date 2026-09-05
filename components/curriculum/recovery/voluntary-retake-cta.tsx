"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { ClassRedeliveryRequest } from "@/lib/api/entities/class-redelivery-request";
import type { EnrollmentCurriculumModule } from "@/lib/api/entities/enrollment-curriculum";
import { cancelClassRedeliveryRequest } from "@/lib/api";
import { findOpenRedelivery } from "@/lib/curriculum/recovery-decision";
import { isModuleLikelyCompleted } from "@/lib/curriculum/module-completion";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";

import { ClassRedeliveryCandidatesDialog } from "./class-redelivery-candidates-dialog";
import { ClassRedeliveryRequestDialog } from "./class-redelivery-request-dialog";
import { RetakeCheckoutDialog } from "./retake-checkout-dialog";

type VoluntaryRetakeCtaProps = {
  module: EnrollmentCurriculumModule;
  redeliveryRequests: ClassRedeliveryRequest[];
  onCreated: () => void;
  programName?: string | null;
  programPrice?: number | null;
  completedModuleCount?: number | null;
};

/** CTA “Học lại để trải nghiệm” + follow-through for open continuity requests. */
export function VoluntaryRetakeCta({
  module,
  redeliveryRequests,
  onCreated,
  programName,
  programPrice,
  completedModuleCount,
}: VoluntaryRetakeCtaProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [candidatesOpen, setCandidatesOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutAmount, setCheckoutAmount] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [openPickerAfterRefresh, setOpenPickerAfterRefresh] = useState(false);

  const openRedelivery = useMemo(
    () => findOpenRedelivery(redeliveryRequests, module.moduleEnrollmentId),
    [module.moduleEnrollmentId, redeliveryRequests],
  );

  useEffect(() => {
    if (
      openPickerAfterRefresh &&
      openRedelivery?.status === "AwaitingClassSelection"
    ) {
      setCandidatesOpen(true);
      setOpenPickerAfterRefresh(false);
    }
  }, [openPickerAfterRefresh, openRedelivery]);

  const canStart = useMemo(() => {
    if (module.moduleType === "Theory") return false;
    if (!module.moduleEnrollmentId || module.isLocked) return false;
    if (!isModuleLikelyCompleted(module)) return false;
    return openRedelivery == null;
  }, [module, openRedelivery]);

  if (!module.moduleEnrollmentId) return null;
  if (!canStart && openRedelivery == null) return null;

  async function handleCancel() {
    if (!openRedelivery) return;
    setIsCancelling(true);
    try {
      await cancelClassRedeliveryRequest(openRedelivery.id);
      showAppSuccess({ title: "Đã hủy yêu cầu học lại lớp" });
      onCreated();
    } catch (error) {
      showAppErrorFromUnknown(error, "class-redelivery.create");
    } finally {
      setIsCancelling(false);
    }
  }

  if (openRedelivery) {
    const needsSelect = openRedelivery.status === "AwaitingClassSelection";
    const needsPay =
      Boolean(openRedelivery.retakeModuleEnrollmentId) &&
      (openRedelivery.status === "MatchedPendingPayment" ||
        openRedelivery.status === "Approved");

    return (
      <>
        <div className="space-y-2 border-t border-learn-border px-3 py-2.5">
          <p className="text-xs text-learn-muted">
            {needsSelect
              ? "Yêu cầu học lại đang mở — chọn lớp hoặc hủy."
              : "Lớp đã khớp — thanh toán phí học lại (50%) hoặc hủy yêu cầu."}
          </p>
          <div className="flex flex-wrap gap-2">
            {needsSelect ? (
              <Button
                type="button"
                size="sm"
                className="h-9 bg-learn-primary text-white hover:bg-learn-primary/90"
                onClick={() => setCandidatesOpen(true)}
              >
                Chọn lớp
              </Button>
            ) : null}
            {needsPay && openRedelivery.retakeModuleEnrollmentId ? (
              <Button
                type="button"
                size="sm"
                className="h-9 bg-learn-primary text-white hover:bg-learn-primary/90"
                onClick={() => setCheckoutOpen(true)}
              >
                Thanh toán
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 border-learn-border"
              disabled={isCancelling}
              onClick={() => void handleCancel()}
            >
              {isCancelling ? "Đang hủy…" : "Hủy yêu cầu"}
            </Button>
          </div>
        </div>
        <ClassRedeliveryCandidatesDialog
          open={candidatesOpen}
          onOpenChange={setCandidatesOpen}
          requestId={openRedelivery.id}
          onSelected={(amount) => {
            if (amount != null) setCheckoutAmount(amount);
            onCreated();
          }}
        />
        {openRedelivery.retakeModuleEnrollmentId ? (
          <RetakeCheckoutDialog
            open={checkoutOpen}
            onOpenChange={setCheckoutOpen}
            retakeModuleEnrollmentId={openRedelivery.retakeModuleEnrollmentId}
            programName={programName}
            checkoutAmount={checkoutAmount ?? programPrice}
            completedModuleCount={completedModuleCount}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <div className="border-t border-learn-border px-3 py-2.5">
        <p className="text-xs text-learn-muted">
          Muốn trải nghiệm lại module này trên lớp khác?
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 h-9 border-learn-border"
          onClick={() => setCreateOpen(true)}
        >
          Học lại để trải nghiệm
        </Button>
      </div>
      <ClassRedeliveryRequestDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        moduleEnrollmentId={module.moduleEnrollmentId}
        onCreated={() => {
          setOpenPickerAfterRefresh(true);
          onCreated();
        }}
      />
    </>
  );
}
