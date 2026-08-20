import type { Metadata } from "next";

import { MentorOverview } from "@/components/mentors/mentor-overview";

export const metadata: Metadata = {
  title: "Tổng quan Mentor",
};

export default function MentorIndexPage() {
  return <MentorOverview />;
}
