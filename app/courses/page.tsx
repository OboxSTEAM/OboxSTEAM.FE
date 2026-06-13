import type { Metadata } from "next";

import { MyCoursesPageContent } from "@/components/courses/my-courses-page-content";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

export const metadata: Metadata = {
  title: "Khóa học của tôi — OboxSTEAM",
  robots: { index: false, follow: false },
};

export default function MyCoursesPage() {
  return (
    <>
      <SiteHeader defaultScrolled />
      <main className="min-h-screen bg-[#FAFAF5] pt-[4.5rem] sm:pt-20">
        <MyCoursesPageContent />
      </main>
      <SiteFooter />
    </>
  );
}
