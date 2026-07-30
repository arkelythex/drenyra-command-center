/**
 * BuildEvidenceStep — Step 9 of the Monthly Close Pipeline.
 *
 * Assembles evidence bundle from snapshot, gate results, analysis outputs,
 * and proposal. Computes evidenceHash via SHA-256.
 *
 * isBlocker: false
 * retryPolicy: none
 */

import { createHash } from "node:crypto";
import type {
  MonthlyCloseStep,
  StepResult,
  PipelineContext,
  EvidenceRef,
} from "../types/pipeline-types";

export interface BuildEvidenceInput {
  context: PipelineContext;
}

export interface EvidenceBundle {
  evidence: EvidenceRef[];
  hash: string;
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
        id: crypto.randomUUID(),
        type: "input-snapshot",
        hash: this.hashObject(context.inputSnapshot),
        uri: `mission://${context.missionId}/snapshot`,
      });
    }

    // Add gate evidence
    if (context.gates.length > 0) {
      evidence.push({
        id: crypto.randomUUID(),
        type: "gate-results",
        hash: this.hashObject(context.gates),
        uri: `mission://${context.missionId}/gates`,
      });
    }

    // Add proposal evidence
    if (context.proposal) {
      evidence.push({
        id: crypto.randomUUID(),
        type: "closing-proposal",
        hash: this.hashObject(context.proposal),
        uri: `mission://${context.missionId}/proposal`,
      });
    }

    // Compute overall evidence hash
    const evidenceHash = this.hashObject(evidence);

    // Attach evidence to proposal if it exists
    if (context.proposal && typeof context.proposal === "object") {
      (context.proposal as any).sourceEvidence = evidence;
      (context.proposal as any).evidenceHash = evidenceHash;
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

  private hashObject(obj: unknown): string {
    const ordered = JSON.stringify(obj, Object.keys(obj as object).sort());
    return createHash("sha256").update(ordered).digest("hex");
  }
}
