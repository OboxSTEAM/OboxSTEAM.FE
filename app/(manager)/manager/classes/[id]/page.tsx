import type { Metadata } from "next";

import { ClassDetail } from "@/components/manager/classes/class-detail";

type ManagerClassDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Chi tiết lớp",
};

export default async function ManagerClassDetailPage({
  params,
}: ManagerClassDetailPageProps) {
  const { id } = await params;
  return <ClassDetail classId={id} />;
}
