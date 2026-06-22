"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";

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
  sunatHeader,
  complianceStats,
  regulationsSupported,
  automationFeatures,
  availableReports,
  complianceBadges,
  updatesTimeline,
  sunatCta,
} from "@/lib/data/docs/sunat-compliance";

import { Building2, FileText, Zap, BookOpen } from "lucide-react";

// ============================================================================
// STATS SECTION
// ============================================================================

function ComplianceStats() {
  return (
    <DocGrid cols={4}>
      {complianceStats.map((stat, i) => (
        <StatCard key={i} {...stat} />
      ))}
    </DocGrid>
  );
}

// ============================================================================
// REGULATIONS LIST
// ============================================================================

function RegulationsList() {
  return (
    <DocGrid cols={2}>
      {regulationsSupported.map((reg, i) => (
        <DocCard key={i} variant={reg.status === "completed" ? "gradient" : "outline"}>
          <div className="flex items-start gap-4">
            <IconBox icon={reg.icon} variant={reg.status === "completed" ? "accent" : "default"} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-white">{reg.regulation}</h3>
                {reg.status === "completed" && (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {reg.description}
              </p>
            </div>
          </div>
        </DocCard>
      ))}
    </DocGrid>
  );
}

// ============================================================================
// AUTOMATION FEATURES
// ============================================================================

function AutomationGrid() {
  return (
    <DocGrid cols={3}>
      {automationFeatures.map((feature, i) => (
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
// REPORTS TABLE
// ============================================================================

function ReportsTable() {
  return (
    <DocCard variant="outline" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-foreground/10">
              <th className="text-left py-4 px-4 text-sm font-bold text-white">Código</th>
              <th className="text-left py-4 px-4 text-sm font-bold text-white">Nombre</th>
              <th className="text-left py-4 px-4 text-sm font-bold text-white">Formato</th>
              <th className="text-left py-4 px-4 text-sm font-bold text-white">Frecuencia</th>
            </tr>
          </thead>
          <tbody>
            {availableReports.map((report, i) => (
              <tr key={i} className="border-b border-foreground/5 last:border-0">
                <td className="py-3 px-4">
                  <Badge variant="accent">{report.code}</Badge>
                </td>
                <td className="py-3 px-4 text-sm text-white font-medium">{report.name}</td>
                <td className="py-3 px-4 text-sm text-muted-foreground">{report.format}</td>
                <td className="py-3 px-4 text-sm text-muted-foreground">{report.frequency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DocCard>
  );
}

// ============================================================================
// COMPLIANCE BADGES
// ============================================================================

function ComplianceBadges() {
  return (
    <DocCard variant="gradient">
      <DocGrid cols={2}>
        {complianceBadges.map((badge, i) => (
          <div key={i} className="flex gap-4">
            <IconBox icon={badge.icon} variant="accent" />
            <div>
              <h4 className="text-lg font-bold text-white mb-1">{badge.title}</h4>
              <p className="text-sm text-muted-foreground">{badge.description}</p>
            </div>
          </div>
        ))}
      </DocGrid>
    </DocCard>
  );
}

// ============================================================================
// UPDATES TIMELINE
// ============================================================================

function UpdatesTimeline() {
  return (
    <div className="space-y-4">
      {updatesTimeline.map((update, i) => (
        <div
          key={i}
          className="flex gap-4 p-4 rounded-xl bg-foreground/5 border border-foreground/10 hover:bg-foreground/15 transition-all"
        >
          <div className="flex-shrink-0">
            <IconBox icon={Clock} variant="default" size="sm" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="accent">{update.date}</Badge>
            </div>
            <h4 className="text-lg font-bold text-white mb-1">{update.change}</h4>
            <p className="text-sm text-muted-foreground">{update.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function SunatCompliancePage() {
  return (
    <div className="space-y-16">
      {/* Header */}
      <PageHeader {...sunatHeader} />

      {/* Stats */}
      <DocSection>
        <ComplianceStats />
      </DocSection>

      {/* Regulations */}
      <DocSection>
        <SectionTitle icon={Building2} title="Regulaciones Soportadas" variant="accent" />
        <RegulationsList />
      </DocSection>

      {/* Automation */}
      <DocSection>
        <SectionTitle icon={Zap} title="Automatizaciones" variant="accent" />
        <AutomationGrid />
      </DocSection>

      {/* Reports */}
      <DocSection>
        <SectionTitle icon={FileText} title="Reportes Disponibles" variant="accent" />
        <ReportsTable />
      </DocSection>

      {/* Badges */}
      <DocSection>
        <SectionTitle icon={BookOpen} title="Certificaciones" variant="accent" />
        <ComplianceBadges />
      </DocSection>

      {/* Updates */}
      <DocSection>
        <SectionTitle icon={Clock} title="Actualizaciones Recientes" variant="accent" />
        <UpdatesTimeline />
      </DocSection>

      {/* CTA */}
      <DocCard variant="outline" className="border-accent/30 text-center space-y-6">
        <Badge variant="accent">
          <sunatCta.badge.icon className="w-3 h-3" />
          {sunatCta.badge.text}
        </Badge>
        <h2 className="text-3xl font-bold text-white">{sunatCta.title}</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">{sunatCta.description}</p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            href={sunatCta.primaryAction.href}
            className="flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-primary transition-colors group"
          >
            {sunatCta.primaryAction.text}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href={sunatCta.secondaryAction.href}
            className="flex items-center gap-2 px-8 py-4 border border-foreground/20 text-foreground font-semibold rounded-full hover:bg-foreground/5 transition-colors"
          >
            {sunatCta.secondaryAction.text}
          </Link>
        </div>
      </DocCard>
    </div>
  );
}
