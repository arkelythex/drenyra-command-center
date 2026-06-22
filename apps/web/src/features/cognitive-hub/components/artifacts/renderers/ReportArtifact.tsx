import React from 'react';
/**
 * Report Artifact - Compliance report document
 *
 * Renders a certified compliance report with score and PDF download.
 *
 * @since Feb 2026
 */

import { FileText, BrainCircuit, ArrowRight } from 'lucide-react';
import type { HubArtifact } from '@arkelythex/shared/artifacts';
import { registerArtifact } from '../artifact-registry';

type ReportArt = Extract<HubArtifact, { type: 'report' }>;

export const ReportArtifact: React.FC<{ artifact: ReportArt }> = ({ artifact }) => (
  <div className="group relative mt-6 overflow-hidden hub-panel-inset p-8 animate-entrance">
    <div className="absolute top-0 right-0 p-4">
      <div className="h-12 w-12 rounded-xl bg-foreground/5 border border-border flex items-center justify-center text-foreground/40">
        <FileText size={24} />
      </div>
    </div>

    <div className="max-w-md mx-auto space-y-8 py-4">
      {/* Document header */}
      <div className="text-center space-y-2 border-b border-border/10 pb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-foreground text-background mb-4">
          <BrainCircuit size={24} />
        </div>
        <h3 className="text-xl font-black uppercase tracking-tighter text-foreground">{artifact.title}</h3>
        <p className="text-2xs font-mono text-muted-foreground uppercase tracking-[0.3em]">Certificado por el agente auditor</p>
      </div>

      {/* Document body skeleton */}
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="h-2 w-24 bg-foreground/20 rounded-full" />
          <div className="space-y-2">
            <div className="h-1.5 w-full bg-foreground/5 rounded-full" />
            <div className="h-1.5 w-[90%] bg-foreground/5 rounded-full" />
            <div className="h-1.5 w-[95%] bg-foreground/5 rounded-full" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/20 bg-foreground/[0.02] space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-3xs font-black uppercase text-muted-foreground">Compliance Score</span>
            <span className="text-xs font-mono font-black text-[var(--premium-success)]">98.4%</span>
          </div>
          <div className="h-1.5 w-full bg-foreground/10 rounded-full overflow-hidden">
            <div className="h-full w-[98%] bg-foreground shadow-glow" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="h-2 w-32 bg-foreground/20 rounded-full" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 rounded-lg bg-foreground/5 border border-border/10" />
            <div className="h-12 rounded-lg bg-foreground/5 border border-border/10" />
          </div>
        </div>
      </div>

      {/* Action footer */}
      <div className="pt-8 border-t border-border/10">
        <button className="flex w-full items-center justify-center gap-3 rounded-2xl bg-foreground py-4 text-xs font-black uppercase tracking-[0.2em] text-background shadow-glow transition-[background-color,box-shadow,transform,opacity] duration-200 hover:opacity-90 active:scale-95">
          <ArrowRight size={16} className="rotate-90" /> Descargar reporte PDF
        </button>
        <p className="text-center text-[8px] font-mono text-muted-foreground/40 mt-4 uppercase tracking-widest">
          SHA-256: 8f2d...e41a · Verified on 2026-02-14
        </p>
      </div>
    </div>
  </div>
);

// Auto-register
registerArtifact('report', ReportArtifact);
