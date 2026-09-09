import type { Metadata } from "next";

import { ExpertFrameworkManager } from "@/components/expert/frameworks/expert-framework-manager";

export const metadata: Metadata = {
  title: "Khung chương trình",
};

export default function ExpertFrameworksPage() {
  return <ExpertFrameworkManager />;
}
