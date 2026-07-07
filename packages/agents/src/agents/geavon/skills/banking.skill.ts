/**
 * Banking Skill — invoice reconciliation via agent invocation.
 *
 * Returns a banking_reconciliation artifact for inline display
 * in the ArtifactFeed (right panel).
 *
 * NOTE: Currently returns mock/synthesized data. Real integration
 * with BankingService (apps/api/src/features/banking/) is the
 * next phase — this module establishes the skill interface contract.
 */

import type { HubArtifact } from "@drenyra/shared/artifacts";

export interface BankingSkill {
	conciliarBanco: (companyId: string, periodo: string) => Promise<HubArtifact>;
}

function generateMockRows(count: number) {
	const rows: Array<{
		id: string;
		bankRef: string;
		date: string;
		description: string;
		bankAmount: number;
		ledgerAmount: number;
		difference: number;
		status: "MATCH" | "MISMATCH" | "MISSING_IN_LEDGER" | "MISSING_IN_BANK";
	}> = [];

	for (let i = 0; i < count; i++) {
		const bankAmount = Math.round(Math.random() * 100000) / 100;
		const ledgerAmount = Math.round(Math.random() * 100000) / 100;
		rows.push({
			id: `mock-row-${i}`,
			bankRef: `REF-${i}`,
			date: `2026-06-${String(i + 1).padStart(2, "0")}`,
			description: `Transacción simulada #${i + 1}`,
			bankAmount,
			ledgerAmount,
			difference: Math.round((bankAmount - ledgerAmount) * 100) / 100,
			status: bankAmount === ledgerAmount ? "MATCH" : "MISMATCH",
		});
	}

	return rows;
}

function calculateSummary(rows: ReturnType<typeof generateMockRows>) {
	const totalBank = rows.reduce((sum, r) => sum + r.bankAmount, 0);
	const totalLedger = rows.reduce((sum, r) => sum + r.ledgerAmount, 0);
	return {
		totalBank,
		totalLedger,
		totalDifference: Math.round((totalBank - totalLedger) * 100) / 100,
		matched: rows.filter((r) => r.status === "MATCH").length,
		mismatched: rows.filter((r) => r.status === "MISMATCH").length,
	};
}

async function fetchReconciliationData(
	_companyId: string,
	_periodo: string,
): Promise<{
	rows: ReturnType<typeof generateMockRows>;
}> {
	// Stub: returns mock data.
	// TODO: Replace with actual BankingService call in next iteration.
	if (_companyId === "empty-company") {
		return { rows: [] };
	}

	const rowCount = Math.floor(Math.random() * 5) + 3; // 3-7 rows
	const rows = generateMockRows(rowCount);

	return { rows };
}

export const bankingSkill: BankingSkill = {
	conciliarBanco: async (
		companyId: string,
		periodo: string,
	): Promise<HubArtifact> => {
		const { rows } = await fetchReconciliationData(companyId, periodo);
		const summary = calculateSummary(rows);

		return {
			id: `banking:${companyId}:${periodo}:${Date.now()}`,
			title: `Conciliación bancaria — ${periodo}`,
			type: "banking_reconciliation",
			payload: {
				period: periodo,
				accountId: "mock-account-id",
				accountName: "BCP",
				currency: "S/.",
				rows,
				summary,
			},
		};
	},
};
