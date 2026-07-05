import type {
	EvidenceGraphRepository,
	FiscalTruthScope,
	ReplayRepository,
	ReplayResult,
} from "@drenyra/domain";
import { REPLAY_FAILURE_CODE, toReplayFailureResult } from "@drenyra/domain";

export interface ReplayFiscalTruthInput {
	aggregateId: string;
	scope: FiscalTruthScope;
}

export interface ReplayFiscalTruthServiceDependencies {
	loadEventChain: ReplayRepository["loadEventChain"];
	findNodeById: EvidenceGraphRepository["findNodeById"];
	saveReplayResult: ReplayRepository["saveReplayResult"];
}

/**
 * Rebuilds authoritative outcomes from persisted chain and evidence roots.
 */
export class ReplayFiscalTruthService {
	constructor(private readonly deps: ReplayFiscalTruthServiceDependencies) {}

	async execute(input: ReplayFiscalTruthInput): Promise<ReplayResult> {
		const eventChain = await this.deps.loadEventChain(
			input.aggregateId,
			input.scope,
		);

		if (eventChain.length === 0) {
			const result = toReplayFailureResult(
				REPLAY_FAILURE_CODE.MISSING_EVIDENCE,
				"No authoritative events found for replay.",
			);
			await this.deps.saveReplayResult(input.aggregateId, result, input.scope);
			return result;
		}

		for (const event of eventChain) {
			const rootNode = await this.deps.findNodeById(
				event.evidenceRootNodeId,
				input.scope,
			);
			if (!rootNode) {
				const result = toReplayFailureResult(
					REPLAY_FAILURE_CODE.MISSING_EVIDENCE,
					`Missing evidence root for event ${event.eventId}.`,
				);
				await this.deps.saveReplayResult(
					input.aggregateId,
					result,
					input.scope,
				);
				return result;
			}

			if (rootNode.hash !== event.evidenceBundleHash) {
				const result = toReplayFailureResult(
					REPLAY_FAILURE_CODE.HASH_MISMATCH,
					`Evidence hash mismatch for event ${event.eventId}.`,
				);
				await this.deps.saveReplayResult(
					input.aggregateId,
					result,
					input.scope,
				);
				return result;
			}

			const provenance = (
				event.payload as {
					provenance?: {
						validatorResults?: Array<{ validatorVersion: string }>;
						policyDecision?: { policyVersion: string };
						approval?: { required?: boolean };
					};
				}
			).provenance;

			const validatorResults = provenance?.validatorResults ?? [];
			const hasValidatorVersion = validatorResults.some(
				(result) => result.validatorVersion === event.validatorSetVersion,
			);

			if (!hasValidatorVersion) {
				const result = toReplayFailureResult(
					REPLAY_FAILURE_CODE.VALIDATOR_VERSION_MISSING,
					`Missing validator version dependency for event ${event.eventId}.`,
				);
				await this.deps.saveReplayResult(
					input.aggregateId,
					result,
					input.scope,
				);
				return result;
			}

			if (provenance?.policyDecision?.policyVersion !== event.policyVersion) {
				const result = toReplayFailureResult(
					REPLAY_FAILURE_CODE.POLICY_VERSION_MISSING,
					`Missing policy version dependency for event ${event.eventId}.`,
				);
				await this.deps.saveReplayResult(
					input.aggregateId,
					result,
					input.scope,
				);
				return result;
			}

			if (provenance?.approval?.required && !event.approvalId?.trim()) {
				const result = toReplayFailureResult(
					REPLAY_FAILURE_CODE.MISSING_EVIDENCE,
					`Missing approval dependency for event ${event.eventId}.`,
				);
				await this.deps.saveReplayResult(
					input.aggregateId,
					result,
					input.scope,
				);
				return result;
			}
		}

		const latest = eventChain[eventChain.length - 1];
		const successResult: ReplayResult = {
			success: true,
			reproducedEventId: latest?.eventId ?? null,
			reproducedOutcomeHash: latest?.evidenceBundleHash ?? null,
			failureCode: null,
			message: "Replay succeeded with complete evidence chain.",
		};

		await this.deps.saveReplayResult(
			input.aggregateId,
			successResult,
			input.scope,
		);
		return successResult;
	}
}
