import type { Metadata } from "next";

import { ExpertAdvisoryHome } from "@/components/expert/programs/expert-advisory-home";

export const metadata: Metadata = {
  title: "Chương trình phụ trách",
};

export default function ExpertProgramsPage() {
  return <ExpertAdvisoryHome />;
}
