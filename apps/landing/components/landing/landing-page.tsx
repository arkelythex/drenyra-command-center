"use client";

import type { ReactElement } from "react";

import { Navbar } from "@/components/navbar";
import { LandingHero } from "@/components/sections/hero";
import { TrustBar } from "@/components/sections/trust-bar";
import { WhyItExists } from "@/components/sections/why-it-exists";
import { SocialProof } from "@/components/sections/social-proof";
import { ClientLogos } from "@/components/sections/client-logos";
import { RequestAccess } from "@/components/sections/request-access";
import { Footer } from "@/components/layout/footer";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { SectionDivider } from "@/components/ui/section-divider";
import { CustomCursor } from "@/components/ui/custom-cursor";
import { SectionVisibilityTracker } from "@/components/ui/section-visibility-tracker";
import { BRAND_HOME_COPY } from "@/lib/landing/copy/brand-home";
import { SectionErrorBoundary } from "@/components/ui/section-error-boundary";

export function LandingPage(): ReactElement {
  const { stats } = BRAND_HOME_COPY;

  return (
    <>
      <ScrollProgress />
      <CustomCursor />
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="relative min-h-screen bg-background text-foreground outline-none selection:bg-foreground/20 selection:text-foreground"
      >
        {/* Section visibility analytics */}
        <SectionVisibilityTracker sectionId="trust-bar" />
        <SectionVisibilityTracker sectionId="why-it-exists" />
        <SectionVisibilityTracker sectionId="social-proof" />
        <SectionVisibilityTracker sectionId="request-access" />

        <SectionErrorBoundary sectionName="hero">
          <LandingHero />
        </SectionErrorBoundary>

        <SectionDivider variant="line" className="oled-section-fade" />

        <SectionErrorBoundary sectionName="trust-bar">
          <TrustBar />
        </SectionErrorBoundary>

        <SectionDivider variant="line" className="oled-section-fade" />

        {/* Mission — editorial, centered, massive whitespace */}
        <section id="stats" className="scroll-mt-28 py-32 md:py-40" aria-label="Misión">
          <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-10">
            <ScrollReveal>
              <h2 className="sr-only">Misión de Arkelythex</h2>
              <p className="text-[clamp(1.75rem,4vw,3.25rem)] font-semibold leading-[1.15] tracking-tight text-foreground text-balance">
                {stats.mission}
              </p>
            </ScrollReveal>
          </div>
        </section>

        <SectionDivider variant="line" className="oled-section-fade" />

        <SectionErrorBoundary sectionName="why-it-exists">
          <WhyItExists />
        </SectionErrorBoundary>

        <SectionDivider variant="line" className="oled-section-fade" />

        <SectionErrorBoundary sectionName="social-proof">
          <SocialProof />
        </SectionErrorBoundary>

        <SectionDivider variant="line" className="oled-section-fade" />

        <SectionErrorBoundary sectionName="client-logos">
          <ClientLogos />
        </SectionErrorBoundary>

        <SectionDivider variant="line" className="oled-section-fade" />

        <SectionErrorBoundary sectionName="request-access">
          <RequestAccess />
        </SectionErrorBoundary>

        <Footer showConversionBanner={false} showEcosystemRail={false} />
      </main>
    </>
  );
}
