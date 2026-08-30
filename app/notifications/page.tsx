import type { Metadata } from "next";

import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { NotificationsPageContent } from "@/components/notifications/notifications-page-content";

export const metadata: Metadata = {
  title: "Thông báo — OboxSTEAM",
  robots: { index: false, follow: false },
};

export default function NotificationsPage() {
  return (
    <>
      <SiteHeader defaultScrolled />
      <main className="min-h-screen bg-[#FAFAF5] pt-14 sm:pt-16">
        <NotificationsPageContent />
      </main>
      <SiteFooter />
    </>
  );
}
