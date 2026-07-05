/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */

import type { DrenyraMcpScope } from "@drenyra/agents";
import type { EvidenceGraphRepository } from "@drenyra/domain";
import { buildDrenyraDualSurfaceContract } from "@drenyra/domain/drenyra";
import type { DrenyraBrainRepository } from "../../drenyra/brain/brain.repository";

export interface PlatformMcpInvokeInput {
	toolName: string;
	scope: DrenyraMcpScope;
	arguments: Record<string, unknown>;
}

export interface PlatformMcpHandlersDeps {
	brainRepository?: Pick<DrenyraBrainRepository, "listThreads">;
	evidenceGraph?: Pick<
		EvidenceGraphRepository,
		"findNodeById" | "findEdgesFromNode"
	>;
}

function toDrenyraScope(scope: DrenyraMcpScope) {
	return {
		organizationId: scope.organizationId,
		companyId: scope.companyId,
		companyRuc: scope.companyRuc,
		period: scope.period,
		countryCode: scope.countryCode,
	};
}

function toFiscalTruthScope(scope: DrenyraMcpScope) {
	const parsedOrganizationId = Number.parseInt(scope.organizationId, 10);
	return {
		companyId: scope.companyId,
		companyRuc: scope.companyRuc,
		organizationId:
			Number.isSafeInteger(parsedOrganizationId) &&
			String(parsedOrganizationId) === scope.organizationId
				? parsedOrganizationId
				: null,
		period: scope.period,
		countryCode: scope.countryCode,
	};
}

function redactedMetadata(
	metadata: Record<string, unknown>,
): Record<string, unknown> {
	const allowedKeys = [
		"platform",
		"threadId",
		"turnId",
		"itemId",
		"eventType",
		"sequence",
		"sourceSurface",
		"period",
		"organizationId",
	] as const;
	return Object.fromEntries(
		allowedKeys
			.filter((key) => metadata[key] !== undefined)
			.map((key) => [key, metadata[key]]),
	);
}

function readStringArg(
	args: Record<string, unknown>,
	key: string,
): string | null {
	const value = args[key];
	return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function createPlatformMcpHandlers(deps: PlatformMcpHandlersDeps = {}) {
	return async function invoke(
		input: PlatformMcpInvokeInput,
	): Promise<unknown> {
		switch (input.toolName) {
			case "drenyra.contract.read":
				return buildDrenyraDualSurfaceContract();
			case "drenyra.brain.list_threads":
				return deps.brainRepository
					? deps.brainRepository.listThreads(toDrenyraScope(input.scope))
					: [];
			case "fiscal_truth.evidence.read_graph": {
				const nodeId = readStringArg(input.arguments, "nodeId");
				if (!nodeId) throw new Error("nodeId is required");
				if (!deps.evidenceGraph) return { node: null, edges: [] };
				const scope = toFiscalTruthScope(input.scope);
				const node = await deps.evidenceGraph.findNodeById(nodeId, scope);
				const edges = node
					? await deps.evidenceGraph.findEdgesFromNode(nodeId, scope)
					: [];
				return {
					node: node
						? { ...node, metadata: redactedMetadata(node.metadata) }
						: null,
					edges,
				};
			}
			default:
				throw new Error("Unsupported MCP tool");
		}
	};
}
