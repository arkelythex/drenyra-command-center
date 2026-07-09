import { and, eq, isNull } from "drizzle-orm";
import { db } from "../client";
import { evidenceEdges, evidenceNodes } from "../schema/fiscal-truth.schema";

function toOrganizationId(value) {
	if (value === null || Number.isNaN(value)) {
		return null;
	}
	return String(value);
}
function nodeScopeFilter(scope) {
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
function edgeScopeFilter(scope) {
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
function toDate(value) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		throw new Error(`Invalid date value: ${value}`);
	}
	return date;
}
function mapNode(row) {
	return {
		nodeId: row.nodeId,
		nodeKind: row.nodeKind,
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
		metadata: row.metadata,
	};
}
function mapEdge(row) {
	return {
		edgeId: row.edgeId,
		fromNodeId: row.fromNodeId,
		toNodeId: row.toNodeId,
		edgeKind: row.edgeKind,
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
export class PostgresEvidenceGraphRepository {
	client;
	constructor(client = db) {
		this.client = client;
	}
	async appendNode(node) {
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
	async appendEdge(edge) {
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
	async findNodeById(nodeId, scope) {
		const rows = await this.client
			.select()
			.from(evidenceNodes)
			.where(and(eq(evidenceNodes.nodeId, nodeId), nodeScopeFilter(scope)))
			.limit(1);
		const row = rows[0];
		return row ? mapNode(row) : null;
	}
	async findEdgesFromNode(nodeId, scope) {
		const rows = await this.client
			.select()
			.from(evidenceEdges)
			.where(and(eq(evidenceEdges.fromNodeId, nodeId), edgeScopeFilter(scope)));
		return rows.map(mapEdge);
	}
	async findEdgesToNode(nodeId, scope) {
		const rows = await this.client
			.select()
			.from(evidenceEdges)
			.where(and(eq(evidenceEdges.toNodeId, nodeId), edgeScopeFilter(scope)));
		return rows.map(mapEdge);
	}
}
