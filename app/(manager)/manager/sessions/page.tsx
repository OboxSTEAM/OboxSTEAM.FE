import type { Metadata } from "next";

import { SessionManager } from "@/components/manager/classes/session-manager";

export const metadata: Metadata = {
  title: "Lịch học",
};

export default function ManagerSessionsPage() {
  return <SessionManager />;
}
