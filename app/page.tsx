import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { HeroSection } from "@/components/landing/sections/hero-section";
import { PartnerStripSection } from "@/components/landing/sections/partner-strip-section";
import { SteamCategoriesSection } from "@/components/landing/sections/steam-categories-section";
import { UniverseSection } from "@/components/landing/sections/universe-section";
import { ProgramsSection } from "@/components/landing/sections/programs-section";

export default function Home() {
  return (
    <>
      <SiteHeader heroTone="light" />
      <main className="flex flex-col">
        <HeroSection />
        <PartnerStripSection />
        <SteamCategoriesSection />
        <UniverseSection />
        <ProgramsSection />
      </main>
      <SiteFooter />
    </>
  );
}
