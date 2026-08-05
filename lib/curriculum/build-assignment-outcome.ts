import type { QuizResult, ResearchSubmission } from "@/lib/api";
import type { RetrospectiveAttempt } from "@/lib/api/entities/retrospective";

import {
  formatAssignmentTimestamp,
  type AssignmentPendingCardModel,
  type AssignmentResultCardModel,
  type AssignmentRevisionCardModel,
} from "./assignment-outcome";

type BuildQuizResultOutcomeOptions = {
  /** Mentor/manager view — neutral footer instead of student copy. */
  viewer?: "student" | "mentor";
  /** When true, omit đúng/sai counts (list fallback without quiz/result detail). */
  hideQuestionStats?: boolean;
};

export function buildQuizResultOutcome(
  result: QuizResult,
  options: BuildQuizResultOutcomeOptions = {},
): AssignmentResultCardModel {
  const viewer = options.viewer ?? "student";
  const hideQuestionStats = options.hideQuestionStats ?? false;
  const wrongCount = Math.max(0, result.totalQuestions - result.correctCount);
  const submittedLabel = formatAssignmentTimestamp(result.submittedAt);
  const studentLabel = result.studentName?.trim() || null;

  const summary = hideQuestionStats
    ? `Lần ${result.attemptNumber}`
    : `Lần ${result.attemptNumber} · ${result.correctCount}/${result.totalQuestions} câu đúng · ${wrongCount} câu sai`;

  return {
    passed: result.passed,
    summary,
    assignedGrade: result.assignedGrade,
    maxPoints: result.maxPoints,
    passScore: result.passScore,
    details: [
      ...(viewer === "mentor" && studentLabel
        ? [{ label: "Học viên", value: studentLabel }]
        : []),
      { label: "Điểm đạt yêu cầu", value: String(result.passScore) },
      ...(submittedLabel ? [{ label: "Nộp lúc", value: submittedLabel }] : []),
    ],
    footer:
      viewer === "mentor"
        ? "Điểm do hệ thống tự chấm — chỉ xem, không chỉnh."
        : result.passed
          ? "Bạn đã hoàn thành bài kiểm tra này."
          : "Hãy ôn lại và thử lại nếu còn lượt làm.",
  };
}

export function buildRetrospectiveGradedOutcome(
  attempt: RetrospectiveAttempt,
): AssignmentResultCardModel {
  const gradedLabel = formatAssignmentTimestamp(attempt.gradedAt);
  const submittedLabel = formatAssignmentTimestamp(attempt.submittedAt);
  const passed = attempt.passed ?? false;

  return {
    passed,
    summary: attempt.attemptNumber > 1 ? `Lần ${attempt.attemptNumber}` : undefined,
    assignedGrade: attempt.assignedGrade ?? 0,
    maxPoints: attempt.maxPoints,
    passScore: attempt.passScore,
    details: [
      { label: "Điểm đạt yêu cầu", value: String(attempt.passScore) },
      ...(submittedLabel ? [{ label: "Nộp lúc", value: submittedLabel }] : []),
      ...(gradedLabel ? [{ label: "Chấm lúc", value: gradedLabel }] : []),
    ],
    mentorFeedback: attempt.mentorFeedback,
    footer: passed
      ? "Bạn đã hoàn thành bài đánh giá này."
      : "Hãy xem nhận xét của mentor và chỉnh sửa nếu được yêu cầu.",
  };
}

export function buildRetrospectivePendingOutcome(
  attempt: RetrospectiveAttempt,
): AssignmentPendingCardModel {
  const submittedLabel = formatAssignmentTimestamp(attempt.submittedAt);

  return {
    summary:
      attempt.attemptNumber > 1 ? `Lần ${attempt.attemptNumber} · chờ mentor chấm điểm` : undefined,
    submittedLabel,
  };
}

export function buildRetrospectiveRevisionOutcome(
  attempt: RetrospectiveAttempt,
): AssignmentRevisionCardModel {
  return {
    feedback: attempt.mentorFeedback,
  };
}

export function buildResearchGradedOutcome(
  submission: ResearchSubmission,
): AssignmentResultCardModel {
  const gradedLabel = formatAssignmentTimestamp(submission.gradedAt);
  const submittedLabel = formatAssignmentTimestamp(submission.submittedAt);
  const passed = submission.passed ?? false;

  return {
    passed,
    summary: submission.attemptNumber > 1 ? `Lần ${submission.attemptNumber}` : undefined,
    assignedGrade: submission.assignedGrade ?? 0,
    maxPoints: submission.maxPoints,
    passScore: submission.passScore,
    details: [
      { label: "Điểm đạt yêu cầu", value: String(submission.passScore) },
      ...(submittedLabel ? [{ label: "Nộp lúc", value: submittedLabel }] : []),
      ...(gradedLabel ? [{ label: "Chấm lúc", value: gradedLabel }] : []),
    ],
    mentorFeedback: submission.mentorFeedback,
    footer: passed
      ? "Bạn đã hoàn thành mốc nghiên cứu này."
      : "Hãy xem nhận xét của mentor và chỉnh sửa nếu được yêu cầu.",
  };
}

export function buildResearchPendingOutcome(
  submission: ResearchSubmission,
): AssignmentPendingCardModel {
  const submittedLabel = formatAssignmentTimestamp(submission.submittedAt);

  return {
    summary:
      submission.attemptNumber > 1
        ? `Lần ${submission.attemptNumber} · chờ mentor chấm điểm`
        : undefined,
    submittedLabel,
  };
}

export function buildResearchRevisionOutcome(
  submission: ResearchSubmission,
): AssignmentRevisionCardModel {
  return {
    feedback: submission.mentorFeedback,
  };
}
