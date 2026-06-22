import type {
	DeterministicValidatorResultRecord,
	EvidenceNode,
	FiscalTruthEvent,
	FiscalTruthRepository,
	PolicyDecisionRecord,
} from "@arkelythex/domain";
import {
	canPromoteAuthoritativeTruth,
	POLICY_OUTCOME,
} from "@arkelythex/domain";

export interface PromoteFiscalTruthCommandInput {
	event: FiscalTruthEvent;
	validatorResults: DeterministicValidatorResultRecord[];
	policyDecision: PolicyDecisionRecord;
	hasRequiredApproval: boolean;
}

export interface PromoteFiscalTruthCommandDependencies {
	append: FiscalTruthRepository["append"];
	findEvidenceNodeById?: (
		nodeId: string,
		scope: FiscalTruthEvent["scope"],
	) => Promise<EvidenceNode | null>;
}

/**
 * Promotes authoritative truth only for evidence-complete and deterministic bundles.
 */
export class PromoteFiscalTruthCommand {
	constructor(private readonly deps: PromoteFiscalTruthCommandDependencies) {}

	async execute(input: PromoteFiscalTruthCommandInput): Promise<void> {
		const payload = input.event.payload as {
			provenance?: {
				validatorResults?: DeterministicValidatorResultRecord[];
				policyDecision?: PolicyDecisionRecord;
				governance?: PolicyDecisionRecord["governance"];
				approval?: { required?: boolean };
				evidence?: { nodeId?: string };
			};
		};

		if (!payload.provenance) {
			throw new Error("Missing provenance bundle for authoritative promotion.");
		}

		if (!input.event.evidenceRootNodeId.trim()) {
			throw new Error("Missing evidence root for authoritative promotion.");
		}

		const evidenceNodeId = payload.provenance.evidence?.nodeId;
		if (
			typeof evidenceNodeId !== "string" ||
			evidenceNodeId.trim().length === 0
		) {
			throw new Error("Missing persisted evidence node linkage for promotion.");
		}

		if (evidenceNodeId !== input.event.evidenceRootNodeId) {
			throw new Error("Evidence root does not match persisted evidence node.");
		}

		if (this.deps.findEvidenceNodeById) {
			const persistedRoot = await this.deps.findEvidenceNodeById(
				input.event.evidenceRootNodeId,
				input.event.scope,
			);

			if (!persistedRoot) {
				throw new Error(
					"Evidence root was not persisted for authoritative promotion.",
				);
			}

			/* Canonical promotion guard — single source of truth for eligibility. */
			const guardPasses = canPromoteAuthoritativeTruth({
				evidenceNodeKind: persistedRoot.nodeKind,
				hasDeterministicValidation:
					input.validatorResults.length > 0 &&
					input.validatorResults.some(
						(r) => r.validatorVersion === input.event.validatorSetVersion,
					),
				hasRequiredApproval: input.hasRequiredApproval,
				evidenceRootNodeId: input.event.evidenceRootNodeId,
				hasSameScopeGraphLinks: true,
				hasApprovedGovernancePolicyDecision:
					input.policyDecision.outcome === POLICY_OUTCOME.PROMOTABLE,
				hasHumanMaterialApproval: !!input.event.approvalId,
			});

			if (!guardPasses) {
				throw new Error(
					"Canonical promotion guard rejected authoritative truth promotion.",
				);
			}
		}

		if (input.validatorResults.length === 0) {
			throw new Error("Missing validator results for authoritative promotion.");
		}

		const hasMatchingValidatorVersion = input.validatorResults.some(
			(result) => result.validatorVersion === input.event.validatorSetVersion,
		);

		if (!hasMatchingValidatorVersion) {
			throw new Error("Missing validator version dependency for promotion.");
		}

		if (input.policyDecision.policyVersion !== input.event.policyVersion) {
			throw new Error("Policy version mismatch for authoritative promotion.");
		}

		if (input.hasRequiredApproval && !input.event.approvalId?.trim()) {
			throw new Error(
				"Missing approval dependency for authoritative promotion.",
			);
		}

		if (
			input.policyDecision.outcome !== POLICY_OUTCOME.PROMOTABLE ||
			!input.hasRequiredApproval
		) {
			throw new Error("Policy outcome does not allow authoritative promotion.");
		}

		const hasBlockingValidation = input.validatorResults.some(
			(result) => !result.isValid || result.severity === "blocking",
		);

		if (hasBlockingValidation) {
			throw new Error(
				"Deterministic validation failed for authoritative promotion.",
			);
		}

		await this.deps.append(input.event);
	}
}
