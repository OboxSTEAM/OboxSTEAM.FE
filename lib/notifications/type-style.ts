import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  Link2,
  Repeat,
  Sparkles,
  User,
  Users,
  Video,
} from "lucide-react";

import type { NotificationType } from "@/lib/api/entities/notification";

export type NotificationTypeGroup =
  | "account"
  | "parentLink"
  | "payment"
  | "progress"
  | "class"
  | "session"
  | "attendance"
  | "recovery"
  | "redelivery"
  | "grading"
  | "media"
  | "highlight"
  | "other";

type TypeStyle = {
  group: NotificationTypeGroup;
  icon: LucideIcon;
  iconClassName: string;
  wrapClassName: string;
};

const STYLE: Record<NotificationTypeGroup, Omit<TypeStyle, "group">> = {
  account: {
    icon: User,
    wrapClassName: "bg-[#F5F5F0] text-[#6B6B6B]",
    iconClassName: "text-[#6B6B6B]",
  },
  parentLink: {
    icon: Link2,
    wrapClassName: "bg-[#E8F7FD] text-[#0277BD]",
    iconClassName: "text-[#0277BD]",
  },
  payment: {
    icon: CreditCard,
    wrapClassName: "bg-[#FFF0EE] text-[#B71C1C]",
    iconClassName: "text-[#E94B3C]",
  },
  progress: {
    icon: GraduationCap,
    wrapClassName: "bg-[#7CB342]/15 text-[#3d5c22]",
    iconClassName: "text-[#7CB342]",
  },
  class: {
    icon: Users,
    wrapClassName: "bg-[#E8F7FD] text-[#0277BD]",
    iconClassName: "text-[#4FC3F7]",
  },
  session: {
    icon: CalendarDays,
    wrapClassName: "bg-[#E8F7FD] text-[#0277BD]",
    iconClassName: "text-[#0277BD]",
  },
  attendance: {
    icon: CheckCircle2,
    wrapClassName: "bg-[#7CB342]/15 text-[#3d5c22]",
    iconClassName: "text-[#7CB342]",
  },
  recovery: {
    icon: Repeat,
    wrapClassName: "bg-[#FFF8E1] text-[#8A7200]",
    iconClassName: "text-[#FDD835]",
  },
  redelivery: {
    icon: Repeat,
    wrapClassName: "bg-[#FFF8E1] text-[#8A7200]",
    iconClassName: "text-[#8A7200]",
  },
  grading: {
    icon: ClipboardCheck,
    wrapClassName: "bg-[#EDE7F6] text-[#5E35B1]",
    iconClassName: "text-[#7E57C2]",
  },
  media: {
    icon: Video,
    wrapClassName: "bg-[#FFF8E1] text-[#8A7200]",
    iconClassName: "text-[#FDD835]",
  },
  highlight: {
    icon: Sparkles,
    wrapClassName: "bg-[#FFF8E1] text-[#8A7200]",
    iconClassName: "text-[#FDD835]",
  },
  other: {
    icon: Bell,
    wrapClassName: "bg-[#F5F5F0] text-[#6B6B6B]",
    iconClassName: "text-[#6B6B6B]",
  },
};

const TYPE_GROUP: Record<NotificationType, NotificationTypeGroup> = {
  AccountRegistered: "account",
  EmailVerified: "account",
  PasswordChanged: "account",
  ParentLinkRequested: "parentLink",
  ParentLinkVerified: "parentLink",
  ParentLinkApproved: "parentLink",
  ProgramPendingPayment: "payment",
  ProgramActivated: "progress",
  ProgramWithdrawn: "progress",
  ModuleCompleted: "progress",
  ModuleFailed: "progress",
  ModuleUnlocked: "progress",
  ModuleRetakePendingPayment: "payment",
  ModuleRetakeInitiated: "redelivery",
  PendingPaymentExpired: "payment",
  ActivityCompleted: "progress",
  PaymentSucceeded: "payment",
  PaymentFailed: "payment",
  PaymentCancelled: "payment",
  ParentPaymentRequested: "payment",
  ParentModuleRetakeRequested: "payment",
  ClassCreated: "class",
  ClassUpdated: "class",
  ClassOpenForEnrollment: "class",
  ClassStarted: "class",
  ClassAutoStarted: "class",
  ClassCompleted: "class",
  ClassMentorRequestSubmitted: "class",
  ClassMentorRequestApproved: "class",
  ClassMentorRequestRejected: "class",
  AssessmentRecoveryRequested: "recovery",
  AssessmentRecoveryApproved: "recovery",
  AssessmentRecoveryRejected: "recovery",
  ClassRedeliveryPendingManager: "redelivery",
  ClassRedeliveryMatchedPendingPayment: "redelivery",
  ClassRedeliveryRejected: "redelivery",
  ClassRedeliveryCompleted: "redelivery",
  ClassRedeliveryWithdrawn: "redelivery",
  ClassRedeliveryAwaitingSelection: "redelivery",
  ClassRedeliveryIntensiveOffered: "redelivery",
  ClassRedeliveryCandidatesAvailable: "redelivery",
  ClassEnrolled: "class",
  ClassTransferred: "class",
  ClassSessionScheduled: "session",
  ClassSessionRescheduled: "session",
  ClassSessionStarted: "session",
  ClassSessionCompleted: "session",
  ClassSessionCancelled: "session",
  SessionStartingSoon: "session",
  AttendanceMarkedPresent: "attendance",
  AttendanceMarkedLate: "attendance",
  AttendanceMarkedAbsent: "attendance",
  AttendanceMarkedExcused: "attendance",
  QuizPassed: "grading",
  QuizFailed: "grading",
  ResearchGradedPassed: "grading",
  ResearchGradedFailed: "grading",
  ResearchReturnedForRevision: "grading",
  ResearchSubmissionOpened: "grading",
  ResearchWorkSubmitted: "grading",
  MediaVideoReady: "media",
  MediaProcessingFailed: "media",
  MediaAiTaggingFailed: "media",
  MediaTagsProcessed: "media",
  HighlightVideoGenerationQueued: "highlight",
  HighlightVideoReady: "highlight",
  HighlightVideoGenerationFailed: "highlight",
  AssignmentPublished: "grading",
  MaterialUpdated: "progress",
  AssignmentEditedByMentor: "grading",
  ClassQuizSetEditedByMentor: "grading",
};

export function getNotificationTypeStyle(type: NotificationType): TypeStyle {
  const group = TYPE_GROUP[type] ?? "other";
  return { group, ...STYLE[group] };
}
