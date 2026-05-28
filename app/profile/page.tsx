import type { Metadata } from "next";

import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { ProfilePageContent } from "@/components/profile/profile-page-content";

export const metadata: Metadata = {
  title: "Hồ sơ cá nhân — OboxSTEAM",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return (
    <>
      <SiteHeader defaultScrolled />
      <main className="min-h-screen bg-[#FAFAF5] pt-[4.5rem] sm:pt-20">
        <ProfilePageContent />
      </main>
      <SiteFooter />
    </>
  );
}
