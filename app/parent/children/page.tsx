import type { Metadata } from "next";

import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { ParentChildrenPageContent } from "@/components/parent/parent-children-page-content";

export const metadata: Metadata = {
  title: "Thông tin con — OboxSTEAM",
  robots: { index: false, follow: false },
};

export default function ParentChildrenPage() {
  return (
    <>
      <SiteHeader defaultScrolled />
      <main className="min-h-screen bg-[#FAFAF5] pt-[4.5rem] sm:pt-20">
        <ParentChildrenPageContent />
      </main>
      <SiteFooter />
    </>
  );
}
