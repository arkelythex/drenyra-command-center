import {
	AppendEvidenceCommand,
	type GovernanceBundleService,
	PromoteFiscalTruthCommand,
} from "@drenyra/application";
import type {
	DeterministicValidatorResultRecord,
	EvidenceGraphRepository,
	EvidenceNode,
	FiscalTruthEvent,
	FiscalTruthRepository,
	FiscalTruthScope,
	PolicyDecisionRecord,
} from "@drenyra/domain";

export interface AppendFiscalTruthInput {
	expectedScope: FiscalTruthScope;
	evidence: EvidenceNode;
	event: FiscalTruthEvent;
	validatorResults: DeterministicValidatorResultRecord[];
	policyDecision: PolicyDecisionRecord;
	hasRequiredApproval: boolean;
}

/**
 * API-level orchestration for scoped evidence append + authoritative promotion.
 * Evidence writes and truth event promotion use injected repository dependencies.
 */
export class AppendFiscalTruthApiCommand {
	constructor(
		private readonly governanceService: GovernanceBundleService,
		private readonly evidenceRepository: EvidenceGraphRepository,
		private readonly fiscalTruthRepository: FiscalTruthRepository,
	) {}

	async execute(input: AppendFiscalTruthInput): Promise<void> {
		const governanceApproved = await this.governanceService.isApproved(
			input.policyDecision.governance,
		);
		if (!governanceApproved) {
			throw new Error("FISCAL_TRUTH_GOVERNANCE_REQUIRED");
		}

		const appendEvidence = new AppendEvidenceCommand({
			appendNode: this.evidenceRepository.appendNode.bind(
				this.evidenceRepository,
			),
			appendEdge: this.evidenceRepository.appendEdge.bind(
				this.evidenceRepository,
			),
		});
		const promoteTruth = new PromoteFiscalTruthCommand({
			append: this.fiscalTruthRepository.append.bind(
				this.fiscalTruthRepository,
			),
			findEvidenceNodeById: this.evidenceRepository.findNodeById.bind(
				this.evidenceRepository,
			),
		});

		await appendEvidence.execute({
			expectedScope: input.expectedScope,
			evidence: input.evidence,
			validatorResults: input.validatorResults,
			policyDecision: input.policyDecision,
			hasRequiredApproval: input.hasRequiredApproval,
			approvalId: input.event.approvalId ?? undefined,
		});

		const eventWithProvenance: FiscalTruthEvent = {
			...input.event,
			payload: {
				...input.event.payload,
				provenance: {
					validatorResults: input.validatorResults,
					policyDecision: input.policyDecision,
					governance: input.policyDecision.governance,
					approval: {
						required: input.hasRequiredApproval,
						approvalId: input.event.approvalId,
					},
					evidence: {
						rootNodeId: input.event.evidenceRootNodeId,
						bundleHash: input.event.evidenceBundleHash,
						nodeId: input.evidence.nodeId,
						nodeHash: input.evidence.hash,
					},
				},
			},
		};

		await promoteTruth.execute({
			event: eventWithProvenance,
			validatorResults: input.validatorResults,
			policyDecision: input.policyDecision,
			hasRequiredApproval: input.hasRequiredApproval,
		});
	}
}
