import { randomUUID } from "node:crypto";
import type {
	CierreMensual,
	CierreMensualChecklistItem,
	ExpedienteFiscal,
	ExpedienteKind,
	ExpedienteStatus,
	FiscalTruthScope,
} from "@drenyra/domain";
import {
	buildDefaultCierreChecklist,
	calculateCierreProgress,
} from "@drenyra/domain";
import { eq } from "drizzle-orm";
import { db, schema } from "../../../lib/db";
import { hasSireDiffCommitAuditForPeriod } from "../../sire/services/sire-diff-commit-audit.service";
import {
	type ExpedienteEvidenceRepository,
	expedienteEvidenceRepository,
} from "../infrastructure/expediente-evidence.repository";
import { applySireDiffCommitChecklistGate } from "./cierre-sire-diff-gate";

export interface ExpedienteListFilters {
	companyId: string;
	companyRuc: string;
	organizationId: number | null;
	period?: string;
	kind?: ExpedienteKind;
}

function defaultTrace() {
	const id = randomUUID();
	return { traceId: id, correlationId: id };
}

function buildExpedienteId(periodo: string, ruc: string): string {
	return `EXP-${periodo}-${ruc.slice(-4)}-${randomUUID().slice(0, 8)}`;
}

export class ExpedienteService {
	constructor(
		private readonly repository: ExpedienteEvidenceRepository = expedienteEvidenceRepository,
	) {}

	async resolveCompanyName(companyId: string): Promise<string> {
		const row = await db
			.select({ businessName: schema.companies.businessName })
			.from(schema.companies)
			.where(eq(schema.companies.id, companyId))
			.limit(1);
		return row[0]?.businessName ?? "Empresa";
	}

	toScope(input: {
		companyId: string;
		companyRuc: string;
		organizationId: number | null;
		period: string;
	}): FiscalTruthScope {
		return {
			companyId: input.companyId,
			companyRuc: input.companyRuc,
			organizationId: input.organizationId,
			period: input.period,
			countryCode: "PE",
		};
	}

	async listExpedientes(
		filters: ExpedienteListFilters,
	): Promise<ExpedienteFiscal[]> {
		const items = await this.repository.listExpedientes(filters);
		if (filters.kind) {
			return items.filter((item) => item.kind === filters.kind);
		}
		return items;
	}

	async getExpediente(
		expedienteId: string,
		scope: FiscalTruthScope,
	): Promise<ExpedienteFiscal | null> {
		return this.repository.getExpediente(expedienteId, scope);
	}

	async createExpediente(input: {
		companyId: string;
		companyRuc: string;
		organizationId: number | null;
		periodo: string;
		kind: ExpedienteKind;
		titulo: string;
		descripcion?: string;
	}): Promise<ExpedienteFiscal> {
		const companyName = await this.resolveCompanyName(input.companyId);
		const now = new Date().toISOString();
		const id = buildExpedienteId(input.periodo, input.companyRuc);
		const scope = this.toScope({
			companyId: input.companyId,
			companyRuc: input.companyRuc,
			organizationId: input.organizationId,
			period: input.periodo,
		});

		const expediente: ExpedienteFiscal = {
			id,
			companyRuc: input.companyRuc,
			companyName,
			periodo: input.periodo,
			kind: input.kind,
			status: "ABIERTO",
			titulo: input.titulo,
			descripcion: input.descripcion ?? "",
			createdAt: now,
			updatedAt: now,
			acciones: [],
			documentos: [],
			evidencia: [],
			requiredApprovers: [],
			approvedBy: [],
			globalRiskLevel: "LOW",
			pendingActions: 0,
			totalDocuments: 0,
		};

		return this.repository.saveExpediente(expediente, scope, defaultTrace());
	}

	async updateExpedienteStatus(input: {
		expedienteId: string;
		scope: FiscalTruthScope;
		status: ExpedienteStatus;
	}): Promise<ExpedienteFiscal | null> {
		const existing = await this.repository.getExpediente(
			input.expedienteId,
			input.scope,
		);
		if (!existing) return null;

		const updated: ExpedienteFiscal = {
			...existing,
			status: input.status,
			closedAt:
				input.status === "CERRADO"
					? new Date().toISOString()
					: existing.closedAt,
		};

		return this.repository.saveExpediente(updated, input.scope, defaultTrace());
	}

