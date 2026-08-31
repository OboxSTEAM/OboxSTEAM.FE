import { cn } from "@/lib/utils";

export type SessionJoinVariant = "learn" | "app";

export function joinPanelMessageClass(variant: SessionJoinVariant): string {
  return variant === "learn"
    ? "rounded-xl border border-learn-border bg-learn-surface-2 px-4 py-3 text-sm text-learn-muted"
    : "rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground";
}

export function joinPanelDashedMessageClass(variant: SessionJoinVariant): string {
  return variant === "learn"
    ? "rounded-xl border border-dashed border-learn-border bg-learn-surface-2 px-4 py-3 text-sm text-learn-muted"
    : "rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground";
}

export function joinCountdownHeroClass(
  variant: SessionJoinVariant,
  tone: "locked" | "soon",
): string {
  const isSoon = tone === "soon";
  if (variant === "learn") {
    return cn(
      "overflow-hidden rounded-2xl border px-4 py-5 sm:px-5",
      isSoon
        ? "border-learn-accent/40 bg-learn-accent/10"
        : "border-learn-accent/25 bg-learn-surface",
    );
  }
  return cn(
    "overflow-hidden rounded-2xl border px-4 py-5 sm:px-5",
    isSoon
      ? "border-accent/40 bg-accent/10"
      : "border-accent/25 bg-muted/30",
  );
}

export function joinCountdownCellClass(
  variant: SessionJoinVariant,
  tone: "locked" | "soon",
): string {
  const isSoon = tone === "soon";
  if (variant === "learn") {
    return cn(
      "rounded-2xl border px-2 py-3 text-center sm:px-3 sm:py-4",
      isSoon
        ? "border-learn-accent/30 bg-learn-surface shadow-[0_8px_24px_rgba(79,195,247,0.18)]"
        : "border-learn-border bg-learn-surface-2",
    );
  }
  return cn(
    "rounded-2xl border px-2 py-3 text-center sm:px-3 sm:py-4",
    isSoon
      ? "border-accent/30 bg-card shadow-[0_8px_24px_rgba(79,195,247,0.18)]"
      : "border-border bg-card",
  );
}

export function joinCountdownTitleClass(variant: SessionJoinVariant): string {
  return variant === "learn"
    ? "text-center text-xs font-semibold uppercase tracking-[0.14em] text-learn-muted"
    : "text-center text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground";
}

export function joinCountdownNumberClass(variant: SessionJoinVariant): string {
  return variant === "learn"
    ? "font-heading text-3xl font-extrabold tabular-nums leading-none tracking-tight text-learn-text-strong sm:text-4xl"
    : "font-heading text-3xl font-extrabold tabular-nums leading-none tracking-tight text-foreground sm:text-4xl";
}

export function joinCountdownUnitLabelClass(variant: SessionJoinVariant): string {
  return variant === "learn"
    ? "mt-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-learn-muted"
    : "mt-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
}

export function joinCountdownHintClass(variant: SessionJoinVariant): string {
  return variant === "learn"
    ? "mt-4 text-center text-sm text-learn-muted"
    : "mt-4 text-center text-sm text-muted-foreground";
}

export function joinCountdownColonClass(variant: SessionJoinVariant): string {
  return variant === "learn"
    ? "hidden self-center font-heading text-2xl font-extrabold text-learn-faint sm:inline"
    : "hidden self-center font-heading text-2xl font-extrabold text-muted-foreground/40 sm:inline";
}

export function recordingLinkClass(variant: SessionJoinVariant): string {
  return variant === "learn"
    ? "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-learn-border bg-learn-surface px-4 py-3 text-sm font-semibold text-learn-text-strong hover:bg-learn-surface-2"
    : "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/50";
}

export function idleJoinButtonClass(variant: SessionJoinVariant): string {
  return variant === "learn"
    ? "inline-flex h-auto w-full items-center justify-center gap-2 rounded-2xl bg-learn-accent px-4 py-3.5 text-base font-semibold text-white hover:opacity-90"
    : "inline-flex h-auto w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3.5 text-base font-semibold text-accent-foreground hover:opacity-90";
}
