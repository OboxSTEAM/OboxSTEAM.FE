import type { Metadata } from "next";

import { ExpertScheduleManager } from "@/components/expert/schedule/expert-schedule-manager";

export const metadata: Metadata = {
  title: "Lịch đồng hành",
};

export default function ExpertSchedulePage() {
  return <ExpertScheduleManager />;
}
