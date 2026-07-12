import { randomUUID } from "node:crypto";
import {
	EVIDENCE_EDGE_KIND,
	EVIDENCE_NODE_KIND,
	isFiscalTruthScope,
} from "@drenyra/domain";
export class AppendEvidenceCommand {
	deps;
	constructor(deps) {
		this.deps = deps;
	}
	async execute(input) {
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
		await this.deps.appendNode(input.evidence);
		const sourceNodeId = input.evidence.nodeId;
		const validatorNodeIds = [];
		for (const vr of input.validatorResults ?? []) {
			const validatorNodeId = randomUUID();
			const validatorNode = {
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
			const validatesEdge = {
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
		if (input.policyDecision) {
			const policyNodeId = randomUUID();
			const policyNode = {
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
			const approvesEdge = {
				edgeId: randomUUID(),
				fromNodeId: policyNodeId,
				toNodeId: sourceNodeId,
				edgeKind: EVIDENCE_EDGE_KIND.APPROVES,
				scope: input.evidence.scope,
				createdAt: input.policyDecision.decidedAt,
			};
			await this.deps.appendEdge(approvesEdge);
			for (const vid of validatorNodeIds) {
				const governedByEdge = {
					edgeId: randomUUID(),
					fromNodeId: policyNodeId,
					toNodeId: vid,
					edgeKind: EVIDENCE_EDGE_KIND.GOVERNED_BY,
					scope: input.evidence.scope,
					createdAt: input.policyDecision.decidedAt,
				};
				await this.deps.appendEdge(governedByEdge);
			}
			if (input.hasRequiredApproval && input.approvalId) {
				const approvalNodeId = randomUUID();
				const approvalNode = {
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
				const approvalEdge = {
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
//# sourceMappingURL=append-evidence.command.js.map
