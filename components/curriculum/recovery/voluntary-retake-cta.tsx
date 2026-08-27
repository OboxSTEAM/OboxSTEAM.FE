"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { ClassRedeliveryRequest } from "@/lib/api/entities/class-redelivery-request";
import type { EnrollmentCurriculumModule } from "@/lib/api/entities/enrollment-curriculum";
import { findOpenRedelivery } from "@/lib/curriculum/recovery-decision";

import { ClassRedeliveryRequestDialog } from "./class-redelivery-request-dialog";

type VoluntaryRetakeCtaProps = {
  module: EnrollmentCurriculumModule;
  redeliveryRequests: ClassRedeliveryRequest[];
  onCreated: () => void;
};

function isModuleLikelyCompleted(module: EnrollmentCurriculumModule): boolean {
  const required = [
    ...module.assignments,
    ...module.courses.flatMap((course) => course.assignments),
    ...module.milestones
      .map((milestone) => milestone.assignment)
      .filter((assignment): assignment is NonNullable<typeof assignment> =>
        Boolean(assignment),
      ),
  ].filter((assignment) => assignment.isRequiredForModulePass);

  if (required.length === 0) return false;
  return required.every((assignment) => assignment.status === "completed");
}

/** CTA “Học lại để trải nghiệm” for Completed Experiential/Research modules. */
export function VoluntaryRetakeCta({
  module,
  redeliveryRequests,
  onCreated,
}: VoluntaryRetakeCtaProps) {
  const [open, setOpen] = useState(false);

  const canShow = useMemo(() => {
    if (module.moduleType === "Theory") return false;
    if (!module.moduleEnrollmentId || module.isLocked) return false;
    if (!isModuleLikelyCompleted(module)) return false;
    return !findOpenRedelivery(redeliveryRequests, module.moduleEnrollmentId);
  }, [module, redeliveryRequests]);

  if (!canShow || !module.moduleEnrollmentId) return null;

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
          onClick={() => setOpen(true)}
        >
          Học lại để trải nghiệm
        </Button>
      </div>
      <ClassRedeliveryRequestDialog
        open={open}
        onOpenChange={setOpen}
        moduleEnrollmentId={module.moduleEnrollmentId}
        onCreated={onCreated}
      />
    </>
  );
}
