import { db } from "@drenyra/persistence/client";
import { and, eq } from "@drenyra/persistence/query";
import {
	sireComparisons,
	sireDiscrepancyResolutions,
} from "@drenyra/persistence/schema";
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
	const now = new Date().toISOString();
	return {
		id: row.id,
		type: toDiscrepancyType(row.status),
		...(row.sunatRecord !== undefined ? { sunatRecord: row.sunatRecord } : {}),
		...(row.localRecord !== undefined ? { localRecord: row.localRecord } : {}),
		diffAmount: Math.abs(row.difference),
		status:
			row.resolution === "ACCEPTED_SUNAT" || row.resolution === "KEPT_LOCAL"
				? "ACCEPTED"
				: "UNRESOLVED",
		createdAt: now,
		updatedAt: now,
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

function asDiscrepancyDTO(value: unknown): DiscrepancyDTO {
	return value as unknown as DiscrepancyDTO;
}

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
		const generatedAt = new Date();

		await db
			.insert(sireComparisons)
			.values({ companyId, period, rows, summary, generatedAt })
			.onConflictDoUpdate({
				target: [sireComparisons.companyId, sireComparisons.period],
				set: { rows, summary, generatedAt },
			});

		return { rows, summary };
	}

	private static async getResolvedDiscrepancies(
		companyId: string,
		period: string,
	): Promise<Record<string, DiscrepancyDTO>> {
		const resolutions = await db
			.select()
			.from(sireDiscrepancyResolutions)
			.where(
				and(
					eq(sireDiscrepancyResolutions.companyId, companyId),
					eq(sireDiscrepancyResolutions.period, period),
				),
			);

		return Object.fromEntries(
			resolutions.map((resolution) => [
				resolution.discrepancyId,
				asDiscrepancyDTO(resolution.resolutionData),
			]),
		);
	}

	static async getComparison(
		companyId: string,
		period: string,
	): Promise<{ summary: ComparisonSummary; discrepancies: DiscrepancyDTO[] }> {
		const { rows, summary } = await SireComparisonService.runComparison(
			companyId,
			period,
		);
		const resolvedDiscrepancies =
			await SireComparisonService.getResolvedDiscrepancies(companyId, period);
		const discrepancies = rows
			.filter((row) => row.status !== "MATCH")
			.map((row) => resolvedDiscrepancies[row.id] ?? toDiscrepancyDTO(row));

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
		const resolvedDiscrepancies =
			await SireComparisonService.getResolvedDiscrepancies(companyId, period);
		let discrepancies = rows
			.filter((row) => row.status !== "MATCH")
			.map((row) => resolvedDiscrepancies[row.id] ?? toDiscrepancyDTO(row));

		if (type) discrepancies = discrepancies.filter((d) => d.type === type);
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
		const [comparison] = await db
			.select()
			.from(sireComparisons)
			.where(
				and(
					eq(sireComparisons.companyId, companyId),
					eq(sireComparisons.period, period),
				),
			)
			.limit(1);
		const row = (comparison?.rows as SireDiffRow[] | undefined)?.find(
			(candidate) => candidate.id === id,
		);
		if (!row) {
			throw new Error(`Discrepancy ${id} not found. Run a comparison first.`);
		}

		const [persistedResolution] = await db
			.select()
			.from(sireDiscrepancyResolutions)
			.where(
				and(
					eq(sireDiscrepancyResolutions.companyId, companyId),
					eq(sireDiscrepancyResolutions.period, period),
					eq(sireDiscrepancyResolutions.discrepancyId, id),
				),
			)
			.limit(1);
		const existing = persistedResolution
			? asDiscrepancyDTO(persistedResolution.resolutionData)
			: toDiscrepancyDTO(row);
		const now = new Date();
		const newStatus: DiscrepancyResolution =
			action === "ACCEPT_SUNAT" || action === "ACCEPT_LOCAL"
				? "ACCEPTED"
				: action === "FLAG_FOR_REVIEW"
					? "FLAGGED"
					: "REVIEWING";
		const updatedNotes = notes ?? existing.notes;
		const updated: DiscrepancyDTO = {
			...existing,
			status: newStatus,
			...(updatedNotes !== undefined ? { notes: updatedNotes } : {}),
			updatedAt: now.toISOString(),
		};

		await db
			.insert(sireDiscrepancyResolutions)
			.values({
				companyId,
				period,
				discrepancyId: id,
				status: newStatus,
				notes: updated.notes ?? null,
				resolutionData: updated,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: [
					sireDiscrepancyResolutions.companyId,
					sireDiscrepancyResolutions.period,
					sireDiscrepancyResolutions.discrepancyId,
				],
				set: {
					status: newStatus,
					notes: updated.notes ?? null,
					resolutionData: updated,
					updatedAt: now,
				},
			});

		if (action === "ACCEPT_SUNAT" && row.sunatRecord) {
			await SireDiffLedgerService.applyResolutions({
				companyId,
				period,
				rows: [
					{
						rowId: row.id,
						status: row.status,
						decision: "ACCEPT_SUNAT",
						...(row.localRecord !== undefined
							? { localRecord: row.localRecord }
							: {}),
						sunatRecord: row.sunatRecord,
					},
				],
			}).catch(() => {});
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
			periods.push(
				`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
			);
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
