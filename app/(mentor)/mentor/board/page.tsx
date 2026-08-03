import type { Metadata } from "next";

import { MentorAssignmentHub } from "@/components/mentors/mentor-assignment-hub";

export const metadata: Metadata = {
  title: "Đăng ký lớp",
};

export default function MentorBoardPage() {
  return <MentorAssignmentHub />;
}
