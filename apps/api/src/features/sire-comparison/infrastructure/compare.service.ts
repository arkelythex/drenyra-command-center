import {
	buildSummary,
	SireDiffLedgerService,
	type SireDiffRow,
	SireDiffService,
} from "../../sire";
import type {
	ComparisonSummary,
	DashboardPeriodStat,
	DiscrepancyDTO,
	DiscrepancyResolution,
	DiscrepancyType,
	ReconciliationAction,
} from "../types";

function toDiscrepancyType(status: SireDiffRow["status"]): DiscrepancyType {
	switch (status) {
		case "MISSING_LOCAL":
			return "SUNAT_ONLY";
		case "MISSING_SUNAT":
			return "LOCAL_ONLY";
		case "MISMATCH":
			return "AMOUNT_MISMATCH";
		default:
			return "AMOUNT_MISMATCH";
	}
}

function toDiscrepancyDTO(row: SireDiffRow): DiscrepancyDTO {
	return {
		id: row.id,
		type: toDiscrepancyType(row.status),
		sunatRecord: row.sunatRecord,
		localRecord: row.localRecord,
		diffAmount: Math.abs(row.difference),
		status:
			row.resolution === "ACCEPTED_SUNAT" || row.resolution === "KEPT_LOCAL"
				? "ACCEPTED"
				: "UNRESOLVED",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};
}

function buildComparisonSummary(rows: SireDiffRow[]): ComparisonSummary {
	const summary = buildSummary(rows);
	const totalRecords = rows.length;
	return {
		totalRecords,
		sunatOnly: summary.missingOnLedger,
		localOnly: summary.missingOnSunat,
		amountMismatch: summary.mismatched,
		statusMismatch: 0,
		matchPercent:
			totalRecords > 0
				? Number(((summary.matched / totalRecords) * 100).toFixed(1))
				: 100,
	};
}

const resolvedDiscrepancies = new Map<string, DiscrepancyDTO>();
const comparisonResults = new Map<
	string,
	{ rows: SireDiffRow[]; generatedAt: string }
>();

export class SireComparisonService {
	static async runComparison(
		companyId: string,
		period: string,
	): Promise<{ rows: SireDiffRow[]; summary: ComparisonSummary }> {
		const artifact = await SireDiffService.buildThreeWayDiff({
			companyId,
			period,
		});

		const rows = artifact.rows;
		const summary = buildComparisonSummary(rows);

		comparisonResults.set(`${companyId}:${period}`, {
			rows,
			generatedAt: new Date().toISOString(),
		});

		return { rows, summary };
	}

	static async getComparison(
		companyId: string,
		period: string,
	): Promise<{ summary: ComparisonSummary; discrepancies: DiscrepancyDTO[] }> {
		const { rows, summary } = await SireComparisonService.runComparison(
			companyId,
			period,
		);

		const discrepancies = rows
			.filter((row) => row.status !== "MATCH")
			.map((row) => {
				const resolved = resolvedDiscrepancies.get(row.id);
				if (resolved) return resolved;
				return toDiscrepancyDTO(row);
			});

		return { summary, discrepancies };
	}

	static async getDiscrepancies(
		companyId: string,
		period: string,
		type?: DiscrepancyType,
		resolutionStatus?: DiscrepancyResolution,
	): Promise<DiscrepancyDTO[]> {
		const { rows } = await SireComparisonService.runComparison(
			companyId,
			period,
		);

		let discrepancies = rows
			.filter((row) => row.status !== "MATCH")
			.map((row) => resolvedDiscrepancies.get(row.id) ?? toDiscrepancyDTO(row));

		if (type) {
			discrepancies = discrepancies.filter((d) => d.type === type);
		}
		if (resolutionStatus) {
			discrepancies = discrepancies.filter(
				(d) => d.status === resolutionStatus,
			);
		}

		return discrepancies;
	}

