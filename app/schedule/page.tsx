import type { Metadata } from "next";

import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { StudentWeeklySchedule } from "@/components/schedule/student-weekly-schedule";

export const metadata: Metadata = {
  title: "Lịch học — OboxSTEAM",
  robots: { index: false, follow: false },
};

export default function StudentSchedulePage() {
  return (
    <>
      <SiteHeader defaultScrolled />
      <main className="min-h-screen bg-[#FAFAF5] pt-[4.5rem] sm:pt-20">
        <StudentWeeklySchedule />
      </main>
      <SiteFooter />
    </>
  );
}
