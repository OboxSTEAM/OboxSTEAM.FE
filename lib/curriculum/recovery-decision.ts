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
  | "select-class"
  | "none";

export type RecoveryDecisionInput = {
  moduleType: ModuleType;
  attemptNumber: number;
  maxAttempts: number;
  /** Window closed / start rejected for Theory deadline extension. */
  needsDeadlineGrant?: boolean;
  recoveryRequests: AssessmentRecoveryRequest[];
  redeliveryRequests: ClassRedeliveryRequest[];
  moduleEnrollmentId: string | null;
  assignmentId: string;
};

const OPEN_RECOVERY_STATUSES = new Set(["Pending"]);
const DECIDED_RECOVERY_STATUSES = new Set(["Approved", "Rejected"]);
/** Live continuity statuses — ignore deprecated waitlist/intensive values. */
const OPEN_REDELIVERY_STATUSES = new Set([
  "MatchedPendingPayment",
  "Approved",
  "AwaitingClassSelection",
]);

export function countDecidedRecoveries(
  requests: AssessmentRecoveryRequest[],
  moduleEnrollmentId: string | null,
  assignmentId: string,
): number {
  if (!moduleEnrollmentId) return 0;

  return requests.filter(
    (request) =>
      request.moduleEnrollmentId === moduleEnrollmentId &&
      request.assignmentId === assignmentId &&
      DECIDED_RECOVERY_STATUSES.has(request.status),
  ).length;
}

/** Base maxAttempts plus mentor-granted extras from Approved recovery requests. */
export function getEffectiveMaxAttempts(
  maxAttempts: number,
  recoveryRequests: AssessmentRecoveryRequest[],
  moduleEnrollmentId: string | null,
  assignmentId: string,
): number {
  if (!moduleEnrollmentId) return maxAttempts;

  const granted = recoveryRequests
    .filter(
      (request) =>
        request.moduleEnrollmentId === moduleEnrollmentId &&
        request.assignmentId === assignmentId &&
        request.status === "Approved",
    )
    .reduce((sum, request) => sum + Math.max(0, request.extraAttemptsGranted), 0);

  return maxAttempts + granted;
}

export function hasAttemptsRemaining(
  attemptNumber: number,
  maxAttempts: number,
  recoveryRequests: AssessmentRecoveryRequest[],
  moduleEnrollmentId: string | null,
  assignmentId: string,
): boolean {
  return (
    getAttemptsRemaining(
      attemptNumber,
      maxAttempts,
      recoveryRequests,
      moduleEnrollmentId,
      assignmentId,
    ) > 0
  );
}

/** How many free attempts remain after the current `attemptNumber`. */
export function getAttemptsRemaining(
  attemptNumber: number,
  maxAttempts: number,
  recoveryRequests: AssessmentRecoveryRequest[],
  moduleEnrollmentId: string | null,
  assignmentId: string,
): number {
  const effectiveMax = getEffectiveMaxAttempts(
    maxAttempts,
    recoveryRequests,
    moduleEnrollmentId,
    assignmentId,
  );
  return Math.max(0, effectiveMax - attemptNumber);
}

export function findOpenRecovery(
  requests: AssessmentRecoveryRequest[],
  moduleEnrollmentId: string | null,
  assignmentId: string,
): AssessmentRecoveryRequest | null {
  if (!moduleEnrollmentId) return null;

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
  moduleEnrollmentId: string | null,
): ClassRedeliveryRequest | null {
  if (!moduleEnrollmentId) return null;

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
    if (openRedelivery.status === "AwaitingClassSelection") {
      return "select-class";
    }
    if (
      openRedelivery.status === "MatchedPendingPayment" ||
      (openRedelivery.status === "Approved" &&
        openRedelivery.retakeModuleEnrollmentId)
    ) {
      return "wait-redelivery-payment";
    }
    return "wait-redelivery-payment";
  }

  const effectiveMaxAttempts = getEffectiveMaxAttempts(
    maxAttempts,
    recoveryRequests,
    moduleEnrollmentId,
    assignmentId,
  );
  const attemptsRemaining = Math.max(0, effectiveMaxAttempts - attemptNumber);
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
