import type { Metadata } from "next";

import { MentorClassDetail } from "@/components/mentors/mentor-class-detail";

type MentorClassDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Chi tiết lớp",
};

export default async function MentorClassDetailPage({
  params,
}: MentorClassDetailPageProps) {
  const { id } = await params;
  return <MentorClassDetail classId={id} />;
}
