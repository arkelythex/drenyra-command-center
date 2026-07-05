import { createHash, randomUUID } from "node:crypto";
import type {
	CierreMensual,
	ExpedienteFiscal,
	FiscalTruthScope,
} from "@drenyra/domain";
import { EVIDENCE_EDGE_KIND, EVIDENCE_NODE_KIND } from "@drenyra/domain";
import { PostgresEvidenceGraphRepository } from "@drenyra/persistence";

import {
	CIERRE_AGGREGATE_TYPE,
	EXPEDIENTE_AGGREGATE_TYPE,
} from "../domain/constants";

function hashPayload(payload: unknown): string {
	return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function dedupeLatestByKey<T extends { id: string }>(
	nodes: Array<{ createdAt: string; payload: T }>,
): T[] {
	const latest = new Map<string, { createdAt: string; payload: T }>();
	for (const node of nodes) {
		const existing = latest.get(node.payload.id);
		if (!existing || node.createdAt > existing.createdAt) {
			latest.set(node.payload.id, node);
		}
	}
	return [...latest.values()]
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
		.map((entry) => entry.payload);
}

export class ExpedienteEvidenceRepository {
	constructor(
		private readonly evidenceGraph = new PostgresEvidenceGraphRepository(),
	) {}

	async listExpedientes(scope: {
		companyId: string;
		companyRuc: string;
		organizationId: number | null;
		period?: string;
	}): Promise<ExpedienteFiscal[]> {
		const nodes = await this.evidenceGraph.listNodesByAggregateType({
			aggregateType: EXPEDIENTE_AGGREGATE_TYPE,
			companyId: scope.companyId,
			companyRuc: scope.companyRuc,
			organizationId: scope.organizationId,
			period: scope.period,
			countryCode: "PE",
		});

		const parsed = nodes
			.map((node) => ({
				createdAt: node.createdAt,
				payload: node.metadata.expediente as ExpedienteFiscal | undefined,
			}))
			.filter(
				(entry): entry is { createdAt: string; payload: ExpedienteFiscal } =>
					Boolean(entry.payload?.id),
			);

		return dedupeLatestByKey(parsed);
	}

	async getExpediente(
		expedienteId: string,
		scope: FiscalTruthScope,
	): Promise<ExpedienteFiscal | null> {
		const expedientes = await this.listExpedientes({
			companyId: scope.companyId,
			companyRuc: scope.companyRuc,
			organizationId: scope.organizationId,
			period: scope.period,
		});
		return expedientes.find((entry) => entry.id === expedienteId) ?? null;
	}

	async saveExpediente(
		expediente: ExpedienteFiscal,
		scope: FiscalTruthScope,
		trace: { traceId: string; correlationId: string; causationId?: string },
	): Promise<ExpedienteFiscal> {
		const now = new Date().toISOString();
		const payload: ExpedienteFiscal = {
			...expediente,
			updatedAt: now,
		};

		await this.evidenceGraph.appendNode({
			nodeId: randomUUID(),
			nodeKind: EVIDENCE_NODE_KIND.SOURCE_INPUT,
			scope,
			trace: {
				traceId: trace.traceId,
				correlationId: trace.correlationId,
				causationId: trace.causationId ?? null,
			},
			hash: hashPayload(payload),
			createdAt: now,
			metadata: {
				aggregateType: EXPEDIENTE_AGGREGATE_TYPE,
				expedienteId: payload.id,
				expediente: payload,
			},
		});

		return payload;
	}

	async linkDocumentToExpediente(input: {
		expedienteId: string;
		documentId: string;
		scope: FiscalTruthScope;
		trace: { traceId: string; correlationId: string };
	}): Promise<void> {
		const documentNodeId = randomUUID();
		const expedienteNodeId = randomUUID();
		const now = new Date().toISOString();

		await this.evidenceGraph.appendNode({
			nodeId: documentNodeId,
			nodeKind: EVIDENCE_NODE_KIND.SOURCE_INPUT,
			scope: input.scope,
			trace: {
				traceId: input.trace.traceId,
				correlationId: input.trace.correlationId,
				causationId: null,
			},
			hash: hashPayload({ documentId: input.documentId }),
			createdAt: now,
			metadata: {
				aggregateType: "document_link",
				documentId: input.documentId,
				expedienteId: input.expedienteId,
			},
		});

		await this.evidenceGraph.appendNode({
			nodeId: expedienteNodeId,
			nodeKind: EVIDENCE_NODE_KIND.SOURCE_INPUT,
			scope: input.scope,
			trace: {
				traceId: input.trace.traceId,
				correlationId: input.trace.correlationId,
				causationId: documentNodeId,
			},
			hash: hashPayload({ expedienteId: input.expedienteId }),
			createdAt: now,
			metadata: {
				aggregateType: "expediente_anchor",
				expedienteId: input.expedienteId,
			},
		});

		await this.evidenceGraph.appendEdge({
			edgeId: randomUUID(),
			fromNodeId: documentNodeId,
			toNodeId: expedienteNodeId,
			edgeKind: EVIDENCE_EDGE_KIND.DERIVES_FROM,
			scope: input.scope,
			createdAt: now,
		});
	}

	async getCierreMensual(
		scope: FiscalTruthScope,
	): Promise<CierreMensual | null> {
		const nodes = await this.evidenceGraph.listNodesByAggregateType({
			aggregateType: CIERRE_AGGREGATE_TYPE,
			companyId: scope.companyId,
			companyRuc: scope.companyRuc,
			organizationId: scope.organizationId,
			period: scope.period,
			countryCode: scope.countryCode,
			limit: 50,
		});

		const parsed = nodes
			.map((node) => ({
				createdAt: node.createdAt,
				payload: node.metadata.cierre as CierreMensual | undefined,
			}))
			.filter((entry): entry is { createdAt: string; payload: CierreMensual } =>
				Boolean(entry.payload?.id),
			);

		const latest = dedupeLatestByKey(parsed);
		return latest[0] ?? null;
	}

	async saveCierreMensual(
		cierre: CierreMensual,
		scope: FiscalTruthScope,
		trace: { traceId: string; correlationId: string },
	): Promise<CierreMensual> {
		const now = new Date().toISOString();
		await this.evidenceGraph.appendNode({
			nodeId: randomUUID(),
			nodeKind: EVIDENCE_NODE_KIND.SOURCE_INPUT,
			scope,
			trace: {
				traceId: trace.traceId,
				correlationId: trace.correlationId,
				causationId: null,
			},
			hash: hashPayload(cierre),
			createdAt: now,
			metadata: {
				aggregateType: CIERRE_AGGREGATE_TYPE,
				cierreId: cierre.id,
				expedienteId: cierre.expedienteId,
				cierre,
			},
		});
		return cierre;
	}
}

export const expedienteEvidenceRepository = new ExpedienteEvidenceRepository();
