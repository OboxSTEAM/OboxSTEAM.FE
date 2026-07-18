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
  | "programs.reviews"
  | "programs.expert"
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
