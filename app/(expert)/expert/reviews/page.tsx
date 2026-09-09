import type { Metadata } from "next";

import { ExpertReviewQueue } from "@/components/expert/reviews/expert-review-queue";

export const metadata: Metadata = {
  title: "Duyệt chương trình",
};

export default function ExpertReviewsPage() {
  return <ExpertReviewQueue />;
}
