const HIGHLIGHT_MS = 1800;

/** Scroll a rendered chat message into view and flash it; `false` when it isn't loaded. */
export function focusDiscussionMessage(messageId: string): boolean {
  const element = document.querySelector<HTMLElement>(
    `[data-message-id="${CSS.escape(messageId)}"]`,
  );
  if (!element) return false;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView({ block: "center", behavior: prefersReducedMotion ? "auto" : "smooth" });
  element.setAttribute("data-highlighted", "");
  window.setTimeout(() => element.removeAttribute("data-highlighted"), HIGHLIGHT_MS);
  return true;
}
