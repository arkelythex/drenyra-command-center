import type {
	EvidenceAggregateQuery,
	EvidenceEdge,
	EvidenceGraphRepository,
	EvidenceNode,
	FiscalTruthScope,
} from "@arkelythex/domain";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../client";
import { evidenceEdges, evidenceNodes } from "../schema/fiscal-truth.schema";
import type { DbTransaction } from "../unit-of-work";

function toOrganizationId(value: number | null): string | null {
	if (value === null || Number.isNaN(value)) {
		return null;
	}

	return String(value);
}

/**
 * Build a scope-level equality filter for the evidence_nodes table.
 * Includes ALL fiscal scope fields: organizationId, companyId, companyRuc, period, countryCode.
 */
function nodeScopeFilter(scope: FiscalTruthScope) {
	const conditions = [
		eq(evidenceNodes.companyId, scope.companyId),
		eq(evidenceNodes.companyRuc, scope.companyRuc),
		eq(evidenceNodes.period, scope.period),
		eq(evidenceNodes.countryCode, scope.countryCode),
	];

	if (scope.organizationId !== null) {
		conditions.push(
			eq(evidenceNodes.organizationId, String(scope.organizationId)),
		);
	} else {
		conditions.push(isNull(evidenceNodes.organizationId));
	}

	return and(...conditions);
}

/**
 * Build a scope-level equality filter for the evidence_edges table.
 * Includes ALL fiscal scope fields: organizationId, companyId, companyRuc, period, countryCode.
 */
function edgeScopeFilter(scope: FiscalTruthScope) {
	const conditions = [
		eq(evidenceEdges.companyId, scope.companyId),
		eq(evidenceEdges.companyRuc, scope.companyRuc),
		eq(evidenceEdges.period, scope.period),
		eq(evidenceEdges.countryCode, scope.countryCode),
	];

	if (scope.organizationId !== null) {
		conditions.push(
			eq(evidenceEdges.organizationId, String(scope.organizationId)),
		);
	} else {
		conditions.push(isNull(evidenceEdges.organizationId));
	}

	return and(...conditions);
}

function toDate(value: string): Date {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		throw new Error(`Invalid date value: ${value}`);
	}
	return date;
}

function mapNode(row: typeof evidenceNodes.$inferSelect): EvidenceNode {
	return {
		nodeId: row.nodeId,
		nodeKind: row.nodeKind as EvidenceNode["nodeKind"],
		scope: {
			companyId: row.companyId,
			companyRuc: row.companyRuc,
			organizationId: row.organizationId ? Number(row.organizationId) : null,
			period: row.period,
			countryCode: row.countryCode,
		},
		trace: {
			traceId: row.traceId,
			correlationId: row.correlationId,
			causationId: row.causationId,
		},
		hash: row.hash,
		createdAt: row.createdAt.toISOString(),
		metadata: row.metadata as Record<string, unknown>,
	};
}

function mapEdge(row: typeof evidenceEdges.$inferSelect): EvidenceEdge {
	return {
		edgeId: row.edgeId,
		fromNodeId: row.fromNodeId,
		toNodeId: row.toNodeId,
		edgeKind: row.edgeKind as EvidenceEdge["edgeKind"],
		scope: {
			companyId: row.companyId,
			companyRuc: row.companyRuc,
			organizationId: row.organizationId ? Number(row.organizationId) : null,
			period: row.period,
			countryCode: row.countryCode,
		},
		createdAt: row.createdAt.toISOString(),
	};
}

export class PostgresEvidenceGraphRepository
	implements EvidenceGraphRepository
{
	constructor(private readonly client: DbTransaction | typeof db = db) {}

	async appendNode(node: EvidenceNode): Promise<void> {
		await this.client.insert(evidenceNodes).values({
			nodeId: node.nodeId,
			nodeKind: node.nodeKind,
			companyId: node.scope.companyId,
			companyRuc: node.scope.companyRuc,
			organizationId: toOrganizationId(node.scope.organizationId),
			period: node.scope.period,
			countryCode: node.scope.countryCode,
			traceId: node.trace.traceId,
			correlationId: node.trace.correlationId,
			causationId: node.trace.causationId,
			hash: node.hash,
			createdAt: toDate(node.createdAt),
			metadata: node.metadata,
		});
	}

	async appendEdge(edge: EvidenceEdge): Promise<void> {
		await this.client.insert(evidenceEdges).values({
			edgeId: edge.edgeId,
			fromNodeId: edge.fromNodeId,
			toNodeId: edge.toNodeId,
			edgeKind: edge.edgeKind,
			companyId: edge.scope.companyId,
			companyRuc: edge.scope.companyRuc,
			organizationId: toOrganizationId(edge.scope.organizationId),
			period: edge.scope.period,
			countryCode: edge.scope.countryCode,
			createdAt: toDate(edge.createdAt),
		});
	}

	async findNodeById(
		nodeId: string,
		scope: FiscalTruthScope,
	): Promise<EvidenceNode | null> {
		const rows = await this.client
			.select()
			.from(evidenceNodes)
			.where(and(eq(evidenceNodes.nodeId, nodeId), nodeScopeFilter(scope)))
			.limit(1);

		const row = rows[0];
		return row ? mapNode(row) : null;
	}

	async findEdgesFromNode(
		nodeId: string,
		scope: FiscalTruthScope,
	): Promise<EvidenceEdge[]> {
		const rows = await this.client
			.select()
			.from(evidenceEdges)
			.where(and(eq(evidenceEdges.fromNodeId, nodeId), edgeScopeFilter(scope)));

		return rows.map(mapEdge);
	}

	async findEdgesToNode(
		nodeId: string,
		scope: FiscalTruthScope,
	): Promise<EvidenceEdge[]> {
		const rows = await this.client
			.select()
			.from(evidenceEdges)
			.where(and(eq(evidenceEdges.toNodeId, nodeId), edgeScopeFilter(scope)));

		return rows.map(mapEdge);
	}

	async listNodesByAggregateType(
		query: EvidenceAggregateQuery,
	): Promise<EvidenceNode[]> {
		const conditions = [
			sql`${evidenceNodes.metadata}->>'aggregateType' = ${query.aggregateType}`,
		];

		if (query.companyId) {
			conditions.push(eq(evidenceNodes.companyId, query.companyId));
		}
		if (query.companyRuc) {
			conditions.push(eq(evidenceNodes.companyRuc, query.companyRuc));
		}
		if (query.period) {
			conditions.push(eq(evidenceNodes.period, query.period));
		}
		if (query.countryCode) {
			conditions.push(eq(evidenceNodes.countryCode, query.countryCode));
		}
		if (query.organizationId !== undefined) {
			if (query.organizationId === null) {
				conditions.push(isNull(evidenceNodes.organizationId));
			} else {
				conditions.push(
					eq(evidenceNodes.organizationId, String(query.organizationId)),
				);
			}
		}

		const rows = await this.client
			.select()
			.from(evidenceNodes)
			.where(and(...conditions))
			.orderBy(desc(evidenceNodes.createdAt))
			.limit(query.limit ?? 200);

		return rows.map(mapNode);
	}
}
