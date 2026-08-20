import type { Metadata } from "next";

import { ClassRedeliveryQueue } from "@/components/manager/redelivery/class-redelivery-queue";

export const metadata: Metadata = {
  title: "Học lại lớp",
};

export default function ManagerRedeliveryPage() {
  return <ClassRedeliveryQueue />;
}
