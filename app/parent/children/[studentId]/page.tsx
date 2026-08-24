import type { Metadata } from "next";

import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { ParentChildProgressionContent } from "@/components/parent/progression/parent-child-progression-content";

export const metadata: Metadata = {
  title: "Tiến độ học viên — OboxSTEAM",
  robots: { index: false, follow: false },
};

export default function ParentChildProgressionPage() {
  return (
    <>
      <SiteHeader defaultScrolled />
      <main className="min-h-screen bg-[#FAFAF5] pt-14 sm:pt-16">
        <ParentChildProgressionContent />
      </main>
      <SiteFooter />
    </>
  );
}
