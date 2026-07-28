"use client";

import type { FC } from "react";

// ---------------------------------------------------------------------------
// CAP-SIRE-01 Phase C.4 — L0 Evidence Badge
//
// Pure presentational component — no data fetching, no side effects.
// Renders a small badge with source, verification status, and confidence level
// for each diff row value in the SIRE reconciliation view.
// ---------------------------------------------------------------------------

export type EvidenceSource = "SUNAT" | "ledger" | "CPE";
export type VerificationStatus = "verified" | "pending" | "conflict";
export type ConfidenceLevel = "high" | "medium" | "low";

interface EvidenceBadgeProps {
	source: EvidenceSource;
	status: VerificationStatus;
	confidence: ConfidenceLevel;
}

const sourceLabels: Record<EvidenceSource, string> = {
	SUNAT: "SUNAT",
	ledger: "Ledger",
	CPE: "CPE",
};

const statusIcons: Record<VerificationStatus, string> = {
	verified: "✓",
	pending: "○",
	conflict: "⚠",
};

const confidenceDots: Record<ConfidenceLevel, number> = {
	high: 3,
	medium: 2,
	low: 1,
};

export const EvidenceBadge: FC<EvidenceBadgeProps> = ({
	source,
	status,
	confidence,
}) => {
	const label = sourceLabels[source];
	const icon = statusIcons[status];
	const dots = confidenceDots[confidence];
	const ariaLabel = `Evidence: ${label}, status: ${status}, confidence: ${confidence}`;

	return (
		<span
			role="status"
			aria-label={ariaLabel}
			className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-3xs font-black uppercase tracking-wider evidence-badge evidence-badge--${status}`}
		>
			<span className="evidence-badge__source">{label}</span>
			<span className="evidence-badge__status-icon" aria-hidden="true">
				{icon}
			</span>
			<span className="evidence-badge__confidence" aria-hidden="true">
				{"●".repeat(dots)}
				{"○".repeat(3 - dots)}
			</span>
		</span>
	);
};
