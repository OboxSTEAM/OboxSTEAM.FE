"use client";

import { useState } from "react";

import { ProgramEnrollmentLookupProvider } from "@/components/programs/detail/program-enrollment-lookup";
import { ProgramRebuyDialog } from "@/components/programs/detail/program-rebuy-dialog";
import { ProgramSelectedClassProvider } from "@/components/programs/detail/program-selected-class-context";

type EnrollmentRebuyDialogProps = {
  programId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** rebuy-classes returned 409 — caller reloads the enrollment list. */
  onUnavailable?: () => void;
};

/**
 * Rebuy class picker for a rebuyable Completed card.
 * Providers mount on first open so the list does not fetch per card.
 */
export function EnrollmentRebuyDialog({
  programId,
  open,
  onOpenChange,
  onUnavailable,
}: EnrollmentRebuyDialogProps) {
  const [hasOpened, setHasOpened] = useState(open);

  if (open && !hasOpened) setHasOpened(true);
  if (!hasOpened) return null;

  return (
    <ProgramEnrollmentLookupProvider programId={programId}>
      <ProgramSelectedClassProvider programId={programId}>
        <ProgramRebuyDialog
          open={open}
          onOpenChange={onOpenChange}
          programId={programId}
          onUnavailable={onUnavailable}
        />
      </ProgramSelectedClassProvider>
    </ProgramEnrollmentLookupProvider>
  );
}
