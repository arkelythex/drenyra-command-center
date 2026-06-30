interface SubmitGateArtifactData {
	submitBlocked?: boolean;
	submitBlockReason?: string;
	summary: {
		critical: number;
	};
	sunatSource?: "upload" | "persisted" | "unavailable";
}

/**
 * Resolves client-side SUNAT submit gate from server artifact state and pending decisions.
 */
export function resolveSubmitGate(input: {
	artifact: SubmitGateArtifactData;
	pendingDecisions: number;
}): { submitBlocked: boolean; submitBlockReason?: string } {
	if (input.artifact.submitBlocked) {
		return {
			submitBlocked: true,
			submitBlockReason: input.artifact.submitBlockReason,
		};
	}

	if (input.artifact.sunatSource === "unavailable") {
		return {
			submitBlocked: true,
			submitBlockReason:
				"Row-level SUNAT proposal data is unavailable. Upload the SIRE file first.",
		};
	}

	if (input.pendingDecisions > 0) {
		return {
			submitBlocked: true,
			submitBlockReason: `${input.pendingDecisions} row decision(s) still pending accountant review.`,
		};
	}

	if (input.artifact.summary.critical > 0) {
		return {
			submitBlocked: true,
			submitBlockReason: `${input.artifact.summary.critical} critical discrepancy(ies) require resolution before submit.`,
		};
	}

	return { submitBlocked: false };
}
