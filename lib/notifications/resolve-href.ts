import type { NotificationType } from "@/lib/api/entities/notification";
import {
  canAccessManagerArea,
  isMentorRole,
  isParentRole,
} from "@/lib/auth/roles";
import { assignmentEditHref } from "@/lib/manager/curriculum-catalog";
import {
  payloadString,
  resolveNotificationPayload,
  type NotificationPayload,
} from "@/lib/notifications/parse-payload";
import {
  getParentChildProgressionHref,
  getParentEnrollmentProgressionHref,
} from "@/lib/parent/progression";
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

/**
 * Prefer next actionable node: nextActivityId → assignmentId → activityId → learn overview.
 */
function studentLearnHref(
  programId: string,
  payload: NotificationPayload,
): string {
  const nextActivityId = payloadString(payload, "nextActivityId");
  const assignmentId = payloadString(payload, "assignmentId");
  const activityId = payloadString(payload, "activityId");

  if (nextActivityId) return learnWithActivity(programId, nextActivityId);
  if (assignmentId) return learnWithAssignment(programId, assignmentId);
  if (activityId) return learnWithActivity(programId, activityId);
  return getProgramLearnHref(programId);
}

function parentProgressHref(payload: NotificationPayload): string {
  const studentId =
    payloadString(payload, "studentId") ??
    payloadString(payload, "parentStudentId") ??
    payloadString(payload, "childUserId") ??
    payloadString(payload, "childId");
  const enrollmentId =
    payloadString(payload, "enrollmentId") ??
    payloadString(payload, "programEnrollmentId");

  if (studentId && enrollmentId) {
    return getParentEnrollmentProgressionHref(studentId, enrollmentId);
  }
  if (studentId) return getParentChildProgressionHref(studentId);
  return "/parent/children";
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

/** Relative in-app path only — reject absolute URLs / protocol-relative. */
function isSafeAppPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("://");
}

function resolveDeeplinkPathOverride(
  payload: NotificationPayload,
  accountRole: string | null | undefined,
): string | null {
  const deeplinkPath =
    payloadString(payload, "deeplinkPath") ??
    payloadString(payload, "deepLinkPath");
  if (!deeplinkPath || !isSafeAppPath(deeplinkPath)) return null;

  const isManager = canAccessManagerArea(accountRole);
  const isParent = isParentRole(accountRole);
  const isMentor = isMentorRole(accountRole);

  if (deeplinkPath === "/manager" || deeplinkPath.startsWith("/manager/")) {
    return isManager ? deeplinkPath : null;
  }
  if (deeplinkPath === "/mentor" || deeplinkPath.startsWith("/mentor/")) {
    return isMentor || isManager ? deeplinkPath : null;
  }
  if (deeplinkPath === "/parent" || deeplinkPath.startsWith("/parent/")) {
    return isParent ? deeplinkPath : null;
  }
  return deeplinkPath;
}

/**
 * Map notification `type` + resolved payload → in-app href.
 * Returns `null` when the payload cannot resolve a known route (caller marks read only).
 *
 * Prefer typed `Notification.payload`. Legacy `payloadJson` is only for older rows.
 */