	async getOrCreateCierreMensual(input: {
		companyId: string;
		companyRuc: string;
		organizationId: number | null;
		periodo: string;
	}): Promise<CierreMensual> {
		const scope = this.toScope({
			companyId: input.companyId,
			companyRuc: input.companyRuc,
			organizationId: input.organizationId,
			period: input.periodo,
		});

		const existing = await this.repository.getCierreMensual(scope);
		if (existing) {
			return this.syncCierreWithSireDiffAudit(existing, scope, input.companyId);
		}

		const companyName = await this.resolveCompanyName(input.companyId);
		let expediente = (
			await this.repository.listExpedientes({
				companyId: input.companyId,
				companyRuc: input.companyRuc,
				organizationId: input.organizationId,
				period: input.periodo,
			})
		).find((entry) => entry.kind === "CIERRE_MENSUAL");

		if (!expediente) {
			expediente = await this.createExpediente({
				companyId: input.companyId,
				companyRuc: input.companyRuc,
				organizationId: input.organizationId,
				periodo: input.periodo,
				kind: "CIERRE_MENSUAL",
				titulo: `Cierre Mensual ${input.periodo}`,
				descripcion: `Cierre contable y fiscal del período ${input.periodo}.`,
			});
		}

		const checklist = buildDefaultCierreChecklist(expediente.id);
		const now = new Date().toISOString();
		const cierre: CierreMensual = {
			id: `CIERRE-${input.periodo}-${input.companyRuc}`,
			companyRuc: input.companyRuc,
			companyName,
			periodo: input.periodo,
			status: "EN_PROCESO",
			startedAt: now,
			checklist,
			progress: calculateCierreProgress(checklist),
			expedienteId: expediente.id,
			firmas: {
				contador: { firmado: false },
				revisor: { firmado: false },
				representante: { firmado: false },
			},
			sireStatus: "PENDIENTE",
			bancosStatus: "PENDIENTE",
			igvStatus: "PENDIENTE",
			globalRiskLevel: "MEDIUM",
		};

		const saved = await this.repository.saveCierreMensual(
			cierre,
			scope,
			defaultTrace(),
		);
		return this.syncCierreWithSireDiffAudit(saved, scope, input.companyId);
	}

	private async syncCierreWithSireDiffAudit(
		cierre: CierreMensual,
		scope: FiscalTruthScope,
		companyId: string,
	): Promise<CierreMensual> {
		const hasAudit = await hasSireDiffCommitAuditForPeriod({
			companyId,
			period: cierre.periodo,
		});
		const synced = applySireDiffCommitChecklistGate(cierre, hasAudit);
		if (synced === cierre) {
			return cierre;
		}
		return (
			(await this.repository.saveCierreMensual(
				synced,
				scope,
				defaultTrace(),
			)) ?? cierre
		);
	}

	async updateCierreChecklist(input: {
		scope: FiscalTruthScope;
		itemId: string;
		completado: boolean;
	}): Promise<CierreMensual | null> {
		const cierre = await this.repository.getCierreMensual(input.scope);
		if (!cierre) return null;

		const checklist: CierreMensualChecklistItem[] = cierre.checklist.map(
			(item) =>
				item.id === input.itemId
					? { ...item, completado: input.completado }
					: item,
		);

		const updated: CierreMensual = {
			...cierre,
			checklist,
			progress: calculateCierreProgress(checklist),
		};

		return this.repository.saveCierreMensual(
			updated,
			input.scope,
			defaultTrace(),
		);
	}

	async linkDocument(input: {
		expedienteId: string;
		documentId: string;
		scope: FiscalTruthScope;
	}): Promise<void> {
		await this.repository.linkDocumentToExpediente({
			expedienteId: input.expedienteId,
			documentId: input.documentId,
			scope: input.scope,
			trace: defaultTrace(),
		});
	}
}

export const expedienteService = new ExpedienteService();
