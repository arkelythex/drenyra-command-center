import { useState } from "react";
import { AlertTriangle, ThumbsUp, ThumbsDown, AlertOctagon } from "lucide-react";
import type { MissionProposal } from "@drenyra/mission-domain";
import { MissionEvidenceBundle } from "./MissionEvidenceBundle";

interface MissionApprovalGateProps {
  proposal: MissionProposal;
  onApprove: () => void;
  onReject: (reason: string) => void;
  isSubmitting: boolean;
}

const RISK_LABELS: Record<string, string> = {
  LOW: "Bajo",
  MEDIUM: "Medio",
  HIGH: "Alto",
};

export function MissionApprovalGate({
  proposal,
  onApprove,
  onReject,
  isSubmitting,
}: MissionApprovalGateProps) {
  const [rejectReason, setRejectReason] = useState("");

  const handleReject = () => {
    onReject(rejectReason);
  };

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} className="text-amber-500" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Aprobación requerida
        </h3>
        <span className="text-[10px] text-[var(--text-muted)]">
          v{proposal.version}
        </span>
      </div>

      <p className="text-xs text-[var(--text-secondary)]">
        {proposal.summary}
      </p>

      <MissionEvidenceBundle
        evidence={proposal.evidence}
        version={proposal.version}
        evidenceHash={proposal.evidenceHash}
      />

      <div className="flex items-center gap-2 text-xs">
        <AlertOctagon size={12} className="text-amber-500" />
        <span className="text-[var(--text-muted)]">
          Riesgo: {RISK_LABELS[proposal.riskLevel] ?? proposal.riskLevel}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Motivo de rechazo (requerido)"
          className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none resize-none"
          rows={2}
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onApprove}
            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <ThumbsUp size={14} /> Aprobar
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleReject}
            className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-50"
          >
            <ThumbsDown size={14} /> Rechazar
          </button>
        </div>
      </div>
    </div>
  );
}
