import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MentorShell } from "@/components/mentor/layout/mentor-shell";

export const metadata: Metadata = {
  title: {
    template: "%s — Mentor | OboxSTEAM",
    default: "Mentor — OboxSTEAM",
  },
  robots: { index: false, follow: false },
};

export default function MentorLayout({ children }: { children: ReactNode }) {
  return <MentorShell>{children}</MentorShell>;
}
