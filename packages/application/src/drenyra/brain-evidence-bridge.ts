/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
import {
	EVIDENCE_EDGE_KIND,
	EVIDENCE_NODE_KIND,
	isFiscalTruthScope,
	type EvidenceEdge,
	type EvidenceGraphRepository,
	type EvidenceNode,
	type EvidenceNodeKind,
	type FiscalTruthScope,
} from "@drenyra/domain";
import type {
	DrenyraBrainEvent,
	DrenyraFiscalScope,
} from "@drenyra/domain/drenyra";

export interface DrenyraBrainEvidenceBridgeDeps {
	appendNode: EvidenceGraphRepository["appendNode"];
	appendEdge: EvidenceGraphRepository["appendEdge"];
	digest: (value: string) => Promise<string>;
}

export interface DrenyraBrainEvidenceBridge {
	appendEvent(event: DrenyraBrainEvent): Promise<EvidenceNode>;
}

function organizationIdToNumber(value: string | undefined): number | null {
	if (!value) return null;
	const parsed = Number.parseInt(value, 10);
	return Number.isSafeInteger(parsed) && String(parsed) === value ? parsed : null;
}

export function toFiscalTruthScope(
	scope: DrenyraFiscalScope,
): FiscalTruthScope {
	const fiscalTruthScope: FiscalTruthScope = {
		companyId: scope.companyId,
		companyRuc: scope.companyRuc,
		organizationId: organizationIdToNumber(scope.organizationId),
		period: scope.period,
		countryCode: scope.countryCode,
	};

	if (!isFiscalTruthScope(fiscalTruthScope)) {
		throw new Error("Invalid fiscal truth scope for Drenyra Brain evidence.");
	}

	return fiscalTruthScope;
}

function evidenceKindFor(event: DrenyraBrainEvent): EvidenceNodeKind {
	const itemType = event.metadata.itemType;
	if (event.type === "approval_updated") return EVIDENCE_NODE_KIND.APPROVAL;
	if (itemType === "user_message") return EVIDENCE_NODE_KIND.SOURCE_INPUT;
	if (itemType === "approval_requested" || itemType === "approval_resolved") {
		return EVIDENCE_NODE_KIND.APPROVAL;
	}
	if (event.type === "thread_created" || event.type === "turn_started") {
		return EVIDENCE_NODE_KIND.SOURCE_INPUT;
	}
	return EVIDENCE_NODE_KIND.AI_SUGGESTION;
}

function stableJson(value: unknown): string {
	if (value === null || typeof value !== "object") return JSON.stringify(value);
	if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
	const record = value as Record<string, unknown>;
	return `{${Object.keys(record)
		.sort()
		.map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
		.join(",")}}`;
}

export function createDrenyraBrainEvidenceBridge(
	deps: DrenyraBrainEvidenceBridgeDeps,
): DrenyraBrainEvidenceBridge {
	return {
		async appendEvent(event) {
			const scope = toFiscalTruthScope(event.fiscalScope);
			const isThreadRoot = event.type === "thread_created";
			const nodeId = isThreadRoot
				? `drenyra-brain-thread:${event.threadId}`
				: `drenyra-brain-event:${event.id}`;
			const hash = await deps.digest(stableJson(event));
			const node: EvidenceNode = {
				nodeId,
				nodeKind: evidenceKindFor(event),
				scope,
				trace: {
					traceId: event.id,
					correlationId: event.threadId,
					causationId: event.turnId ?? null,
				},
				hash,
				createdAt: event.createdAt,
				metadata: {
					platform: "drenyra-brain",
					threadId: event.threadId,
					turnId: event.turnId,
					itemId: event.itemId,
					eventType: event.type,
					sequence: event.sequence,
					actorId: event.actorId,
					sourceSurface: event.sourceSurface,
					period: event.fiscalScope.period,
					organizationId: event.fiscalScope.organizationId,
					metadata: event.metadata,
				},
			};

			await deps.appendNode(node);

			if (!isThreadRoot) {
				const edge: EvidenceEdge = {
					edgeId: `drenyra-brain-edge:${event.id}:thread`,
					fromNodeId: nodeId,
					toNodeId: `drenyra-brain-thread:${event.threadId}`,
					edgeKind: EVIDENCE_EDGE_KIND.DERIVES_FROM,
					scope,
					createdAt: event.createdAt,
				};
				await deps.appendEdge(edge);
			}

			return node;
		},
	};
}
