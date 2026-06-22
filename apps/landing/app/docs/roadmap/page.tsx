"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Clock, Rocket, Globe2, Building2, Target, CheckCircle2, Circle } from "lucide-react";

import {
  DocSection,
  DocCard,
  DocGrid,
  PageHeader,
  SectionTitle,
  IconBox,
  Badge,
} from "@/components/docs/ui";

import {
  roadmapHeader,
  roadmapStats,
  roadmapData,
  futurePhases,
} from "@/lib/data/docs/roadmap";

import type { QuarterData, Milestone, RoadmapPhase } from "@/lib/types/docs";

// ============================================================================
// COMPONENTES
// ============================================================================

function StatusBadge({ status }: { status: QuarterData["status"] }) {
  const variants: Record<string, "success" | "accent" | "default"> = {
    completed: "success",
    "in-progress": "accent",
    planned: "default",
    pending: "default",
  };
  
  const labels: Record<string, string> = {
    completed: "Completado",
    "in-progress": "En Progreso",
    planned: "Planificado",
    pending: "Pendiente",
  };

  return <Badge variant={variants[status] || "default"}>{labels[status]}</Badge>;
}

function MilestoneItem({ milestone }: { milestone: Milestone }) {
  const Icon = milestone.completed ? CheckCircle2 : Circle;
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-foreground/[0.03] hover:bg-foreground/5 transition-all group">
      <div className="mt-0.5">
        <Icon className={`w-5 h-5 ${milestone.completed ? "text-primary" : "text-foreground/30"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-semibold ${milestone.completed ? "text-foreground/80" : "text-white"}`}>
          {milestone.title}
        </h4>
        <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
      </div>
    </div>
  );
}

function QuarterCard({ quarter }: { quarter: QuarterData }) {
  const completedCount = quarter.milestones.filter(m => m.completed).length;
  const totalCount = quarter.milestones.length;
  
  return (
    <DocCard variant="gradient" className="h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold text-white">{quarter.quarter}</h3>
          <p className="text-sm text-accent">{quarter.theme}</p>
        </div>
        <StatusBadge status={quarter.status} />
      </div>
      
      <div className="text-xs text-muted-foreground mb-4">
        {completedCount}/{totalCount} milestones completados
      </div>
      
      <div className="space-y-2">
        {quarter.milestones.map((milestone) => (
          <MilestoneItem key={milestone.id} milestone={milestone} />
        ))}
      </div>
    </DocCard>
  );
}

function FuturePhaseCard({ phase }: { phase: RoadmapPhase }) {
  return (
    <DocCard variant="outline" className="text-center">
      <div className="text-3xl font-black text-accent mb-2">{phase.year}</div>
      <h3 className="text-lg font-bold text-white mb-2">{phase.title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{phase.description}</p>
      <div className="text-xs text-accent/80 font-medium pt-4 border-t border-foreground/10">
        {phase.metrics}
      </div>
    </DocCard>
  );
}

function StatsOverview() {
  return (
    <DocCard variant="gradient">
      <DocGrid cols={4}>
        {roadmapStats.map((stat, i) => (
          <div key={i} className="text-center">
            <IconBox icon={stat.icon} variant="accent" className="mx-auto mb-3" />
            <div className="text-3xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </DocGrid>
    </DocCard>
  );
}

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================

export default function RoadmapPage() {
  return (
    <div className="space-y-16">
      {/* Header */}
      <PageHeader {...roadmapHeader} />

      {/* Stats */}
      <DocSection>
        <StatsOverview />
      </DocSection>

      {/* 2025 Roadmap */}
      <DocSection>
        <SectionTitle icon={Clock} title="Roadmap 2025" variant="accent" />
        <DocGrid cols={2}>
          {roadmapData.map((quarter) => (
            <QuarterCard key={quarter.id} quarter={quarter} />
          ))}
        </DocGrid>
      </DocSection>

      {/* Fases Futuras */}
      <DocSection>
        <SectionTitle icon={Rocket} title="Vision 2026-2030" variant="accent" />
        <DocGrid cols={3}>
          {futurePhases.map((phase, i) => (
            <FuturePhaseCard key={i} phase={phase} />
          ))}
        </DocGrid>
      </DocSection>

      {/* CTA */}
      <DocCard variant="outline" className="border-accent/30 text-center space-y-6">
        <Badge variant="accent">
          <Target className="w-3 h-3" />
          Sé parte de nuestra historia
        </Badge>
        <h2 className="text-3xl font-bold text-white">¿Quieres contribuir al roadmap?</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Estamos construyendo el futuro de la contabilidad peruana. Únete a nosotros.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link 
            href="/docs/investors" 
            className="flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-primary transition-colors group"
          >
            <Building2 className="w-4 h-4" />
            Invertir en Arkelythex
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link 
            href="/" 
            className="flex items-center gap-2 px-8 py-4 border border-foreground/20 text-foreground font-semibold rounded-full hover:bg-foreground/5 transition-colors"
          >
            <Globe2 className="w-4 h-4" />
            Conocer más
          </Link>
        </div>
      </DocCard>
    </div>
  );
}
