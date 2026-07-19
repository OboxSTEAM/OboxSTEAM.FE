import type { Metadata } from "next";

import { ClassManager } from "@/components/manager/classes/class-manager";

export const metadata: Metadata = {
  title: "Lớp học",
};

export default function ManagerClassesPage() {
  return <ClassManager />;
}