	static async resolveDiscrepancy(
		id: string,
		companyId: string,
		period: string,
		action: ReconciliationAction,
		notes?: string,
	): Promise<DiscrepancyDTO> {
		const now = new Date().toISOString();
		let existing: DiscrepancyDTO | undefined;

		for (const [, data] of comparisonResults) {
			const row = data.rows.find((r) => r.id === id);
			if (row) {
				existing = resolvedDiscrepancies.get(id) ?? toDiscrepancyDTO(row);
				break;
			}
		}

		if (!existing) {
			throw new Error(`Discrepancy ${id} not found. Run a comparison first.`);
		}

		let newStatus: DiscrepancyResolution;
		switch (action) {
			case "ACCEPT_SUNAT":
			case "ACCEPT_LOCAL":
				newStatus = "ACCEPTED";
				break;
			case "FLAG_FOR_REVIEW":
				newStatus = "FLAGGED";
				break;
			case "MANUAL_FIX":
				newStatus = "REVIEWING";
				break;
		}

		const updated: DiscrepancyDTO = {
			...existing,
			status: newStatus,
			notes: notes ?? existing.notes,
			updatedAt: now,
		};

		resolvedDiscrepancies.set(id, updated);

		if (action === "ACCEPT_SUNAT") {
			const resultsArray = Array.from(comparisonResults.entries());
			const foundEntry = resultsArray.find(
				([, data]: [string, { rows: SireDiffRow[]; generatedAt: string }]) =>
					data.rows.some((r: SireDiffRow) => r.id === id),
			);
			const key = foundEntry?.[0];
			const row = foundEntry?.[1]?.rows.find((r: SireDiffRow) => r.id === id);
			const actualPeriod = key?.split(":")[1] ?? period;

			if (row?.sunatRecord && companyId) {
				await SireDiffLedgerService.applyResolutions({
					companyId,
					period: actualPeriod,
					rows: [
						{
							rowId: row.id,
							status: row.status,
							decision: "ACCEPT_SUNAT",
							localRecord: row.localRecord,
							sunatRecord: row.sunatRecord,
						},
					],
				}).catch(() => {});
			}
		}

		return updated;
	}

	static async getReport(
		companyId: string,
		period: string,
	): Promise<{
		report: {
			period: string;
			companyId: string;
			summary: ComparisonSummary;
			discrepancies: DiscrepancyDTO[];
			generatedAt: string;
		};
	}> {
		const { summary, discrepancies } =
			await SireComparisonService.getComparison(companyId, period);
		return {
			report: {
				period,
				companyId,
				summary,
				discrepancies,
				generatedAt: new Date().toISOString(),
			},
		};
	}

	static async getDashboard(companyId: string): Promise<{
		periods: DashboardPeriodStat[];
		overallMatchPercent: number;
	}> {
		const currentDate = new Date();
		const periods: string[] = [];

		for (let i = 0; i < 6; i++) {
			const d = new Date(
				currentDate.getFullYear(),
				currentDate.getMonth() - i,
				1,
			);
			const year = d.getFullYear();
			const month = String(d.getMonth() + 1).padStart(2, "0");
			periods.push(`${year}-${month}`);
		}

		const stats: DashboardPeriodStat[] = [];
		let totalMatchSum = 0;
		let totalWeight = 0;

		for (const period of periods) {
			try {
				const { summary } = await SireComparisonService.getComparison(
					companyId,
					period,
				);
				const unresolvedCount =
					summary.totalRecords -
					Math.round((summary.matchPercent / 100) * summary.totalRecords);
				stats.push({ period, ...summary, unresolvedCount });
				totalMatchSum += summary.matchPercent;
				totalWeight++;
			} catch {
				stats.push({
					period,
					totalRecords: 0,
					matchPercent: 0,
					unresolvedCount: 0,
				});
			}
		}

		return {
			periods: stats,
			overallMatchPercent:
				totalWeight > 0 ? Number((totalMatchSum / totalWeight).toFixed(1)) : 0,
		};
	}
}
