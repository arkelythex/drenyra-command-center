import {
	type DeterministicValidatorResultRecord,
	EVIDENCE_NODE_KIND,
	type EvidenceNode,
	type FiscalTruthEvent,
	type FiscalTruthScope,
	type GovernanceBundleReference,
	POLICY_OUTCOME,
	type PolicyDecisionRecord,
	REPLAY_FAILURE_CODE,
} from "@drenyra/domain";
import { describe, expect, it, vi } from "vitest";
import {
	AppendEvidenceCommand,
	type AppendEvidenceCommandInput,
} from "../commands/append-evidence.command";
import {
	PromoteFiscalTruthCommand,
	type PromoteFiscalTruthCommandInput,
} from "../commands/promote-fiscal-truth.command";
import { ReplayFiscalTruthService } from "../services/replay-fiscal-truth.service";

function buildScope(overrides?: Partial<FiscalTruthScope>): FiscalTruthScope {
	return {
		companyId: "company-1",
		companyRuc: "20100070970",
		organizationId: 10,
		period: "2026-05",
		countryCode: "PE",
		...overrides,
	};
}

function buildTrace() {
	return {
		traceId: "trace-1",
		correlationId: "corr-1",
		causationId: null,
	};
}

function buildGovernance(
	status: GovernanceBundleReference["reviewStatus"] = "approved",
): GovernanceBundleReference {
	return {
		governanceBundleId: "gb-1",
		policyVersion: "policy-v1",
		specVersion: "spec-v1",
		architectureDocVersion: "arch-v1",
		glossaryVersion: "glossary-v1",
		adrIds: ["ADR-019"],
		reviewStatus: status,
		approvedAt: status === "approved" ? "2026-05-04T00:00:00.000Z" : null,
	};
}

function buildValidatorResult(
	isValid = true,
): DeterministicValidatorResultRecord {
	return {
		validatorName: "sunat-rule-pack",
		validatorVersion: "validators-v1",
		inputHash: "hash-input",
		isValid,
		code: isValid ? "VALIDATION_OK" : "RUC_INVALID",
		reason: isValid ? "ok" : "invalid",
		severity: isValid ? "info" : "blocking",
		observedAt: "2026-05-04T00:00:00.000Z",
		payload: {},
	};
}

function buildPolicyDecision(
	outcome: PolicyDecisionRecord["outcome"],
): PolicyDecisionRecord {
	return {
		decisionId: "decision-1",
		policyVersion: "policy-v1",
		governance: buildGovernance(),
		outcome,
		rationale: "policy check",
		decidedAt: "2026-05-04T00:00:00.000Z",
	};
}

function buildEvidenceNode(
	scope: FiscalTruthScope,
	kind = EVIDENCE_NODE_KIND.SOURCE_INPUT,
): EvidenceNode {
	return {
		nodeId: "node-1",
		nodeKind: kind,
		scope,
		trace: buildTrace(),
		hash: "hash-evidence",
		createdAt: "2026-05-04T00:00:00.000Z",
		metadata: {},
	};
}

function buildEvent(scope: FiscalTruthScope): FiscalTruthEvent {
	return {
		eventId: "event-1",
		aggregateId: "invoice-1",
		aggregateType: "invoice",
		eventKind: "authoritative_truth_promoted" as FiscalTruthEvent["eventKind"],
		scope,
		trace: buildTrace(),
		validatorSetVersion: "validators-v1",
		policyVersion: "policy-v1",
		evidenceRootNodeId: "node-1",
		evidenceBundleHash: "hash-bundle",
		approvalId: "approval-1",
		occurredAt: "2026-05-04T00:00:00.000Z",
		payload: {},
	};
}

