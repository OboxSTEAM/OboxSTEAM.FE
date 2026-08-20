import type { Metadata } from "next";

import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { ParentEnrollmentProgressionContent } from "@/components/parent/progression/parent-enrollment-progression-content";

export const metadata: Metadata = {
  title: "Chi tiết chương trình — OboxSTEAM",
  robots: { index: false, follow: false },
};

export default function ParentEnrollmentProgressionPage() {
  return (
    <>
      <SiteHeader defaultScrolled />
      <main className="min-h-screen bg-[#FAFAF5] pt-[4.5rem] sm:pt-20">
        <ParentEnrollmentProgressionContent />
      </main>
      <SiteFooter />
    </>
  );
}
