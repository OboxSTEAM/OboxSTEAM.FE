import type { Metadata } from "next";

import { MentorBoardManager } from "@/components/mentors/mentor-board-manager";

export const metadata: Metadata = {
  title: "Bảng lớp",
};

export default function MentorBoardPage() {
  return <MentorBoardManager />;
}
