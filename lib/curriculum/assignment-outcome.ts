export function formatAssignmentTimestamp(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return null;
  }
}

export type AssignmentResultDetail = {
  label: string;
  value: string;
};

export type AssignmentResultCardModel = {
  passed: boolean;
  summary?: string;
  assignedGrade: number;
  maxPoints: number;
  passScore: number;
  details: AssignmentResultDetail[];
  mentorFeedback?: string | null;
  footer?: string;
};

export type AssignmentPendingCardModel = {
  summary?: string;
  submittedLabel?: string | null;
};

export type AssignmentRevisionCardModel = {
  feedback?: string | null;
};
