import type { Metadata } from "next";

import { RedeliveryWaitlist } from "@/components/manager/redelivery/redelivery-waitlist";

export const metadata: Metadata = {
  title: "Học lại lớp",
};

export default function ManagerRedeliveryPage() {
  return <RedeliveryWaitlist />;
}
