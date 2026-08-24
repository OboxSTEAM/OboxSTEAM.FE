import type { Metadata } from "next";

import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { PortfolioSettingsPageContent } from "@/components/portfolio/portfolio-settings-page-content";

export const metadata: Metadata = {
  title: "Portfolio — OboxSTEAM",
  robots: { index: false, follow: false },
};

export default function PortfolioPage() {
  return (
    <>
      <SiteHeader defaultScrolled />
      <main className="min-h-screen bg-background pt-14 sm:pt-16">
        <PortfolioSettingsPageContent />
      </main>
      <SiteFooter />
    </>
  );
}
