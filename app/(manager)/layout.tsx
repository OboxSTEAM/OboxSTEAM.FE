import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ManagerShell } from "@/components/manager/layout/manager-shell";

export const metadata: Metadata = {
  title: {
    template: "%s — Manager | OboxSTEAM",
    default: "Manager Dashboard — OboxSTEAM",
  },
  robots: { index: false, follow: false },
};

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return <ManagerShell>{children}</ManagerShell>;
}
