import type { Metadata } from "next";

import { MentorManager } from "@/components/manager/mentors/mentor-manager";

export const metadata: Metadata = {
  title: "Mentor",
};

export default function ManagerMentorsPage() {
  return <MentorManager />;
}
