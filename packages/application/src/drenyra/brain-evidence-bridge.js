import {
	EVIDENCE_EDGE_KIND,
	EVIDENCE_NODE_KIND,
	isFiscalTruthScope,
} from "@drenyra/domain";

function organizationIdToNumber(value) {
	if (!value) return null;
	const parsed = Number.parseInt(value, 10);
	return Number.isSafeInteger(parsed) && String(parsed) === value
		? parsed
		: null;
}
export function toFiscalTruthScope(scope) {
	const fiscalTruthScope = {
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
function evidenceKindFor(event) {
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
function stableJson(value) {
	if (value === null || typeof value !== "object") return JSON.stringify(value);
	if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
	const record = value;
	return `{${Object.keys(record)
		.sort()
		.map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
		.join(",")}}`;
}
export function createDrenyraBrainEvidenceBridge(deps) {
	return {
		async appendEvent(event) {
			const scope = toFiscalTruthScope(event.fiscalScope);
			const isThreadRoot = event.type === "thread_created";
			const nodeId = isThreadRoot
				? `drenyra-brain-thread:${event.threadId}`
				: `drenyra-brain-event:${event.id}`;
			const hash = await deps.digest(stableJson(event));
			const node = {
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
				const edge = {
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
//# sourceMappingURL=brain-evidence-bridge.js.map
