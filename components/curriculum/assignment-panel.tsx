"use client";

import type { EnrollmentCurriculum } from "@/lib/api";
import type { FlatCurriculumAssignment } from "@/lib/curriculum/assignment-helpers";
import { buildRecoveryCheckoutContext } from "@/lib/curriculum/recovery-checkout";

import { QuizPanel } from "./quiz-panel";
import { ResearchSubmissionPanel } from "./research-submission-panel";
import { RetrospectivePanel } from "./retrospective-panel";

type AssignmentPanelProps = {
  curriculum: EnrollmentCurriculum;
  assignmentId: string;
  flatAssignment: FlatCurriculumAssignment;
  onCurriculumRefresh: () => Promise<void>;
  programPrice?: number | null;
};

export function AssignmentPanel({
  curriculum,
  assignmentId,
  flatAssignment,
  onCurriculumRefresh,
  programPrice = null,
}: AssignmentPanelProps) {
  const recoveryCheckoutProps = buildRecoveryCheckoutContext(
    curriculum,
    programPrice,
  );
  if (flatAssignment.assignmentType === "Quiz") {
    return (
      <QuizPanel
        curriculum={curriculum}
        assignmentId={assignmentId}
        flatAssignment={flatAssignment}
        onCurriculumRefresh={onCurriculumRefresh}
        programName={recoveryCheckoutProps.programName}
        programPrice={recoveryCheckoutProps.programPrice}
        completedModuleCount={recoveryCheckoutProps.completedModuleCount}
      />
    );
  }

  if (flatAssignment.assignmentType === "Retrospective") {
    return (
      <RetrospectivePanel
        curriculum={curriculum}
        assignmentId={assignmentId}
        flatAssignment={flatAssignment}
        onCurriculumRefresh={onCurriculumRefresh}
        programName={recoveryCheckoutProps.programName}
        programPrice={recoveryCheckoutProps.programPrice}
        completedModuleCount={recoveryCheckoutProps.completedModuleCount}
      />
    );
  }

  if (flatAssignment.assignmentType === "FileUpload") {
    return (
      <ResearchSubmissionPanel
        curriculum={curriculum}
        assignmentId={assignmentId}
        flatAssignment={flatAssignment}
        onCurriculumRefresh={onCurriculumRefresh}
        programName={recoveryCheckoutProps.programName}
        programPrice={recoveryCheckoutProps.programPrice}
        completedModuleCount={recoveryCheckoutProps.completedModuleCount}
      />
    );
  }

  return (
    <div className="flex h-full items-center justify-center rounded-2xl border border-learn-border bg-learn-surface p-8 text-center shadow-[0_4px_20px_rgba(45,45,45,0.04)]">
      <p className="text-sm text-learn-muted">
        Loại bài tập này sẽ được hỗ trợ sớm.
      </p>
    </div>
  );
}