describe("Fiscal truth application orchestration", () => {
	it("append-evidence rejects cross-period scope mismatch", async () => {
		const appendNode = vi.fn().mockResolvedValue(undefined);
		const command = new AppendEvidenceCommand({ appendNode });

		const input: AppendEvidenceCommandInput = {
			expectedScope: buildScope({ period: "2026-05" }),
			evidence: buildEvidenceNode(buildScope({ period: "2026-06" })),
		};

		await expect(command.execute(input)).rejects.toThrow(/scope/i);
		expect(appendNode).not.toHaveBeenCalled();
	});

	it("append-evidence rejects cross-tenant scope mismatch", async () => {
		const appendNode = vi.fn().mockResolvedValue(undefined);
		const command = new AppendEvidenceCommand({ appendNode });

		const input: AppendEvidenceCommandInput = {
			expectedScope: buildScope(),
			evidence: buildEvidenceNode(buildScope({ companyId: "company-2" })),
		};

		await expect(command.execute(input)).rejects.toThrow(/scope/i);
		expect(appendNode).not.toHaveBeenCalled();
	});

	it("promote-truth rejects when evidence root is missing", async () => {
		const append = vi.fn().mockResolvedValue(undefined);
		const command = new PromoteFiscalTruthCommand({ append });

		const input: PromoteFiscalTruthCommandInput = {
			event: {
				...buildEvent(buildScope()),
				evidenceRootNodeId: "",
				payload: {
					provenance: {
						validatorResults: [buildValidatorResult(true)],
						policyDecision: buildPolicyDecision(POLICY_OUTCOME.PROMOTABLE),
						governance: buildGovernance(),
						approval: { required: true },
					},
				},
			},
			validatorResults: [buildValidatorResult(true)],
			policyDecision: buildPolicyDecision(POLICY_OUTCOME.PROMOTABLE),
			hasRequiredApproval: true,
		};

		await expect(command.execute(input)).rejects.toThrow(/evidence/i);
		expect(append).not.toHaveBeenCalled();
	});

	it("promote-truth rejects when provenance bundle is incomplete", async () => {
		const append = vi.fn().mockResolvedValue(undefined);
		const command = new PromoteFiscalTruthCommand({ append });

		const input: PromoteFiscalTruthCommandInput = {
			event: {
				...buildEvent(buildScope()),
				payload: {},
			},
			validatorResults: [buildValidatorResult(true)],
			policyDecision: buildPolicyDecision(POLICY_OUTCOME.PROMOTABLE),
			hasRequiredApproval: true,
		};

		await expect(command.execute(input)).rejects.toThrow(/provenance/i);
		expect(append).not.toHaveBeenCalled();
	});

	it("promote-truth rejects when persisted evidence node id does not match event evidence root", async () => {
		const append = vi.fn().mockResolvedValue(undefined);
		const command = new PromoteFiscalTruthCommand({ append });

		const input: PromoteFiscalTruthCommandInput = {
			event: {
				...buildEvent(buildScope()),
				payload: {
					provenance: {
						validatorResults: [buildValidatorResult(true)],
						policyDecision: buildPolicyDecision(POLICY_OUTCOME.PROMOTABLE),
						governance: buildGovernance(),
						approval: { required: true },
						evidence: {
							nodeId: "node-other",
						},
					},
				},
			},
			validatorResults: [buildValidatorResult(true)],
			policyDecision: buildPolicyDecision(POLICY_OUTCOME.PROMOTABLE),
			hasRequiredApproval: true,
		};

		await expect(command.execute(input)).rejects.toThrow(/does not match/i);
		expect(append).not.toHaveBeenCalled();
	});

	it("promote-truth rejects when evidence root node is not persisted", async () => {
		const append = vi.fn().mockResolvedValue(undefined);
		const findEvidenceNodeById = vi.fn().mockResolvedValue(null);
		const command = new PromoteFiscalTruthCommand({
			append,
			findEvidenceNodeById,
		});

		const input: PromoteFiscalTruthCommandInput = {
			event: {
				...buildEvent(buildScope()),
				payload: {
					provenance: {
						validatorResults: [buildValidatorResult(true)],
						policyDecision: buildPolicyDecision(POLICY_OUTCOME.PROMOTABLE),
						governance: buildGovernance(),
						approval: { required: true },
						evidence: {
							nodeId: "node-1",
						},
					},
				},
			},
			validatorResults: [buildValidatorResult(true)],
			policyDecision: buildPolicyDecision(POLICY_OUTCOME.PROMOTABLE),
			hasRequiredApproval: true,
		};

		await expect(command.execute(input)).rejects.toThrow(/not persisted/i);
		expect(findEvidenceNodeById).toHaveBeenCalledWith("node-1", buildScope());
		expect(append).not.toHaveBeenCalled();
	});

	it("replay returns missing evidence failure when graph root is absent", async () => {
		const loadEventChain = vi
			.fn()
			.mockResolvedValue([buildEvent(buildScope())]);
		const findNodeById = vi.fn().mockResolvedValue(null);
		const saveReplayResult = vi.fn().mockResolvedValue(undefined);
		const service = new ReplayFiscalTruthService({
			loadEventChain,
			findNodeById,
			saveReplayResult,
		});

		const result = await service.execute({
			aggregateId: "invoice-1",
			scope: buildScope(),
		});

		expect(result.success).toBe(false);
		expect(result.failureCode).toBe(REPLAY_FAILURE_CODE.MISSING_EVIDENCE);
		expect(saveReplayResult).toHaveBeenCalledWith(
			"invoice-1",
			result,
			buildScope(),
		);
	});

	it("replay fails when evidence hash is tampered", async () => {
		const loadEventChain = vi.fn().mockResolvedValue([
			{
				...buildEvent(buildScope()),
				payload: {
					provenance: {
						validatorResults: [buildValidatorResult(true)],
						policyDecision: buildPolicyDecision(POLICY_OUTCOME.PROMOTABLE),
						approval: { required: true },
					},
				},
			},
		]);
		const findNodeById = vi.fn().mockResolvedValue({
			...buildEvidenceNode(buildScope()),
			hash: "another-hash",
		});
		const saveReplayResult = vi.fn().mockResolvedValue(undefined);
		const service = new ReplayFiscalTruthService({
			loadEventChain,
			findNodeById,
			saveReplayResult,
		});

		const result = await service.execute({
			aggregateId: "invoice-1",
			scope: buildScope(),
		});

		expect(result.success).toBe(false);
		expect(result.failureCode).toBe(REPLAY_FAILURE_CODE.HASH_MISMATCH);
	});

	it("replay fails when validator or policy version dependencies are missing", async () => {
		const loadEventChain = vi.fn().mockResolvedValue([
			{
				...buildEvent(buildScope()),
				payload: {
					provenance: {
						validatorResults: [
							{ ...buildValidatorResult(true), validatorVersion: "other" },
						],
						policyDecision: {
							...buildPolicyDecision(POLICY_OUTCOME.PROMOTABLE),
							policyVersion: "other-policy",
						},
						approval: { required: true },
					},
				},
			},
		]);
		const findNodeById = vi.fn().mockResolvedValue({
			...buildEvidenceNode(buildScope()),
			hash: "hash-bundle",
		});
		const saveReplayResult = vi.fn().mockResolvedValue(undefined);
		const service = new ReplayFiscalTruthService({
			loadEventChain,
			findNodeById,
			saveReplayResult,
		});

		const result = await service.execute({
			aggregateId: "invoice-1",
			scope: buildScope(),
		});

		expect(result.success).toBe(false);
		expect(result.failureCode).toBe(
			REPLAY_FAILURE_CODE.VALIDATOR_VERSION_MISSING,
		);
	});

	it("replay fails when approval dependency is required but missing", async () => {
		const loadEventChain = vi.fn().mockResolvedValue([
			{
				...buildEvent(buildScope()),
				approvalId: null,
				payload: {
					provenance: {
						validatorResults: [buildValidatorResult(true)],
						policyDecision: buildPolicyDecision(POLICY_OUTCOME.PROMOTABLE),
						approval: { required: true },
					},
				},
			},
		]);
		const findNodeById = vi.fn().mockResolvedValue({
			...buildEvidenceNode(buildScope()),
			hash: "hash-bundle",
		});
		const saveReplayResult = vi.fn().mockResolvedValue(undefined);
		const service = new ReplayFiscalTruthService({
			loadEventChain,
			findNodeById,
			saveReplayResult,
		});

		const result = await service.execute({
			aggregateId: "invoice-1",
			scope: buildScope(),
		});

		expect(result.success).toBe(false);
		expect(result.failureCode).toBe(REPLAY_FAILURE_CODE.MISSING_EVIDENCE);
	});
});
