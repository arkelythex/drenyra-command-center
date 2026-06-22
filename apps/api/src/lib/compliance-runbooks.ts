export interface RunbookReference {
	id: string;
	title: string;
	path?: string;
}

const INCIDENT_TRANSACTION_STATUSES = new Set([
	"REJECTED",
	"OBSERVED",
	"ANNULLED",
]);

const INCIDENT_TIMELINE_STATUSES = new Set([
	"ERROR",
	"REJECTED",
	"OBSERVED",
	"ANNULLED",
]);

export const CPE_COMPLIANCE_INCIDENT_RUNBOOK: RunbookReference = {
	id: "RB-CPE-INCIDENT-2026-02",
	title: "Runbook de Incidentes CPE SUNAT/OSE",
	path: "docs/09-troubleshooting/cpe-compliance-incidents-runbook-2026.md",
};

export const SIRE_LEDGER_REPRO_RUNBOOK: RunbookReference = {
	id: "RB-SIRE-LEDGER-REPRO-2026-02",
	title: "Runbook de Reproducibilidad SIRE vs Ledger",
	path: "docs/09-troubleshooting/sire-ledger-reproducibility-runbook-2026.md",
};

export function resolveCpeRunbook(params: {
	currentStatus: string;
	timeline: Array<{ stage: string; status: string }>;
}): RunbookReference | undefined {
	if (INCIDENT_TRANSACTION_STATUSES.has(params.currentStatus.toUpperCase())) {
		return CPE_COMPLIANCE_INCIDENT_RUNBOOK;
	}

	for (const event of params.timeline) {
		const status = event.status.toUpperCase();
		if (INCIDENT_TIMELINE_STATUSES.has(status)) {
			return CPE_COMPLIANCE_INCIDENT_RUNBOOK;
		}
		if (event.stage === "OSE_ATTEMPT" && status === "ERROR") {
			return CPE_COMPLIANCE_INCIDENT_RUNBOOK;
		}
	}

	return undefined;
}
