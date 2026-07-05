/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */

import { randomUUID } from "node:crypto";
import type {
	DeterministicValidatorResultRecord,
	EvidenceEdge,
	EvidenceGraphRepository,
	EvidenceNode,
	FiscalTruthScope,
	PolicyDecisionRecord,
} from "@drenyra/domain";
import {
	EVIDENCE_EDGE_KIND,
	EVIDENCE_NODE_KIND,
	isFiscalTruthScope,
} from "@drenyra/domain";

export interface AppendEvidenceCommandInput {
	expectedScope: FiscalTruthScope;
	evidence: EvidenceNode;
	/** Optional validator results — creates DETERMINISTIC_VALIDATION nodes + VALIDATES edges */
	validatorResults?: DeterministicValidatorResultRecord[];
	/** Optional policy decision — creates POLICY_DECISION node + APPROVES/GOVERNED_BY edges */
	policyDecision?: PolicyDecisionRecord;
	/** Whether human/material approval is required — creates APPROVAL node + APPROVES edge */
	hasRequiredApproval?: boolean;
	/** Approval ID to link the APPROVAL evidence node (required when hasRequiredApproval is true) */
	approvalId?: string;
}

export interface AppendEvidenceCommandDependencies {
	appendNode: EvidenceGraphRepository["appendNode"];
	appendEdge: EvidenceGraphRepository["appendEdge"];
}

/**
 * Appends evidence only when tenant/company/RUC scope matches exactly.
 * Creates the full evidence graph with all node kinds and edges.
 */
export class AppendEvidenceCommand {
	constructor(private readonly deps: AppendEvidenceCommandDependencies) {}

	async execute(input: AppendEvidenceCommandInput): Promise<void> {
		if (
			!isFiscalTruthScope(input.expectedScope) ||
			!isFiscalTruthScope(input.evidence.scope)
		) {
			throw new Error("Invalid fiscal truth scope for evidence append.");
		}

		if (
			input.expectedScope.companyId !== input.evidence.scope.companyId ||
			input.expectedScope.companyRuc !== input.evidence.scope.companyRuc ||
			input.expectedScope.organizationId !==
				input.evidence.scope.organizationId ||
			input.expectedScope.period !== input.evidence.scope.period ||
			input.expectedScope.countryCode !== input.evidence.scope.countryCode
		) {
			throw new Error("Fiscal truth scope mismatch for evidence append.");
		}

		// 1. Create the SOURCE_INPUT node (primary evidence root)
		await this.deps.appendNode(input.evidence);
		const sourceNodeId = input.evidence.nodeId;

		// 2. Create DETERMINISTIC_VALIDATION nodes + VALIDATES edges
		const validatorNodeIds: string[] = [];
		for (const vr of input.validatorResults ?? []) {
			const validatorNodeId = randomUUID();
			const validatorNode: EvidenceNode = {
				nodeId: validatorNodeId,
				nodeKind: EVIDENCE_NODE_KIND.DETERMINISTIC_VALIDATION,
				scope: input.evidence.scope,
				trace: input.evidence.trace,
				hash: vr.inputHash,
				createdAt: vr.observedAt,
				metadata: {
					validatorName: vr.validatorName,
					validatorVersion: vr.validatorVersion,
					isValid: vr.isValid,
					code: vr.code,
					reason: vr.reason,
					severity: vr.severity,
				},
			};
			await this.deps.appendNode(validatorNode);

			const validatesEdge: EvidenceEdge = {
				edgeId: randomUUID(),
				fromNodeId: validatorNodeId,
				toNodeId: sourceNodeId,
				edgeKind: EVIDENCE_EDGE_KIND.VALIDATES,
				scope: input.evidence.scope,
				createdAt: vr.observedAt,
			};
			await this.deps.appendEdge(validatesEdge);
			validatorNodeIds.push(validatorNodeId);
		}

		// 3. Create POLICY_DECISION node + APPROVES edge + GOVERNED_BY edges
		if (input.policyDecision) {
			const policyNodeId = randomUUID();
			const policyNode: EvidenceNode = {
				nodeId: policyNodeId,
				nodeKind: EVIDENCE_NODE_KIND.POLICY_DECISION,
				scope: input.evidence.scope,
				trace: input.evidence.trace,
				hash: input.policyDecision.decisionId,
				createdAt: input.policyDecision.decidedAt,
				metadata: {
					decisionId: input.policyDecision.decisionId,
					policyVersion: input.policyDecision.policyVersion,
					outcome: input.policyDecision.outcome,
					rationale: input.policyDecision.rationale,
					governanceBundleId:
						input.policyDecision.governance.governanceBundleId,
					reviewStatus: input.policyDecision.governance.reviewStatus,
				},
			};
			await this.deps.appendNode(policyNode);

			// APPROVES edge: policy → source input
			const approvesEdge: EvidenceEdge = {
				edgeId: randomUUID(),
				fromNodeId: policyNodeId,
				toNodeId: sourceNodeId,
				edgeKind: EVIDENCE_EDGE_KIND.APPROVES,
				scope: input.evidence.scope,
				createdAt: input.policyDecision.decidedAt,
			};
			await this.deps.appendEdge(approvesEdge);

			// GOVERNED_BY edges: policy → each validator
			for (const vid of validatorNodeIds) {
				const governedByEdge: EvidenceEdge = {
					edgeId: randomUUID(),
					fromNodeId: policyNodeId,
					toNodeId: vid,
					edgeKind: EVIDENCE_EDGE_KIND.GOVERNED_BY,
					scope: input.evidence.scope,
					createdAt: input.policyDecision.decidedAt,
				};
				await this.deps.appendEdge(governedByEdge);
			}

			// 4. Create APPROVAL node + APPROVES edge (if required)
			if (input.hasRequiredApproval && input.approvalId) {
				const approvalNodeId = randomUUID();
				const approvalNode: EvidenceNode = {
					nodeId: approvalNodeId,
					nodeKind: EVIDENCE_NODE_KIND.APPROVAL,
					scope: input.evidence.scope,
					trace: input.evidence.trace,
					hash: input.approvalId,
					createdAt: input.evidence.createdAt,
					metadata: {
						approvalId: input.approvalId,
					},
				};
				await this.deps.appendNode(approvalNode);

				// APPROVES edge: approval → policy decision
				const approvalEdge: EvidenceEdge = {
					edgeId: randomUUID(),
					fromNodeId: approvalNodeId,
					toNodeId: policyNodeId,
					edgeKind: EVIDENCE_EDGE_KIND.APPROVES,
					scope: input.evidence.scope,
					createdAt: input.evidence.createdAt,
				};
				await this.deps.appendEdge(approvalEdge);
			}
		}
	}
}
