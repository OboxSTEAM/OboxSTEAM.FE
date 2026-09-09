import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ExpertShell } from "@/components/expert/layout/expert-shell";

export const metadata: Metadata = {
  title: {
    template: "%s — Chuyên gia | OboxSTEAM",
    default: "Duyệt chương trình — OboxSTEAM",
  },
  robots: { index: false, follow: false },
};

export default function ExpertLayout({ children }: { children: ReactNode }) {
  return <ExpertShell>{children}</ExpertShell>;
}
