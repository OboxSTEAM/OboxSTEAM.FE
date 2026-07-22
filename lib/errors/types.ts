/** Structured error for toasts and inline UI — title / reason / action. */
export type AppErrorState = {
  /** What happened (headline). */
  title: string;
  /** Why it happened (cause). */
  reason: string;
  /** What the user should do next. */
  action: string;
};

export type AppSuccessState = {
  title: string;
  description?: string;
};

export type AppErrorContext =
  | "generic"
  | "auth.login"
  | "auth.register"
  | "auth.verify-otp"
  | "auth.forgot-password"
  | "auth.reset-password"
  | "account.profile"
  | "account.update-profile"
  | "account.upload-avatar"
  | "parent.request-link"
  | "parent.magic-login"
  | "parent.complete-profile"
  | "parent.approve-link"
  | "parent.links"
  | "student.links"
  | "programs.list"
  | "programs.detail"
  | "programs.create"
  | "programs.update"
  | "programs.delete"
  | "programs.reviews"
  | "programs.reviews.delete"
  | "programs.expert"
  | "experts.list"
  | "experts.create"
  | "experts.update"
  | "experts.delete"
  | "classes.list"
  | "classes.detail"
  | "classes.create"
  | "classes.update"
  | "classes.lifecycle"
  | "classMentorRequests.list"
  | "classMentorRequests.approve"
  | "classMentorRequests.reject"
  | "mentors.detail"
  | "classSessions.list"
  | "classSessions.create"
  | "classSessions.update"
  | "classSessions.delete"
  | "attendance.list"
  | "attendance.update"
  | "curriculum.module.save"
  | "curriculum.course.save"
  | "curriculum.activity.save"
  | "curriculum.material.save"
  | "curriculum.material.delete"
  | "curriculum.assignment.save"
  | "curriculum.milestone.save"
  | "curriculum.milestone.link"
  | "curriculum.questionBank.save"
  | "curriculum.questionBank.delete"
  | "curriculum.questionBank.import"
  | "curriculum.node.delete"
  | "payments.checkout"
  | "payments.detail"
  | "payments.cancel"
  | "payments.request-parent"
  | "payments.parent-checkout"
  | "enrollments.list"
  | "research.upload"
  | "research.submit"
  | "portfolio.load"
  | "portfolio.create"
  | "portfolio.update"
  | "portfolio.subdomain"
  | "portfolio.publish"
  | "portfolio.item"
  | "portfolio.reorder"
  | "portfolio.sync"
  | "portfolio.public"
  | "portfolio.media"
  | "portfolio.section";
