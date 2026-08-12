import type { AssessmentRecoveryRequest } from "@/lib/api/entities/assessment-recovery-request";
import type { ClassRedeliveryRequest } from "@/lib/api/entities/class-redelivery-request";
import type { ModuleType } from "@/lib/api/entities/module";

export const MAX_DECIDED_RECOVERY_REQUESTS = 2;

export type RecoveryAction =
  | "retry"
  | "request-recovery"
  | "request-redelivery"
  | "wait-recovery"
  | "wait-redelivery-payment"
  | "wait-manager"
  | "none";

export type RecoveryDecisionInput = {
  moduleType: ModuleType;
  attemptNumber: number;
  maxAttempts: number;
  /** Window closed / start rejected for Theory deadline extension. */
  needsDeadlineGrant?: boolean;
  recoveryRequests: AssessmentRecoveryRequest[];
  redeliveryRequests: ClassRedeliveryRequest[];
  moduleEnrollmentId: string;
  assignmentId: string;
};

const OPEN_RECOVERY_STATUSES = new Set(["Pending"]);
const DECIDED_RECOVERY_STATUSES = new Set(["Approved", "Rejected"]);
const OPEN_REDELIVERY_STATUSES = new Set([
  "PendingAutoMatch",
  "MatchedPendingPayment",
  "PendingManager",
  "Approved",
]);

export function countDecidedRecoveries(
  requests: AssessmentRecoveryRequest[],
  moduleEnrollmentId: string,
  assignmentId: string,
): number {
  return requests.filter(
    (request) =>
      request.moduleEnrollmentId === moduleEnrollmentId &&
      request.assignmentId === assignmentId &&
      DECIDED_RECOVERY_STATUSES.has(request.status),
  ).length;
}

export function findOpenRecovery(
  requests: AssessmentRecoveryRequest[],
  moduleEnrollmentId: string,
  assignmentId: string,
): AssessmentRecoveryRequest | null {
  return (
    requests.find(
      (request) =>
        request.moduleEnrollmentId === moduleEnrollmentId &&
        request.assignmentId === assignmentId &&
        OPEN_RECOVERY_STATUSES.has(request.status),
    ) ?? null
  );
}

export function findOpenRedelivery(
  requests: ClassRedeliveryRequest[],
  moduleEnrollmentId: string,
): ClassRedeliveryRequest | null {
  return (
    requests.find(
      (request) =>
        request.moduleEnrollmentId === moduleEnrollmentId &&
        OPEN_REDELIVERY_STATUSES.has(request.status),
    ) ?? null
  );
}

export function resolveRecoveryAction(
  input: RecoveryDecisionInput,
): RecoveryAction {
  const {
    moduleType,
    attemptNumber,
    maxAttempts,
    needsDeadlineGrant = false,
    recoveryRequests,
    redeliveryRequests,
    moduleEnrollmentId,
    assignmentId,
  } = input;

  const openRecovery = findOpenRecovery(
    recoveryRequests,
    moduleEnrollmentId,
    assignmentId,
  );
  if (openRecovery) return "wait-recovery";

  const openRedelivery = findOpenRedelivery(
    redeliveryRequests,
    moduleEnrollmentId,
  );
  if (openRedelivery) {
    if (
      openRedelivery.status === "MatchedPendingPayment" ||
      (openRedelivery.status === "Approved" &&
        openRedelivery.retakeModuleEnrollmentId)
    ) {
      return "wait-redelivery-payment";
    }
    if (
      openRedelivery.status === "PendingManager" ||
      openRedelivery.status === "PendingAutoMatch"
    ) {
      return "wait-manager";
    }
    return "wait-redelivery-payment";
  }

  const attemptsRemaining = Math.max(0, maxAttempts - attemptNumber);
  const decidedCount = countDecidedRecoveries(
    recoveryRequests,
    moduleEnrollmentId,
    assignmentId,
  );

  if (moduleType === "Theory") {
    if (needsDeadlineGrant) {
      return decidedCount < MAX_DECIDED_RECOVERY_REQUESTS
        ? "request-recovery"
        : "none";
    }
    if (attemptsRemaining > 0) return "retry";
    return decidedCount < MAX_DECIDED_RECOVERY_REQUESTS
      ? "request-recovery"
      : "none";
  }

  if (attemptsRemaining > 0) return "retry";

  if (decidedCount < MAX_DECIDED_RECOVERY_REQUESTS) {
    return "request-recovery";
  }

  return "request-redelivery";
}
