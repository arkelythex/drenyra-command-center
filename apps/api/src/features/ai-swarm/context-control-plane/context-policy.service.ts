import { randomUUID } from "node:crypto";
import {
	CONTEXT_APPROVAL_STATES,
	CONTEXT_POLICY_VIOLATION_CODES,
	CONTEXT_RETRIEVAL_MODES,
	type ContextPolicySelectionRequestDTO,
	type ContextPolicySelectionResponseDTO,
	type ContextPolicyViolationDTO,
} from "@arkelythex/application";
import {
	type ContextControlPlaneRegistry,
	contextControlPlaneRegistry,
} from "./context-registry";

function dedupe(values: readonly string[] | undefined): string[] {
	return Array.from(
		new Set((values ?? []).map((value) => value.trim()).filter(Boolean)),
	);
}

function buildBlockedResponse(
	request: ContextPolicySelectionRequestDTO,
	violations: ContextPolicyViolationDTO[],
): ContextPolicySelectionResponseDTO {
	return {
		traceId: request.traceId?.trim() || randomUUID(),
		surfaceId: request.surfaceId,
		tenantScope: null,
		allowed: false,
		retrievalMode: CONTEXT_RETRIEVAL_MODES.MEMORY_ONLY,
		approvalState: CONTEXT_APPROVAL_STATES.NOT_REQUIRED,
		allowedTools: [],
		allowedCorpora: [],
		contextWindow: null,
		deterministicFallback: null,
		violations,
	};
}

export class ContextPolicyService {
	constructor(
		private readonly registry: ContextControlPlaneRegistry = contextControlPlaneRegistry,
	) {}

	resolve(
		request: ContextPolicySelectionRequestDTO,
	): ContextPolicySelectionResponseDTO {
		const surface = this.registry.get(request.surfaceId);
		if (!surface) {
			return buildBlockedResponse(request, [
				{
					code: CONTEXT_POLICY_VIOLATION_CODES.UNKNOWN_SURFACE,
					message: `Surface '${request.surfaceId}' is not registered in the control plane.`,
					subject: request.surfaceId,
				},
			]);
		}

		const requestedTools = dedupe(request.requestedTools);
		const requestedCorpora = dedupe(request.requestedCorpora);
		const violations: ContextPolicyViolationDTO[] = [];
		const allowedTools = new Set(surface.allowedTools);
		const allowedCorpora = new Map(
			surface.allowedCorpora.map((corpus) => [corpus.corpusId, corpus]),
		);

		for (const toolId of requestedTools) {
			if (!allowedTools.has(toolId)) {
				violations.push({
					code: CONTEXT_POLICY_VIOLATION_CODES.TOOL_NOT_ALLOWED,
					message: `Tool '${toolId}' is not allowed for '${surface.surfaceId}'.`,
					subject: toolId,
				});
			}
		}

		for (const corpusId of requestedCorpora) {
			const corpus = allowedCorpora.get(corpusId);
			if (!corpus) {
				violations.push({
					code: CONTEXT_POLICY_VIOLATION_CODES.CORPUS_NOT_ALLOWED,
					message: `Corpus '${corpusId}' is not approved for '${surface.surfaceId}'.`,
					subject: corpusId,
				});
				continue;
			}

			if (corpus.kind !== "documentary") {
				violations.push({
					code: CONTEXT_POLICY_VIOLATION_CODES.DOCUMENTARY_RAG_ONLY,
					message: `Hybrid retrieval only allows documentary corpora for '${surface.surfaceId}'.`,
					subject: corpusId,
				});
			}
		}

		const retrievalMode =
			requestedCorpora.length > 0
				? CONTEXT_RETRIEVAL_MODES.HYBRID_DOCUMENTARY
				: surface.retrievalDefault;

		return {
			traceId: request.traceId?.trim() || randomUUID(),
			surfaceId: surface.surfaceId,
			tenantScope: surface.tenantScope,
			allowed: violations.length === 0,
			retrievalMode,
			approvalState:
				surface.approvalsRequired.length > 0
					? CONTEXT_APPROVAL_STATES.PENDING
					: CONTEXT_APPROVAL_STATES.NOT_REQUIRED,
			allowedTools: [...surface.allowedTools],
			allowedCorpora: surface.allowedCorpora.map((corpus) => corpus.corpusId),
			contextWindow: surface.contextWindow,
			deterministicFallback: surface.deterministicFallback,
			violations,
		};
	}
}

export const contextPolicyService = new ContextPolicyService();