export function resolveNotificationHref(
  input: ResolveNotificationHrefInput,
): string | null {
  const { type, payload, accountRole } = input;
  const isManager = canAccessManagerArea(accountRole);
  const isParent = isParentRole(accountRole);
  const isMentor = isMentorRole(accountRole);

  const override = resolveDeeplinkPathOverride(payload, accountRole);
  if (override) return override;

  const programId = payloadString(payload, "programId");
  const assignmentId = payloadString(payload, "assignmentId");
  const activityId = payloadString(payload, "activityId");
  const classId = payloadString(payload, "classId");
  const classSessionId = payloadString(payload, "classSessionId");
  const moduleId = payloadString(payload, "moduleId");
  const courseId = payloadString(payload, "courseId");

  switch (type) {
    case "ParentPaymentRequested":
    case "ParentModuleRetakeRequested": {
      const studentId =
        payloadString(payload, "studentId") ??
        payloadString(payload, "parentStudentId");
      return studentId
        ? getParentChildProgressionHref(studentId)
        : "/parent/children";
    }

    case "QuizPassed":
    case "QuizFailed":
    case "ResearchGradedPassed":
    case "ResearchGradedFailed":
    case "ResearchReturnedForRevision":
    case "ResearchSubmissionOpened":
    case "ResearchWorkSubmitted":
      if (isParent) return parentProgressHref(payload);
      if (isManager) {
        if (!programId || !assignmentId) return null;
        return managerAssignmentHref(programId, assignmentId, moduleId);
      }
      if (isMentor) {
        return classId ? `/mentor/classes/${classId}` : "/mentor/classes";
      }
      if (!programId || !assignmentId) return null;
      return learnWithAssignment(programId, assignmentId);

    case "AssignmentPublished":
    case "AssignmentEditedByMentor":
    case "ClassQuizSetEditedByMentor":
      if (isParent) return parentProgressHref(payload);
      if (isMentor) {
        return classId ? `/mentor/classes/${classId}` : "/mentor/classes";
      }
      if (!programId || !assignmentId) return null;
      if (isManager) {
        return managerAssignmentHref(programId, assignmentId, moduleId);
      }
      return learnWithAssignment(programId, assignmentId);

    case "MaterialUpdated":
      if (isParent) return parentProgressHref(payload);
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
      if (isParent) return parentProgressHref(payload);
      return programId ? `/programs/${programId}` : null;

    case "ProgramActivated":
    case "PaymentSucceeded":
    case "ModuleUnlocked":
    case "ModuleCompleted":
    case "ModuleFailed":
    case "ModuleRetakeInitiated":
    case "ActivityCompleted":
    case "ClassEnrolled":
    case "ClassTransferred":
      if (isParent) return parentProgressHref(payload);
      return programId ? studentLearnHref(programId, payload) : null;

    case "ClassSessionScheduled":
    case "ClassSessionRescheduled":
    case "ClassSessionStarted":
    case "ClassSessionCompleted":
    case "ClassSessionCancelled":
      if (isParent) return parentProgressHref(payload);
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
      return programId ? studentLearnHref(programId, payload) : null;

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
      if (isParent) return parentProgressHref(payload);
      if (isManager) {
        return classId ? `/manager/classes/${classId}` : null;
      }
      return programId ? studentLearnHref(programId, payload) : null;

    case "AssessmentRecoveryRequested":
      return "/mentor/recovery";

    case "AssessmentRecoveryApproved":
    case "AssessmentRecoveryRejected":
      if (isParent) return parentProgressHref(payload);
      if (!programId) return null;
      return assignmentId
        ? learnWithAssignment(programId, assignmentId)
        : studentLearnHref(programId, payload);

    case "ClassRedeliveryPendingManager":
      return "/manager/redelivery";

    case "ClassRedeliveryAwaitingSelection":
    case "ClassRedeliveryCandidatesAvailable":
    case "ClassRedeliveryIntensiveOffered":
    case "ClassRedeliveryMatchedPendingPayment":
    case "ClassRedeliveryRejected":
    case "ClassRedeliveryCompleted":
    case "ClassRedeliveryWithdrawn":
      if (isParent) return parentProgressHref(payload);
      return programId ? studentLearnHref(programId, payload) : "/courses";

    case "ParentLinkRequested":
    case "ParentLinkVerified":
    case "ParentLinkApproved":
      return isParent ? parentProgressHref(payload) : "/profile";

    case "AccountRegistered":
    case "EmailVerified":
    case "PasswordChanged":
      return "/profile";

    case "MediaVideoReady":
    case "MediaProcessingFailed":
    case "MediaAiTaggingFailed":
    case "MediaTagsProcessed": {
      const mediaAssetId = payloadString(payload, "mediaAssetId");
      if (isManager) {
        if (classId && mediaAssetId) {
          return `/manager/classes/${classId}?mediaId=${encodeURIComponent(mediaAssetId)}`;
        }
        return classId ? `/manager/classes/${classId}` : "/manager/classes";
      }
      if (isParent) return parentProgressHref(payload);
      if (isMentor) {
        if (classId && mediaAssetId) {
          return `/mentor/classes/${classId}?tab=media&mediaId=${encodeURIComponent(mediaAssetId)}`;
        }
        return mediaAssetId
          ? `/mentor/classes?mediaId=${encodeURIComponent(mediaAssetId)}`
          : "/mentor/classes";
      }
      return programId ? studentLearnHref(programId, payload) : "/courses";
    }

    case "HighlightVideoGenerationQueued":
    case "HighlightVideoReady":
    case "HighlightVideoGenerationFailed": {
      if (isParent) return parentProgressHref(payload);
      if (isManager) {
        return classId ? `/manager/classes/${classId}` : "/manager/classes";
      }
      if (isMentor) {
        return classId ? `/mentor/classes/${classId}` : "/mentor/classes";
      }
      const highlightVideoId = payloadString(payload, "highlightVideoId");
      return highlightVideoId
        ? `/portfolio?highlightVideoId=${encodeURIComponent(highlightVideoId)}`
        : "/portfolio";
    }

    default:
      return null;
  }
}

/** Prefer typed `payload`; fall back to legacy `payloadJson` for older rows. */
export function resolveNotificationHrefFromNotification(input: {
  type: NotificationType;
  payload?: NotificationPayload | null;
  payloadJson?: string | null;
  accountRole?: string | null;
}): string | null {
  return resolveNotificationHref({
    type: input.type,
    payload: resolveNotificationPayload({
      payload: input.payload,
      payloadJson: input.payloadJson,
    }),
    accountRole: input.accountRole,
  });
}
