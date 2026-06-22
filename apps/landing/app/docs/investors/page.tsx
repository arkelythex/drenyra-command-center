"use client";

import React from "react";
import { Download, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

import {
  DocSection,
  DocCard,
  DocGrid,
  PageHeader,
  SectionTitle,
  FeatureCard,
  StatCard,
  CTAButton,
  Badge,
} from "@/components/docs/ui";

import {
  investorHeader,
  investorMetrics,
  competitiveAdvantages,
  tractionMetrics,
  techStack,
  investmentRound,
  fundAllocation,
  roadmapPreview,
  foundingTeam,
  problemSolution,
} from "@/lib/data/docs/investors";

import { Award, TrendingUp, Rocket } from "lucide-react";

// ============================================================================
// FEATURE COMPONENTS
// ============================================================================

function ProblemSolution() {
  return (
    <DocGrid cols={2}>
      <DocCard variant="gradient">
        <h3 className="text-lg font-semibold text-white mb-3">{problemSolution.problem.title}</h3>
        <p className="text-sm text-muted-foreground">{problemSolution.problem.description}</p>
      </DocCard>
      <DocCard variant="outline" className="border-accent/25">
        <h3 className="text-lg font-semibold text-white mb-3">{problemSolution.solution.title}</h3>
        <p className="text-sm text-muted-foreground">{problemSolution.solution.description}</p>
      </DocCard>
    </DocGrid>
  );
}

function TractionMetrics() {
  return (
    <DocCard variant="gradient" className="relative overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {tractionMetrics.map((metric, i) => (
          <div key={i} className="text-center">
            <div className="text-3xl font-bold text-accent">{metric.value}</div>
            <div className="text-sm font-medium text-white">{metric.label}</div>
            <div className="text-xs text-muted-foreground">{metric.growth}</div>
          </div>
        ))}
      </div>
    </DocCard>
  );
}

function TechStack() {
  return (
    <DocGrid cols={4}>
      {techStack.map((tech, i) => (
        <div key={i} className="p-4 rounded-xl bg-foreground/5 border border-foreground/10 text-center">
          <div className="text-sm font-bold text-white">{tech.name}</div>
          <div className="text-xs text-accent">{tech.role}</div>
          <div className="text-2xs text-muted-foreground mt-1">{tech.description}</div>
        </div>
      ))}
    </DocGrid>
  );
}

function InvestmentOpportunity() {
  return (
    <DocCard variant="outline" className="border-accent/25">
      <DocGrid cols={2}>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">Ronda Actual</h3>
          <div className="space-y-3">
            {[
              { label: "Serie", value: investmentRound.type },
              { label: "Objetivo", value: investmentRound.target },
              { label: "Valuación", value: investmentRound.valuation },
              { label: "Ticket mínimo", value: investmentRound.minTicket },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-foreground/10">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-semibold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">Uso de Fondos</h3>
          <div className="space-y-3">
            {fundAllocation.map((item) => (
              <div key={item.category} className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-foreground/10 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percentage}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-12">{item.percentage}%</span>
                <span className="text-xs text-white flex-1">{item.category}</span>
              </div>
            ))}
          </div>
        </div>
      </DocGrid>
    </DocCard>
  );
}

function RoadmapPreview() {
  return (
    <div className="space-y-4">
      {roadmapPreview.map((milestone, i) => (
        <div key={i} className="flex gap-4 p-4 rounded-xl bg-foreground/5 border border-foreground/10">
          <div className="flex-shrink-0 w-24">
            <div className="text-xs font-bold text-accent">{milestone.quarter}</div>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-white mb-2">{milestone.title}</div>
            <div className="flex flex-wrap gap-2">
              {milestone.items.map((item, j) => (
                <Badge key={j} variant="default">{item}</Badge>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TeamSection() {
  return (
    <DocGrid cols={3}>
      {foundingTeam.map((member, i) => (
        <DocCard key={i} variant="glass" className="text-center">
          <div className="w-20 h-20 rounded-full bg-foreground/10 mx-auto mb-4" />
          <Badge variant="accent">{member.role}</Badge>
          <div className="text-lg font-semibold text-white mt-2">{member.name}</div>
          <div className="text-xs text-muted-foreground">{member.experience}</div>
        </DocCard>
      ))}
    </DocGrid>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function InvestorsPage() {
  return (
    <div className="space-y-16">
      {/* Header */}
      <PageHeader {...investorHeader} />

      {/* Stats */}
      <DocSection>
        <DocGrid cols={4}>
          {investorMetrics.map((metric, i) => (
            <StatCard key={i} {...metric} />
          ))}
        </DocGrid>
      </DocSection>

      {/* CTA Buttons */}
      <div className="flex flex-wrap gap-4">
        <CTAButton variant="primary" icon={ArrowRight}>
          Descargar Pitch Deck
        </CTAButton>
        <CTAButton variant="secondary" icon={Mail}>
          Contactar al CEO
        </CTAButton>
      </div>

      {/* Problem/Solution */}
      <DocSection>
        <SectionTitle icon={TrendingUp} title="La Oportunidad" variant="accent" />
        <ProblemSolution />
      </DocSection>

      {/* Competitive Advantages */}
      <DocSection>
        <SectionTitle icon={Award} title="Ventajas Competitivas" variant="primary" />
        <DocGrid cols={2}>
          {competitiveAdvantages.map((advantage, i) => (
            <FeatureCard key={i} {...advantage} />
          ))}
        </DocGrid>
      </DocSection>

      {/* Traction */}
      <DocSection>
        <SectionTitle icon={TrendingUp} title="Tracción y métricas" />
        <TractionMetrics />
      </DocSection>

      {/* Tech Stack */}
      <DocSection>
        <SectionTitle icon={Rocket} title="Stack Tecnológico" variant="primary" />
        <TechStack />
      </DocSection>

      {/* Investment */}
      <DocSection>
        <SectionTitle icon={TrendingUp} title="Oportunidad de Inversión" variant="accent" />
        <InvestmentOpportunity />
      </DocSection>

      {/* Roadmap */}
      <DocSection>
        <div className="flex items-center justify-between mb-6">
          <SectionTitle icon={Rocket} title="Hoja de ruta 2026" />
          <Link href="/docs/roadmap" className="text-xs text-accent hover:text-foreground transition-colors">
            Ver completo →
          </Link>
        </div>
        <RoadmapPreview />
      </DocSection>

      {/* Team */}
      <DocSection>
        <SectionTitle icon={Award} title="Equipo Fundador" variant="primary" />
        <TeamSection />
      </DocSection>

      {/* Final CTA */}
      <DocCard variant="outline" className="border-accent/30 text-center space-y-6">
        <Badge variant="accent">
          <Rocket className="w-3 h-3" />
          Oportunidad Limitada
        </Badge>
        <h2 className="text-3xl font-bold text-white">Únete a la Revolución</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Estamos seleccionando 5 inversores estratégicos para nuestra ronda Pre-Seed.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <CTAButton variant="primary" icon={Download}>
            Descargar Pitch Deck
          </CTAButton>
          <CTAButton variant="secondary" icon={Mail}>
            Agenda una reunión
          </CTAButton>
        </div>
      </DocCard>
    </div>
  );
}
