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
  FeatureCard,
  StatCard,
  IconBox,
  Badge,
} from "@/components/docs/ui";

import {
  sovereignHeader,
  coreStats,
  coreFeatures,
  architectureSections,
  performanceMetrics,
  privacyPrinciples,
  comparisonTable,
  sovereignCta,
} from "@/lib/data/docs/sovereign-core";

import { Shield, Cpu, Gauge, Lock, Sparkles } from "lucide-react";

// ============================================================================
// STATS SECTION
// ============================================================================

function CoreStats() {
  return (
    <DocGrid cols={4}>
      {coreStats.map((stat, i) => (
        <StatCard key={i} {...stat} />
      ))}
    </DocGrid>
  );
}

// ============================================================================
// FEATURES GRID
// ============================================================================

function CoreFeatures() {
  return (
    <DocGrid cols={3}>
      {coreFeatures.map((feature, i) => (
        <FeatureCard
          key={i}
          title={feature.title}
          description={feature.description}
          icon={feature.icon}
          variant="accent"
        />
      ))}
    </DocGrid>
  );
}

// ============================================================================
// ARCHITECTURE SECTIONS
// ============================================================================

function ArchitectureDeepDive() {
  return (
    <DocGrid cols={2}>
      {architectureSections.map((section, i) => (
        <DocCard key={i} variant="gradient">
          <div className="flex items-center gap-3 mb-4">
            <IconBox icon={section.icon} variant="accent" />
            <h3 className="text-xl font-bold text-white">{section.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {section.description}
          </p>
          <ul className="space-y-2">
            {section.features.map((feature, j) => (
              <li key={j} className="flex items-center gap-2 text-sm text-foreground/80">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                {feature}
              </li>
            ))}
          </ul>
        </DocCard>
      ))}
    </DocGrid>
  );
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

function PerformanceMetrics() {
  return (
    <DocCard variant="outline" className="border-accent/25">
      <DocGrid cols={4}>
        {performanceMetrics.map((metric, i) => (
          <div key={i} className="text-center p-4">
            <div className="text-3xl font-black text-accent mb-1">{metric.metric}</div>
            <div className="text-sm font-semibold text-white">{metric.label}</div>
            <div className="text-xs text-muted-foreground mt-1">{metric.context}</div>
          </div>
        ))}
      </DocGrid>
    </DocCard>
  );
}

// ============================================================================
// PRIVACY PRINCIPLES
// ============================================================================

function PrivacySection() {
  return (
    <DocCard variant="gradient">
      <DocGrid cols={2}>
        {privacyPrinciples.map((principle, i) => (
          <div key={i} className="flex gap-4">
            <IconBox icon={principle.icon} variant="accent" />
            <div>
              <h4 className="text-lg font-bold text-white mb-2">{principle.title}</h4>
              <p className="text-sm text-muted-foreground">{principle.description}</p>
            </div>
          </div>
        ))}
      </DocGrid>
    </DocCard>
  );
}

// ============================================================================
// COMPARISON TABLE
// ============================================================================

function ComparisonTable() {
  return (
    <DocCard variant="outline" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-foreground/10">
              {comparisonTable.headers.map((header, i) => (
                <th
                  key={i}
                  className={`text-left py-4 px-4 text-sm font-bold ${
                    i === 1 ? "text-accent" : "text-white"
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonTable.rows.map((row, i) => (
              <tr key={i} className="border-b border-foreground/5 last:border-0">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={`py-3 px-4 text-sm ${
                      j === 1 ? "text-accent font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DocCard>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function SovereignCorePage() {
  return (
    <div className="space-y-16">
      {/* Header */}
      <PageHeader {...sovereignHeader} />

      {/* Stats */}
      <DocSection>
        <CoreStats />
      </DocSection>

      {/* Core Features */}
      <DocSection>
        <SectionTitle icon={Shield} title="Sovereign Core™ Features" variant="accent" />
        <CoreFeatures />
      </DocSection>

      {/* Architecture Deep Dive */}
      <DocSection>
        <SectionTitle icon={Cpu} title="Arquitectura Detallada" variant="accent" />
        <ArchitectureDeepDive />
      </DocSection>

      {/* Performance */}
      <DocSection>
        <SectionTitle icon={Gauge} title="Métricas de Performance" variant="accent" />
        <PerformanceMetrics />
      </DocSection>

      {/* Privacy */}
      <DocSection>
        <SectionTitle icon={Lock} title="Principios de Privacidad" variant="accent" />
        <PrivacySection />
      </DocSection>

      {/* Comparison */}
      <DocSection>
        <SectionTitle icon={Sparkles} title="Comparativa" variant="accent" />
        <ComparisonTable />
      </DocSection>

      {/* CTA */}
      <DocCard variant="outline" className="border-accent/30 text-center space-y-6">
        <Badge variant="accent">
          <sovereignCta.badge.icon className="w-3 h-3" />
          {sovereignCta.badge.text}
        </Badge>
        <h2 className="text-3xl font-bold text-white">{sovereignCta.title}</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">{sovereignCta.description}</p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            href={sovereignCta.primaryAction.href}
            className="flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-primary transition-colors group"
          >
            {sovereignCta.primaryAction.text}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href={sovereignCta.secondaryAction.href}
            className="flex items-center gap-2 px-8 py-4 border border-foreground/20 text-foreground font-semibold rounded-full hover:bg-foreground/5 transition-colors"
          >
            {sovereignCta.secondaryAction.text}
          </Link>
        </div>
      </DocCard>
    </div>
  );
}
