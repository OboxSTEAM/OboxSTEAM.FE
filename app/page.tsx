import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { HeroSection } from "@/components/landing/sections/hero-section";
import { SteamStripSection } from "@/components/landing/sections/steam-strip-section";
import { TrustSection } from "@/components/landing/sections/trust-section";
import { CategoryCardsSection } from "@/components/landing/sections/category-cards-section";
import { HowItWorksSection } from "@/components/landing/sections/how-it-works-section";
import { UniverseSection } from "@/components/landing/sections/universe-section";
import { ProgramsSection } from "@/components/landing/sections/programs-section";
import { StatsSection } from "@/components/landing/sections/stats-section";
import { PortfolioShowcaseSection } from "@/components/landing/sections/portfolio-showcase-section";
import { RolesSection } from "@/components/landing/sections/roles-section";
import { TestimonialsSection } from "@/components/landing/sections/testimonials-section";
import { FinalCtaSection } from "@/components/landing/sections/final-cta-section";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-col">
        {/* Act 1 — Cream */}
        <HeroSection />
        <SteamStripSection />
        <TrustSection />
        <CategoryCardsSection />
        <HowItWorksSection />

        {/* Act 2 — Charcoal cinematic */}
        <UniverseSection />

        {/* Lower sections — back to cream */}
        <ProgramsSection />
        <StatsSection />
        <PortfolioShowcaseSection />
        <RolesSection />
        <TestimonialsSection />
        <FinalCtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
