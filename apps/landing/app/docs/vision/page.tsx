"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  DocSection,
  DocCard,
  DocGrid,
  PageHeader,
  SectionTitle,
  StatCard,
  IconBox,
  Badge,
} from "@/components/docs/ui";

import {
  visionHeader,
  visionQuote,
  visionPillars,
  futureMilestones,
  techVision,
  impactAreas,
  impactStats,
  ctaData,
} from "@/lib/data/docs/vision";

import { Lightbulb, Clock, Rocket, Heart, Target } from "lucide-react";

// ============================================================================
// FEATURE COMPONENTS
// ============================================================================

function QuoteSection() {
  return (
    <DocCard variant="outline" className="border-accent/25 relative overflow-hidden">
      <div className="relative z-10 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <IconBox icon={Lightbulb} variant="accent" />
          <h2 className="text-2xl font-bold text-white">Nuestra Visión de Transformación</h2>
        </div>
        
        <blockquote className="text-xl text-foreground/90 leading-relaxed border-l-4 border-accent pl-6 italic">
          {visionQuote.text}
        </blockquote>
        
        <div className="mt-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-foreground/10" />
          <div>
            <div className="text-sm font-semibold text-white">{visionQuote.author}</div>
            <div className="text-xs text-muted-foreground">{visionQuote.role}</div>
          </div>
        </div>
      </div>
    </DocCard>
  );
}

function VisionPillars() {
  return (
    <DocGrid cols={3}>
      {visionPillars.map((pillar) => (
        <DocCard key={pillar.id} variant="gradient" className="group">
          <IconBox icon={pillar.icon} variant="accent" className="mb-4" />
          <h3 className="text-xl font-bold text-white mb-3">{pillar.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
          <div className="mt-4 pt-4 border-t border-foreground/10">
            <div className="text-xs text-accent font-semibold">Meta {pillar.year}: {pillar.target}</div>
          </div>
        </DocCard>
      ))}
    </DocGrid>
  );
}

function Milestones() {
  return (
    <div className="space-y-6">
      {futureMilestones.map((milestone, i) => (
        <div key={i} className="flex gap-6 p-6 rounded-2xl bg-foreground/5 border border-foreground/10 hover:bg-foreground/15 transition-all">
          <div className="flex-shrink-0 w-24 text-center">
            <div className="text-2xl font-black text-accent">{milestone.year}</div>
            <div className="w-full h-px bg-accent/30 mt-2" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">{milestone.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{milestone.description}</p>
            <div className="text-xs text-accent/80 font-medium">{milestone.metrics}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TechVision() {
  return (
    <DocGrid cols={2}>
      {techVision.map((tech, i) => (
        <DocCard key={i} variant="gradient">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <IconBox icon={tech.icon} variant="accent" size="sm" />
            {tech.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{tech.description}</p>
        </DocCard>
      ))}
    </DocGrid>
  );
}

function ImpactSection() {
  return (
    <DocCard variant="gradient">
      <DocGrid cols={3}>
        {impactAreas.map((area, i) => (
          <div key={i} className="space-y-3">
            <IconBox icon={area.icon} variant="accent" />
            <h3 className="text-lg font-bold text-white">{area.title}</h3>
            <p className="text-sm text-muted-foreground">{area.description}</p>
          </div>
        ))}
      </DocGrid>

      <div className="mt-8 pt-8 border-t border-foreground/10">
        <DocGrid cols={4}>
          {impactStats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </DocGrid>
      </div>
    </DocCard>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function VisionPage() {
  return (
    <div className="space-y-16">
      {/* Header */}
      <PageHeader {...visionHeader} />

      {/* Quote */}
      <DocSection>
        <QuoteSection />
      </DocSection>

      {/* Three Pillars */}
      <DocSection>
        <SectionTitle icon={Target} title="Los Tres Pilares de Nuestra Visión" />
        <VisionPillars />
      </DocSection>

      {/* Milestones */}
      <DocSection>
        <div className="flex items-center justify-between mb-6">
          <SectionTitle icon={Clock} title="Hitos 2026" variant="accent" />
          <Link href="/docs/roadmap" className="text-xs text-accent hover:text-foreground transition-colors flex items-center gap-1">
            Ver roadmap completo <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <Milestones />
      </DocSection>

      {/* Technology Vision */}
      <DocSection>
        <SectionTitle icon={Rocket} title="Visión Tecnológica" variant="accent" />
        <TechVision />
      </DocSection>

      {/* Impact */}
      <DocSection>
        <SectionTitle icon={Heart} title="Impacto Social" variant="accent" />
        <ImpactSection />
      </DocSection>

      {/* CTA */}
      <DocCard variant="outline" className="border-accent/30 text-center space-y-6">
        <Badge variant="accent">
          <ctaData.badge.icon className="w-3 h-3" />
          {ctaData.badge.text}
        </Badge>
        <h2 className="text-3xl font-bold text-white">{ctaData.title}</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">{ctaData.description}</p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link href={ctaData.primaryAction.href} className="flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-primary transition-colors group">
            <ctaData.primaryAction.icon className="w-4 h-4" />
            {ctaData.primaryAction.text}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href={ctaData.secondaryAction.href} className="flex items-center gap-2 px-8 py-4 border border-foreground/20 text-foreground font-semibold rounded-full hover:bg-foreground/5 transition-colors">
            <ctaData.secondaryAction.icon className="w-4 h-4" />
            {ctaData.secondaryAction.text}
          </Link>
        </div>
      </DocCard>
    </div>
  );
}
