import type { QuizResult, ResearchSubmission } from "@/lib/api";
import type { RetrospectiveAttempt } from "@/lib/api/entities/retrospective";

import {
  formatAssignmentTimestamp,
  type AssignmentPendingCardModel,
  type AssignmentResultCardModel,
  type AssignmentRevisionCardModel,
} from "./assignment-outcome";

export function buildQuizResultOutcome(result: QuizResult): AssignmentResultCardModel {
  const wrongCount = Math.max(0, result.totalQuestions - result.correctCount);
  const submittedLabel = formatAssignmentTimestamp(result.submittedAt);

  return {
    passed: result.passed,
    summary: `Lần ${result.attemptNumber} · ${result.correctCount}/${result.totalQuestions} câu đúng · ${wrongCount} câu sai`,
    assignedGrade: result.assignedGrade,
    maxPoints: result.maxPoints,
    passScore: result.passScore,
    details: [
      { label: "Điểm đạt yêu cầu", value: String(result.passScore) },
      ...(submittedLabel ? [{ label: "Nộp lúc", value: submittedLabel }] : []),
    ],
    footer: result.passed
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
