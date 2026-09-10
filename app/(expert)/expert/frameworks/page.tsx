import type { Metadata } from "next";

import { ExpertFrameworkManager } from "@/components/expert/frameworks/expert-framework-manager";

export const metadata: Metadata = {
  title: "Bộ khung thẩm định",
};

export default function ExpertFrameworksPage() {
  return <ExpertFrameworkManager />;
}
