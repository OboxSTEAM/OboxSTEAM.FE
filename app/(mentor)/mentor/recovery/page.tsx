import type { Metadata } from "next";

import { AssessmentRecoveryQueue } from "@/components/mentors/assessment-recovery-queue";

export const metadata: Metadata = {
  title: "Yêu cầu làm lại",
};

export default function MentorRecoveryPage() {
  return <AssessmentRecoveryQueue />;
}
