import type { Metadata } from "next";

import { MilestoneManager } from "@/components/manager/programs/milestone-manager";

export const metadata: Metadata = {
  title: "Milestone nghiên cứu",
};

export default function ManagerMilestonesPage() {
  return <MilestoneManager />;
}
