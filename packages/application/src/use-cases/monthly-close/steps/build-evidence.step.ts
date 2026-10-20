/**
 * BuildEvidenceStep — Step 9 of the Monthly Close Pipeline.
 *
 * Assembles evidence bundle from snapshot, gate results, analysis outputs,
 * and proposal. Computes evidenceHash with the canonical evidence hash shared
 * with the approval check, so a bundle read back from jsonb still matches.
 *
 * isBlocker: false
 * retryPolicy: none
 */

import { computeEvidenceBundleHash } from "@drenyra/domain";
import type {
	ClosingProposal,
	EvidenceRef,
	MonthlyCloseStep,
	PipelineContext,
	StepResult,
} from "../types/pipeline-types";

export interface BuildEvidenceInput {
	context: PipelineContext;
}

export interface EvidenceBundle {
	evidence: EvidenceRef[];
	hash: string;
}

/**
 * Stable id for an evidence item: the same mission and evidence type always
 * get the same id, so re-running the pipeline on unchanged inputs reproduces
 * the same bundle hash.
 */
async function evidenceId(missionId: string, type: string): Promise<string> {
	const hex = await computeEvidenceBundleHash(`${missionId}/${type}`);
	return [
		hex.slice(0, 8),
		hex.slice(8, 12),
		hex.slice(12, 16),
		hex.slice(16, 20),
		hex.slice(20, 32),
	].join("-");
}

export class BuildEvidenceStep
	implements MonthlyCloseStep<BuildEvidenceInput, EvidenceBundle>
{
	readonly name = "BuildEvidence";
	readonly retryPolicy = { type: "none" as const };
	readonly isBlocker = false;

	async execute(
		input: BuildEvidenceInput,
		context: PipelineContext,
	): Promise<StepResult<EvidenceBundle>> {
		const startedAt = new Date().toISOString();
		const evidence: EvidenceRef[] = [];

		// Add snapshot evidence
		if (context.inputSnapshot) {
			evidence.push({
				id: await evidenceId(context.missionId, "input-snapshot"),
				type: "input-snapshot",
				hash: await computeEvidenceBundleHash(context.inputSnapshot),
				uri: `mission://${context.missionId}/snapshot`,
			});
		}

		// Add gate evidence
		if (context.gates.length > 0) {
			evidence.push({
				id: await evidenceId(context.missionId, "gate-results"),
				type: "gate-results",
				hash: await computeEvidenceBundleHash(context.gates),
				uri: `mission://${context.missionId}/gates`,
			});
		}

		// Add proposal evidence
		if (context.proposal) {
			evidence.push({
				id: await evidenceId(context.missionId, "closing-proposal"),
				type: "closing-proposal",
				hash: await computeEvidenceBundleHash(context.proposal),
				uri: `mission://${context.missionId}/proposal`,
			});
		}

		// Compute overall evidence hash
		const evidenceHash = await computeEvidenceBundleHash(evidence);

		// Attach evidence to proposal if it exists
		if (context.proposal && typeof context.proposal === "object") {
			const proposal = context.proposal as ClosingProposal;
			proposal.sourceEvidence = evidence;
			proposal.evidenceHash = evidenceHash;
		}

		return {
			success: true,
			data: { evidence, hash: evidenceHash },
			errors: [],
			warnings: [],
			exceptions: [],
			metrics: {
				startedAt,
				completedAt: new Date().toISOString(),
				itemsProcessed: evidence.length,
				itemsFailed: 0,
			},
		};
	}
}
