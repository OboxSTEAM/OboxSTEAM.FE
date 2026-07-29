import type { Metadata } from "next";

import { MentorClassManager } from "@/components/mentors/mentor-class-manager";

export const metadata: Metadata = {
  title: "Lớp của tôi",
};

export default function MentorClassesPage() {
  return <MentorClassManager />;
}
