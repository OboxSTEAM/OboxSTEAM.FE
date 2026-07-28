"use client";

import { useCallback } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const THEME_FALLBACK_MS = 200;

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => {
    finished: Promise<void>;
  };
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Instant theme flip wrapped in one page-level crossfade (no per-node lag). */
function applyThemeWithTransition(apply: () => void) {
  if (typeof window === "undefined") {
    apply();
    return;
  }

  if (prefersReducedMotion()) {
    apply();
    return;
  }

  const doc = document as ViewTransitionDocument;

  if (typeof doc.startViewTransition === "function") {
    doc.startViewTransition(() => {
      flushSync(() => {
        apply();
      });
    });
    return;
  }

  // Fallback browsers: only animate root surfaces, never every descendant.
  const root = document.documentElement;
  root.classList.add("theme-animating");
  apply();
  window.setTimeout(() => {
    root.classList.remove("theme-animating");
  }, THEME_FALLBACK_MS);
}

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isReady = resolvedTheme != null;
  const isDark = resolvedTheme === "dark";

  const handleToggle = useCallback(() => {
    const next = isDark ? "light" : "dark";
    applyThemeWithTransition(() => {
      setTheme(next);
    });
  }, [isDark, setTheme]);

  if (!isReady) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("size-9 rounded-full", className)}
        aria-label="Chuyển chế độ giao diện"
        disabled
      >
        <span className="size-5" aria-hidden="true" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className={cn("relative size-9 rounded-full", className)}
      aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      title={isDark ? "Chế độ sáng" : "Chế độ tối"}
    >
      <Sun
        className={cn(
          "size-5 transition-[transform,opacity] duration-150 ease-out",
          isDark
            ? "scale-0 rotate-90 opacity-0"
            : "scale-100 rotate-0 opacity-100",
        )}
        aria-hidden="true"
      />
      <Moon
        className={cn(
          "absolute size-5 transition-[transform,opacity] duration-150 ease-out",
          isDark
            ? "scale-100 rotate-0 opacity-100"
            : "scale-0 -rotate-90 opacity-0",
        )}
        aria-hidden="true"
      />
    </Button>
  );
}
