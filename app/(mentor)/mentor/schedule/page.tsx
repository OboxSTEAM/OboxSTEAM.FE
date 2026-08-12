import type { Metadata } from "next";

import { MentorScheduleOverview } from "@/components/mentors/mentor-schedule-overview";

export const metadata: Metadata = {
  title: "Lịch học",
};

export default function MentorSchedulePage() {
  return <MentorScheduleOverview />;
}
