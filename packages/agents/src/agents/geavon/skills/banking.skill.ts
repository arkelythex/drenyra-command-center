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
		date: string;
		description: string;
		bankAmount: number;
		bookAmount: number;
		difference: number;
		status: string;
	}> = [];

	for (let i = 0; i < count; i++) {
		const bankAmount = Math.round(Math.random() * 100000) / 100;
		const bookAmount = Math.round(Math.random() * 100000) / 100;
		rows.push({
			date: `2026-06-${String(i + 1).padStart(2, "0")}`,
			description: `Transacción simulada #${i + 1}`,
			bankAmount,
			bookAmount,
			difference: Math.round((bankAmount - bookAmount) * 100) / 100,
			status: bankAmount === bookAmount ? "CONCILIATED" : "PENDING",
		});
	}

	return rows;
}

function calculateSummary(rows: ReturnType<typeof generateMockRows>) {
	return {
		totalRows: rows.length,
		conciliatedCount: rows.filter((r) => r.status === "CONCILIATED").length,
		pendingCount: rows.filter((r) => r.status === "PENDING").length,
		totalBankAmount: rows.reduce((sum, r) => sum + r.bankAmount, 0),
		totalBookAmount: rows.reduce((sum, r) => sum + r.bookAmount, 0),
		totalDifference: rows.reduce((sum, r) => sum + r.difference, 0),
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
			content: `Se procesaron ${rows.length} movimientos bancarios. ${summary.conciliatedCount} conciliados, ${summary.pendingCount} pendientes.`,
			payload: {
				rows,
				summary,
			},
		};
	},
};
