/**
 * Fiscal Approval — Approval Gate facade.
 *
 * The canonical approval gate lives in drenyra-ai. This facade provides the
 * type stubs required for backward compatibility; the runtime gate integration
 * should migrate to the drenyra-ai runtime.
 */
import type {
	ApprovalGateConfig,
	Recommendation,
} from "./types";

/** Options for the approval gate. */
export interface ApprovalGateOptions {
	config?: Partial<ApprovalGateConfig>;
}

/**
 * Creates an approval gate for a specific recommendation.
 * Facade stub — migrate to drenyra-ai runtime for the real gate.
 */
export function createApprovalGate(
	_rec: Recommendation,
	_options?: ApprovalGateOptions,
): { name: string; description: string } {
	return {
		name: "ApprovalGate-facade",
		description: "Facade: approval gate logic migrated to drenyra-ai",
	};
}
