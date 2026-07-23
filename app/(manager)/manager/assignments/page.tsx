import type { Metadata } from "next";

import { AssignmentManager } from "@/components/manager/programs/assignment-manager";

export const metadata: Metadata = {
  title: "Bài tập",
};

export default function ManagerAssignmentsPage() {
  return <AssignmentManager />;
}
