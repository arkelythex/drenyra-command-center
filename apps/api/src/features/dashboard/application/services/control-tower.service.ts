import { db } from "@arkelythex/persistence/client";
import { and, eq, inArray, sql } from "@arkelythex/persistence/query";
import { companies, documents } from "@arkelythex/persistence/schema";
import { expedienteService } from "../../../expedientes/application/expediente.service";
import { resolveOrganizationId } from "../../../journal-entries/application/_helpers";
import { FiscalIndicatorsService } from "./fiscal-indicators.service";

export interface ControlTowerCompanyRow {
	companyId: string;
	ruc: string;
	businessName: string;
	healthScore: number;
	globalRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	pendingDocuments: number;
	pendingExpedientes: number;
	nextDeadline: string | null;
	obligationsDue: number;
	period: string;
}

export interface ControlTowerPortfolio {
	period: string;
	companies: ControlTowerCompanyRow[];
	buzonSol: { status: "STUB"; message: string };
}

function currentPeriod(): string {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function computeHealthScore(input: {
	pendingDocuments: number;
	pendingExpedientes: number;
	globalRiskLevel: ControlTowerCompanyRow["globalRiskLevel"];
}): number {
	let score = 100;
	score -= Math.min(input.pendingDocuments * 3, 30);
	score -= Math.min(input.pendingExpedientes * 5, 25);
	if (input.globalRiskLevel === "CRITICAL") score -= 30;
	if (input.globalRiskLevel === "HIGH") score -= 20;
	if (input.globalRiskLevel === "MEDIUM") score -= 10;
	return Math.max(0, Math.min(100, score));
}

export class ControlTowerService {
	static async getPortfolio(input: {
		ownerCompanyId: string;
		period?: string;
	}): Promise<ControlTowerPortfolio> {
		const period = input.period ?? currentPeriod();
		const owner = await db
			.select({
				ownerId: companies.ownerId,
				economicGroupId: companies.economicGroupId,
			})
			.from(companies)
			.where(eq(companies.id, input.ownerCompanyId))
			.limit(1);

		const ownerId = owner[0]?.ownerId;
		const economicGroupId = owner[0]?.economicGroupId;

		const companyRows = economicGroupId
			? await db
					.select({
						id: companies.id,
						ruc: companies.ruc,
						businessName: companies.businessName,
					})
					.from(companies)
					.where(
						and(
							eq(companies.economicGroupId, economicGroupId),
							eq(companies.isActive, true),
						),
					)
			: ownerId
				? await db
						.select({
							id: companies.id,
							ruc: companies.ruc,
							businessName: companies.businessName,
						})
						.from(companies)
						.where(
							and(eq(companies.ownerId, ownerId), eq(companies.isActive, true)),
						)
				: [];

		const calendarResult = await FiscalIndicatorsService.getTaxCalendar(
			input.ownerCompanyId,
		);
		const calendar = calendarResult.obligations ?? [];
		const obligationsDue = calendar.filter(
			(item: { status: string }) =>
				item.status === "PENDING" || item.status === "OVERDUE",
		).length;
		const nextDeadline =
			calendar.find(
				(item: { status: string; dueDate?: string }) =>
					item.status === "PENDING",
			)?.dueDate ?? null;

		const companyIds = companyRows.map((row) => row.id);
		const pendingDocCounts =
			companyIds.length > 0
				? await db
						.select({
							companyId: documents.companyId,
							count: sql<number>`COUNT(*)`,
						})
						.from(documents)
						.where(
							and(
								inArray(documents.companyId, companyIds),
								inArray(documents.status, [
									"por_procesar",
									"procesando",
									"revision_humana",
									"UPLOADED",
								]),
							),
						)
						.groupBy(documents.companyId)
				: [];

		const pendingDocMap = new Map(
			pendingDocCounts.map((row) => [row.companyId, Number(row.count) || 0]),
		);

		const portfolioCompanies: ControlTowerCompanyRow[] = [];
		for (const company of companyRows) {
			let organizationId: number | null = null;
			try {
				organizationId = await resolveOrganizationId(company.id);
			} catch {
				organizationId = null;
			}

			const expedientes = organizationId
				? await expedienteService.listExpedientes({
						companyId: company.id,
						companyRuc: company.ruc,
						organizationId,
						period,
					})
				: [];

			const pendingExpedientes = expedientes.filter(
				(entry) => entry.status !== "CERRADO" && entry.status !== "ARCHIVADO",
			).length;

			const highestRisk = expedientes.reduce<
				ControlTowerCompanyRow["globalRiskLevel"]
			>((acc, entry) => {
				const order = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
				return order[entry.globalRiskLevel] > order[acc]
					? entry.globalRiskLevel
					: acc;
			}, "LOW");

			const pendingDocuments = pendingDocMap.get(company.id) ?? 0;

			portfolioCompanies.push({
				companyId: company.id,
				ruc: company.ruc,
				businessName: company.businessName,
				globalRiskLevel: highestRisk,
				pendingDocuments,
				pendingExpedientes,
				healthScore: computeHealthScore({
					pendingDocuments,
					pendingExpedientes,
					globalRiskLevel: highestRisk,
				}),
				nextDeadline,
				obligationsDue,
				period,
			});
		}

		return {
			period,
			companies: portfolioCompanies.sort(
				(a, b) => a.healthScore - b.healthScore,
			),
			buzonSol: {
				status: "STUB",
				message: "Buzón SOL integration pending — placeholder only.",
			},
		};
	}
}
