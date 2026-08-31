import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SessionScheduleShellProps = {
  mode: "online" | "offline";
  children: ReactNode;
  className?: string;
};

/** Warm session block on the learn page — online gets the peach gradient frame. */
export function SessionScheduleShell({
  mode,
  children,
  className,
}: SessionScheduleShellProps) {
  if (mode === "online") {
    return (
      <div
        className={cn(
          "space-y-3 rounded-2xl border border-[#E8A87C]/35 bg-gradient-to-b from-[#E8A87C]/10 to-transparent p-4 sm:p-5",
          className,
        )}
      >
        {children}
      </div>
    );
  }

  return <div className={cn("space-y-3", className)}>{children}</div>;
}
