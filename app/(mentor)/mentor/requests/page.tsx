import type { Metadata } from "next";

import { MyClassMentorRequests } from "@/components/mentors/my-class-mentor-requests";

export const metadata: Metadata = {
  title: "Yêu cầu của tôi",
};

export default function MentorRequestsPage() {
  return <MyClassMentorRequests />;
}
