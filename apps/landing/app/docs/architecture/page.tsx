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
  architectureHeader,
  architectureLayers,
  techStack,
  performanceStats,
  architectureFeatures,
  architectureCta,
} from "@/lib/data/docs/architecture";

import { Layers, Boxes, Cpu, Container } from "lucide-react";

// ============================================================================
// LAYERS SECTION
// ============================================================================

function ArchitectureLayers() {
  return (
    <DocGrid cols={2}>
      {architectureLayers.map((layer, i) => (
        <DocCard key={i} variant="gradient" className="group">
          <div className="flex items-start gap-4">
            <IconBox icon={layer.icon} variant="accent" />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">{layer.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {layer.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {layer.tech.map((tech, j) => (
                  <Badge key={j} variant="default">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </DocCard>
      ))}
    </DocGrid>
  );
}

// ============================================================================
// TECH STACK SECTION
// ============================================================================

function TechStackGrid() {
  const categories = Array.from(new Set(techStack.map((t) => t.category)));

  return (
    <DocGrid cols={2}>
      {categories.map((category) => (
        <DocCard key={category} variant="outline">
          <h3 className="text-lg font-bold text-white mb-4">{category}</h3>
          <div className="space-y-3">
            {techStack
              .filter((t) => t.category === category)
              .map((tech, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">{tech.name}</div>
                    <div className="text-xs text-muted-foreground">{tech.description}</div>
                  </div>
                  {tech.version && (
                    <Badge variant="accent">{tech.version}</Badge>
                  )}
                </div>
              ))}
          </div>
        </DocCard>
      ))}
    </DocGrid>
  );
}

// ============================================================================
// DIAGRAM SECTION
// ============================================================================

function ArchitectureDiagram() {
  return (
    <DocCard variant="outline" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
      <div className="relative z-10 space-y-4">
        {/* Client Layer */}
        <div className="p-4 rounded-xl bg-foreground/10 border border-foreground/20 text-center">
          <div className="text-sm font-bold text-white">Client Browser</div>
          <div className="text-xs text-muted-foreground">Next.js 15 + React 19</div>
        </div>

        <div className="flex justify-center">
          <ArrowRight className="w-5 h-5 text-accent rotate-90" />
        </div>

        {/* Edge Layer */}
        <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 text-center">
          <div className="text-sm font-bold text-white">CDN Edge</div>
          <div className="text-xs text-muted-foreground">Cloudflare / Vercel Edge</div>
        </div>

        <div className="flex justify-center">
          <ArrowRight className="w-5 h-5 text-accent rotate-90" />
        </div>

        {/* API Layer */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10 text-center">
            <div className="text-sm font-bold text-white">API Layer</div>
            <div className="text-xs text-muted-foreground">Hono + Bun</div>
          </div>
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-center">
            <div className="text-sm font-bold text-white">Sovereign Core™</div>
            <div className="text-xs text-muted-foreground">Rust + WASM</div>
          </div>
          <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10 text-center">
            <div className="text-sm font-bold text-white">Cache Layer</div>
            <div className="text-xs text-muted-foreground">Redis Cluster</div>
          </div>
        </div>

        <div className="flex justify-center">
          <ArrowRight className="w-5 h-5 text-accent rotate-90" />
        </div>

        {/* Data Layer */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10 text-center">
            <div className="text-sm font-bold text-white">PostgreSQL</div>
            <div className="text-xs text-muted-foreground">Primary Database</div>
          </div>
          <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10 text-center">
            <div className="text-sm font-bold text-white">Object Storage</div>
            <div className="text-xs text-muted-foreground">S3 / GCS</div>
          </div>
        </div>
      </div>
    </DocCard>
  );
}

// ============================================================================
// FEATURES SECTION
// ============================================================================

function ArchitectureFeatures() {
  return (
    <DocGrid cols={3}>
      {architectureFeatures.map((feature, i) => (
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
// MAIN PAGE
// ============================================================================

export default function ArchitecturePage() {
  return (
    <div className="space-y-16">
      {/* Header */}
      <PageHeader {...architectureHeader} />

      {/* Stats */}
      <DocSection>
        <DocGrid cols={4}>
          {performanceStats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </DocGrid>
      </DocSection>

      {/* Architecture Diagram */}
      <DocSection>
        <SectionTitle icon={Boxes} title="Diagrama de Arquitectura" variant="accent" />
        <ArchitectureDiagram />
      </DocSection>

      {/* Architecture Layers */}
      <DocSection>
        <SectionTitle icon={Layers} title="Capas del Sistema" variant="accent" />
        <ArchitectureLayers />
      </DocSection>

      {/* Tech Stack */}
      <DocSection>
        <SectionTitle icon={Cpu} title="Stack Tecnológico" variant="accent" />
        <TechStackGrid />
      </DocSection>

      {/* Features */}
      <DocSection>
        <SectionTitle icon={Container} title="Características Clave" variant="accent" />
        <ArchitectureFeatures />
      </DocSection>

      {/* CTA */}
      <DocCard variant="outline" className="border-accent/30 text-center space-y-6">
        <Badge variant="accent">
          <architectureCta.badge.icon className="w-3 h-3" />
          {architectureCta.badge.text}
        </Badge>
        <h2 className="text-3xl font-bold text-white">{architectureCta.title}</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">{architectureCta.description}</p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            href={architectureCta.primaryAction.href}
            className="flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-primary transition-colors group"
          >
            {architectureCta.primaryAction.text}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href={architectureCta.secondaryAction.href}
            className="flex items-center gap-2 px-8 py-4 border border-foreground/20 text-foreground font-semibold rounded-full hover:bg-foreground/5 transition-colors"
          >
            {architectureCta.secondaryAction.text}
          </Link>
        </div>
      </DocCard>
    </div>
  );
}
