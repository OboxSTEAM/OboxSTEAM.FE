"use client";

import { useState } from "react";

import { ProgramEnrollmentLookupProvider } from "@/components/programs/detail/program-enrollment-lookup";
import { ProgramRebuyDialog } from "@/components/programs/detail/program-rebuy-dialog";
import { ProgramSelectedClassProvider } from "@/components/programs/detail/program-selected-class-context";
import { Button } from "@/components/ui/button";

type EnrollmentRebuyActionProps = {
  programId: string;
  /** rebuy-classes returned 409 — caller reloads the enrollment list. */
  onUnavailable?: () => void;
};

/**
 * "Học lại" on a rebuyable Completed card — opens the rebuy class picker in place.
 * Providers mount on first click so the list does not fetch per card.
 */
export function EnrollmentRebuyAction({
  programId,
  onUnavailable,
}: EnrollmentRebuyActionProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-[#E5E5E0] font-semibold text-[#2D2D2D]"
        onClick={() => {
          setIsMounted(true);
          setOpen(true);
        }}
      >
        Học lại
      </Button>

      {isMounted ? (
        <ProgramEnrollmentLookupProvider programId={programId}>
          <ProgramSelectedClassProvider programId={programId}>
            <ProgramRebuyDialog
              open={open}
              onOpenChange={setOpen}
              programId={programId}
              onUnavailable={onUnavailable}
            />
          </ProgramSelectedClassProvider>
        </ProgramEnrollmentLookupProvider>
      ) : null}
    </>
  );
}
