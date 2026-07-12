"use client";

import type { EnrollmentCurriculum } from "@/lib/api";
import type { FlatCurriculumAssignment } from "@/lib/curriculum/assignment-helpers";

import { QuizPanel } from "./quiz-panel";
import { RetrospectivePanel } from "./retrospective-panel";

type AssignmentPanelProps = {
  curriculum: EnrollmentCurriculum;
  assignmentId: string;
  flatAssignment: FlatCurriculumAssignment;
  onCurriculumRefresh: () => Promise<void>;
};

export function AssignmentPanel({
  curriculum,
  assignmentId,
  flatAssignment,
  onCurriculumRefresh,
}: AssignmentPanelProps) {
  if (flatAssignment.assignmentType === "Quiz") {
    return (
      <QuizPanel
        curriculum={curriculum}
        assignmentId={assignmentId}
        flatAssignment={flatAssignment}
        onCurriculumRefresh={onCurriculumRefresh}
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
