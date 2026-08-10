/**
 * Drenyra fiscal gate validator — bridges the Mastra tool-orchestration layer
 * to the deterministic fiscal gates of the core.
 *
 * The ApprovalGateEngine (approval-gate.ts) receives an injected
 * governanceValidator for fiscal actions. This validator uses the CORE gates
 * (`drenyra-ai/gates`) and materiality derivation (`drenyra-ai/candidates`) so
 * the approval decision is deterministic and contract-frozen — the agent
 * proposes, the Core decides whether approval is required.
 *
 * Fiscal convention: monetary values are BigInt cents (no floats); amounts come
 * as decimal strings in the tool input.
 */

import { deriveMateriality } from "drenyra-ai/candidates";
import { ApprovalGate } from "drenyra-ai/gates";
import type { GovernanceBundleResult } from "../types/approval-gate";

/** Fiscal fields expected on a fiscal tool's input. */
export interface FiscalToolInput {
	/** Amount in whole-number cents as a decimal string (no floats). */
	amountCents?: string;
	reversibility?: "reversible" | "partially-reversible" | "irreversible";
	jurisdiction?: string;
	ruc?: string;
	period?: string;
	/** Already-recorded human approvals for this operation. */
	approvals?: Array<{ approverId: string; at: string; reason?: string }>;
}

/** Options for the validator. */
export interface DrenyraGateValidatorOptions {
	/** Policy/skill references to surface as evidence (e.g. pe.igv-validate). */
	skillRefs?: readonly string[];
}

/**
 * Build a governance validator backed by the deterministic core gates.
 * R0/R1 (reversible, low materiality) => valid (controlled autonomy).
 * R2/R3 without the required approvals => invalid (human approval required).
 */
export function createDrenyraGateValidator(
	options: DrenyraGateValidatorOptions = {},
): (
	toolName: string,
	input: unknown,
	_context: unknown,
) => Promise<GovernanceBundleResult> {
	const gate = new ApprovalGate();
	const evidenceRefs = [...(options.skillRefs ?? [])];

	return async (_toolName, input): Promise<GovernanceBundleResult> => {
		const fiscal = (input ?? {}) as FiscalToolInput;

		let materiality: import("drenyra-ai/candidates").Materiality;
		try {
			materiality = deriveMateriality({
				value: BigInt(fiscal.amountCents ?? "0"),
				reversibility: fiscal.reversibility ?? "reversible",
				jurisdiction: fiscal.jurisdiction ?? "PE",
			});
		} catch {
			// Fail closed: an unparseable amount cannot auto-approve.
			return {
				valid: false,
				reasons: ["amountCents is not a valid whole-number cents string"],
				evidenceRefs,
			};
		}

		const result = gate.evaluate({
			materiality,
			approval: (fiscal.approvals ?? []).map((approval) => ({
				approverId: approval.approverId,
				at: approval.at,
				reason: approval.reason,
			})),
		});

		return {
			valid: result.verdict === "allowed",
			reasons: result.verdict === "allowed" ? [] : [result.reason],
			evidenceRefs,
		};
	};
}
