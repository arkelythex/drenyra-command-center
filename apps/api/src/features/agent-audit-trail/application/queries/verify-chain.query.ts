/**
 * Verify Hash Chain Query
 * Validates cryptographic integrity of audit trail
 */

import { verifyHash } from "../../domain";
import {
	AgentDecisionLogRepository,
	type GetTrailFilters,
} from "../../infrastructure/repository";

/**
 * VerifyChainResult interface.
 *
 * @example
 * ```ts
 * const value: VerifyChainResult = {} as VerifyChainResult;
 * console.log(value);
 * ```
 */
export interface VerifyChainResult {
	isValid: boolean;
	brokenAt?: number;
	error?: string;
}

/**
 * verifyHashChain operation.
 *
 * @param filters - Input for filters.
 * @returns Result of verifyHashChain.
 * @example
 * ```ts
 * const result = await verifyHashChain({} as GetTrailFilters);
 * console.log(result);
 * ```
 */
export async function verifyHashChain(
	filters: GetTrailFilters,
): Promise<VerifyChainResult> {
	const repository = new AgentDecisionLogRepository();
	const logs = await repository.getTrail({ ...filters, limit: 1000 });

	if (logs.length === 0) {
		return { isValid: true };
	}

	// Verify each log's hash
	for (let i = 0; i < logs.length; i++) {
		const log = logs[i];

		const isValid = await verifyHash(
			{
				id: log.id,
				createdAt: log.createdAt,
				inputs: log.decisionData.inputs,
				outputs: log.decisionData.outputs,
				prevHash: log.hashChain.prevHash,
			},
			log.hashChain.hash,
		);

		if (!isValid) {
			return {
				isValid: false,
				brokenAt: i,
				error: `Hash mismatch at log #${i} (${log.id})`,
			};
		}

		// Verify chain link
		if (i > 0 && log.hashChain.prevHash !== logs[i - 1].hashChain.hash) {
			return {
				isValid: false,
				brokenAt: i,
				error: `Chain broken at log #${i} (prevHash mismatch)`,
			};
		}
	}

	return { isValid: true };
}
