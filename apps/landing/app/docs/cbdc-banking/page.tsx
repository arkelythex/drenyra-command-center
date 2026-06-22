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
  cbdcHeader,
  cbdcStats,
  cbdcFeatures,
  integratedBanks,
  paymentTypes,
  smartContractExamples,
  securityFeatures,
  benefitsComparison,
  cbdcCta,
} from "@/lib/data/docs/cbdc-banking";

import { Banknote, Zap, Building2, Lock, TrendingUp, Landmark } from "lucide-react";

// ============================================================================
// STATS SECTION
// ============================================================================

function CBDCStats() {
  return (
    <DocGrid cols={4}>
      {cbdcStats.map((stat, i) => (
        <StatCard key={i} {...stat} />
      ))}
    </DocGrid>
  );
}

// ============================================================================
// FEATURES GRID
// ============================================================================

function CBDCFeatures() {
  return (
    <DocGrid cols={3}>
      {cbdcFeatures.map((feature, i) => (
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
// INTEGRATED BANKS
// ============================================================================

function IntegratedBanks() {
  return (
    <DocGrid cols={3}>
      {integratedBanks.map((bank, i) => (
        <DocCard key={i} variant="gradient">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">{bank.shortName}</h3>
              <p className="text-xs text-muted-foreground">{bank.type}</p>
            </div>
            <IconBox icon={Landmark} variant="accent" size="sm" />
          </div>
          <ul className="space-y-2">
            {bank.features.map((feature, j) => (
              <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
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
// PAYMENT TYPES
// ============================================================================

function PaymentTypes() {
  return (
    <DocGrid cols={2}>
      {paymentTypes.map((type, i) => (
        <DocCard key={i} variant="gradient">
          <div className="flex items-center gap-3 mb-4">
            <IconBox icon={type.icon} variant="accent" />
            <h3 className="text-xl font-bold text-white">{type.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {type.description}
          </p>
          <div className="pt-4 border-t border-foreground/10">
            <div className="text-xs text-accent font-semibold mb-2">Beneficios:</div>
            <ul className="space-y-1">
              {type.benefits.map((benefit, j) => (
                <li key={j} className="flex items-center gap-2 text-sm text-foreground/80">
                  <div className="w-1 h-1 rounded-full bg-accent" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </DocCard>
      ))}
    </DocGrid>
  );
}

// ============================================================================
// SMART CONTRACTS
// ============================================================================

function SmartContracts() {
  return (
    <DocGrid cols={2}>
      {smartContractExamples.map((contract, i) => (
        <DocCard key={i} variant="outline">
          <Badge variant="accent" className="mb-4">
            Smart Contract
          </Badge>
          <h3 className="text-xl font-bold text-white mb-3">{contract.name}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {contract.description}
          </p>
          <div className="p-3 rounded-lg bg-foreground/5 border border-foreground/10">
            <div className="text-xs text-accent font-semibold mb-1">Ejemplo:</div>
            <p className="text-sm text-foreground/80 italic">{contract.example}</p>
          </div>
        </DocCard>
      ))}
    </DocGrid>
  );
}

// ============================================================================
// SECURITY FEATURES
// ============================================================================

function SecurityFeatures() {
  return (
    <DocCard variant="gradient">
      <DocGrid cols={2}>
        {securityFeatures.map((feature, i) => (
          <div key={i} className="flex gap-4">
            <IconBox icon={feature.icon} variant="accent" />
            <div>
              <h4 className="text-lg font-bold text-white mb-2">{feature.title}</h4>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
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
              {benefitsComparison.headers.map((header, i) => (
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
            {benefitsComparison.rows.map((row, i) => (
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

export default function CBDCBankingPage() {
  return (
    <div className="space-y-16">
      {/* Header */}
      <PageHeader {...cbdcHeader} />

      {/* Stats */}
      <DocSection>
        <CBDCStats />
      </DocSection>

      {/* CBDC Features */}
      <DocSection>
        <SectionTitle icon={Zap} title="Características CBDC" variant="accent" />
        <CBDCFeatures />
      </DocSection>

      {/* Integrated Banks */}
      <DocSection>
        <SectionTitle icon={Building2} title="Bancos y Billeteras Integradas" variant="accent" />
        <IntegratedBanks />
      </DocSection>

      {/* Payment Types */}
      <DocSection>
        <SectionTitle icon={Banknote} title="Tipos de Pagos" variant="accent" />
        <PaymentTypes />
      </DocSection>

      {/* Smart Contracts */}
      <DocSection>
        <SectionTitle icon={Landmark} title="Smart Contracts Programables" variant="accent" />
        <SmartContracts />
      </DocSection>

      {/* Security */}
      <DocSection>
        <SectionTitle icon={Lock} title="Seguridad Avanzada" variant="accent" />
        <SecurityFeatures />
      </DocSection>

      {/* Comparison */}
      <DocSection>
        <SectionTitle icon={TrendingUp} title="Comparativa de Métodos de Pago" variant="accent" />
        <ComparisonTable />
      </DocSection>

      {/* CTA */}
      <DocCard variant="outline" className="border-accent/30 text-center space-y-6">
        <Badge variant="accent">
          <cbdcCta.badge.icon className="w-3 h-3" />
          {cbdcCta.badge.text}
        </Badge>
        <h2 className="text-3xl font-bold text-white">{cbdcCta.title}</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">{cbdcCta.description}</p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            href={cbdcCta.primaryAction.href}
            className="flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-primary transition-colors group"
          >
            {cbdcCta.primaryAction.text}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href={cbdcCta.secondaryAction.href}
            className="flex items-center gap-2 px-8 py-4 border border-foreground/20 text-foreground font-semibold rounded-full hover:bg-foreground/5 transition-colors"
          >
            {cbdcCta.secondaryAction.text}
          </Link>
        </div>
      </DocCard>
    </div>
  );
}
