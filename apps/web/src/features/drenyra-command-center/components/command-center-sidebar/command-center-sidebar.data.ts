import { DRENYRA_AGENTS } from "@/lib/agents";

export const CASE_TYPE_LABELS: Record<string, string> = {
	MONTHLY_CLOSE: "Cierre Mensual",
	CPE_REVIEW: "Revisión CPE",
	SIRE_REVIEW: "Revisión SIRE",
	LEDGER_REVIEW: "Libro Mayor",
	CONCILIATION: "Conciliación",
	EVIDENCE_REVIEW: "Revisión Evidencia",
};

export const SIDEBAR_AGENTS = DRENYRA_AGENTS.map((a, i) => ({
	id: a.id,
	label: a.label,
	active: i === 0 && (a.id === "ledger" || a.id === "sire" || a.id === "cpe"),
})).filter((a) => ["ledger", "sire", "cpe"].includes(a.id));

export const AGENTS = [
	{ id: "ledger", label: "Ledger", active: true },
	{ id: "sire", label: "SIRE", active: false },
	{ id: "cpe", label: "CPE", active: false },
] as const;
