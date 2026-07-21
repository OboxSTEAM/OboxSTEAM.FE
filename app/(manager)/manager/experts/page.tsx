import type { Metadata } from "next";

import { ExpertManager } from "@/components/manager/experts/expert-manager";

export const metadata: Metadata = {
  title: "Chuyên gia",
};

export default function ManagerExpertsPage() {
  return <ExpertManager />;
}
