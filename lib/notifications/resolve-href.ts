import type { NotificationType } from "@/lib/api/entities/notification";
import { canAccessManagerArea, isParentRole } from "@/lib/auth/roles";
import { assignmentEditHref } from "@/lib/manager/curriculum-catalog";
import {
  parseNotificationPayload,
  payloadString,
  type NotificationPayload,
} from "@/lib/notifications/parse-payload";
import { getProgramLearnHref } from "@/lib/programs/enrollments";

export type ResolveNotificationHrefInput = {
  type: NotificationType;
  payload: NotificationPayload;
  /** Used only to pick student vs manager/parent destination paths — not to filter inbox. */
  accountRole?: string | null;
};

function learnWithAssignment(
  programId: string,
  assignmentId: string,
): string {
  const params = new URLSearchParams({ assignmentId });
  return `${getProgramLearnHref(programId)}?${params.toString()}`;
}

function learnWithActivity(programId: string, activityId: string): string {
  const params = new URLSearchParams({ activityId });
  return `${getProgramLearnHref(programId)}?${params.toString()}`;
}

function managerAssignmentHref(
  programId: string,
  assignmentId: string,
  moduleId: string | null,
): string {
  if (moduleId) {
    return assignmentEditHref(programId, moduleId, assignmentId);
  }
  const params = new URLSearchParams({
    node: "assignment",
    id: assignmentId,
  });
  return `/manager/programs/${programId}?${params.toString()}`;
}

function managerActivityHref(
  programId: string,
  activityId: string,
  courseId: string | null,
): string {
  const params = new URLSearchParams({
    node: "activity",
    id: activityId,
  });
  if (courseId) params.set("courseId", courseId);
  return `/manager/programs/${programId}?${params.toString()}`;
}

/**
 * Map notification `type` + parsed `payloadJson` → in-app href.
 * Returns `null` when the payload cannot resolve a known route (caller marks read only).
 */
export function resolveNotificationHref(
  input: ResolveNotificationHrefInput,
): string | null {
  const { type, payload, accountRole } = input;
  const isManager = canAccessManagerArea(accountRole);
  const isParent = isParentRole(accountRole);

  const programId = payloadString(payload, "programId");
  const assignmentId = payloadString(payload, "assignmentId");
  const activityId = payloadString(payload, "activityId");
  const classId = payloadString(payload, "classId");
  const classSessionId = payloadString(payload, "classSessionId");
  const moduleId = payloadString(payload, "moduleId");
  const courseId = payloadString(payload, "courseId");

  switch (type) {
    case "ParentPaymentRequested":
    case "ParentModuleRetakeRequested":
      return "/parent/children";

    case "QuizPassed":
    case "QuizFailed":
    case "ResearchGradedPassed":
    case "ResearchGradedFailed":
    case "ResearchReturnedForRevision":
    case "ResearchSubmissionOpened":
    case "ResearchWorkSubmitted":
      if (!programId || !assignmentId) return null;
      return learnWithAssignment(programId, assignmentId);

    case "AssignmentPublished":
    case "AssignmentEditedByMentor":
    case "ClassQuizSetEditedByMentor":
      if (!programId || !assignmentId) return null;
      if (isManager) {
        return managerAssignmentHref(programId, assignmentId, moduleId);
      }
      return learnWithAssignment(programId, assignmentId);

    case "MaterialUpdated":
      if (!programId || !activityId) return null;
      if (isManager) {
        return managerActivityHref(programId, activityId, courseId);
      }
      return learnWithActivity(programId, activityId);

    case "ProgramPendingPayment":
    case "PendingPaymentExpired":
    case "ModuleRetakePendingPayment":
    case "PaymentFailed":
    case "PaymentCancelled":
      return programId ? `/programs/${programId}` : null;

    case "ProgramActivated":
    case "PaymentSucceeded":
    case "ModuleUnlocked":
    case "ModuleCompleted":
    case "ModuleRetakeInitiated":
    case "ActivityCompleted":
    case "ClassEnrolled":
    case "ClassTransferred":
      return programId ? getProgramLearnHref(programId) : null;

    case "ClassSessionScheduled":
    case "ClassSessionRescheduled":
    case "ClassSessionStarted":
    case "ClassSessionCompleted":
    case "ClassSessionCancelled":
      if (isManager) {
        if (!classId) return null;
        if (classSessionId) {
          const params = new URLSearchParams({
            classId,
            sessionId: classSessionId,
          });
          return `/manager/attendance?${params.toString()}`;
        }
        return `/manager/sessions?classId=${encodeURIComponent(classId)}`;
      }
      return programId ? getProgramLearnHref(programId) : null;

    case "ClassCreated":
    case "ClassUpdated":
    case "ClassOpenForEnrollment":
    case "ClassStarted":
    case "ClassAutoStarted":
    case "ClassCompleted":
    case "ClassMentorRequestSubmitted":
    case "ClassMentorRequestApproved":
    case "ClassMentorRequestRejected":
    case "AttendanceMarkedPresent":
    case "AttendanceMarkedLate":
    case "AttendanceMarkedAbsent":
    case "AttendanceMarkedExcused":
      if (isManager) {
        return classId ? `/manager/classes/${classId}` : null;
      }
      return programId ? getProgramLearnHref(programId) : null;

    case "AssessmentRecoveryRequested":
      return "/mentor/recovery";

    case "AssessmentRecoveryApproved":
    case "AssessmentRecoveryRejected":
      if (!programId) return null;
      return assignmentId
        ? learnWithAssignment(programId, assignmentId)
        : getProgramLearnHref(programId);

    case "ClassRedeliveryPendingManager":
      return "/manager/redelivery";

    case "ClassRedeliveryMatchedPendingPayment":
    case "ClassRedeliveryRejected":
    case "ClassRedeliveryCompleted":
      return programId ? getProgramLearnHref(programId) : "/courses";

    case "ParentLinkRequested":
    case "ParentLinkVerified":
    case "ParentLinkApproved":
      return isParent ? "/parent/children" : "/profile";

    case "AccountRegistered":
    case "EmailVerified":
    case "PasswordChanged":
      return "/profile";

    case "MediaVideoReady":
    case "MediaProcessingFailed":
    case "MediaAiTaggingFailed":
    case "MediaTagsProcessed":
    case "HighlightVideoGenerationQueued":
    case "HighlightVideoReady":
    case "HighlightVideoGenerationFailed":
      return null;

    default:
      return null;
  }
}

/** Convenience: parse `payloadJson` then resolve. */
export function resolveNotificationHrefFromNotification(input: {
  type: NotificationType;
  payloadJson: string | null;
  accountRole?: string | null;
}): string | null {
  return resolveNotificationHref({
    type: input.type,
    payload: parseNotificationPayload(input.payloadJson),
    accountRole: input.accountRole,
  });
}
