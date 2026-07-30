import { CheckCircle, Lock } from "lucide-react";
import type { EvidenceItem } from "@drenyra/mission-domain";

interface MissionEvidenceBundleProps {
  evidence: EvidenceItem[];
  version: number;
  evidenceHash: string;
}

export function MissionEvidenceBundle({
  evidence,
  version,
}: MissionEvidenceBundleProps) {
  if (evidence.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Evidencia
        </p>
        <span className="text-[10px] text-[var(--text-muted)]">v{version}</span>
        <Lock size={10} className="text-[var(--text-muted)]" />
        <span className="text-[9px] text-[var(--text-muted)]">inmutable</span>
      </div>
      <div className="space-y-1">
        {evidence.map((ev) => (
          <div
            key={ev.id}
            className="flex items-center gap-2 rounded border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-1"
          >
            <CheckCircle size={12} className="text-green-500 shrink-0" />
            <span className="text-[11px] text-[var(--text-primary)]">
              {ev.label}
            </span>
            <span className="ml-auto text-[9px] text-[var(--text-muted)]">
              {ev.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
