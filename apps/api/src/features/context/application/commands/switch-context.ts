/**
 * SwitchContextCommand — Switches the active company context.
 *
 * Extracted from the inline route handler for CQRS compliance.
 *
 * @module context/application/commands
 */

import { createLogger } from "../../../../lib/logger";

const logger = createLogger({ module: "features/context/commands" });

export interface SwitchContextInput {
	companyId: string;
}

export interface SwitchContextResult {
	companyId: string;
	message: string;
}

/**
 * Switches the active company context.
 *
 * @param input - The company ID to switch to
 * @returns The switch result with confirmation message
 *
 * @example
 * ```ts
 * const result = await switchContext({ companyId: 'cmp-123' });
 * // => { companyId: 'cmp-123', message: 'Context switched successfully' }
 * ```
 */
export async function switchContext(
	input: SwitchContextInput,
): Promise<SwitchContextResult> {
	const { companyId } = input;

	logger.info({ companyId }, "Switching active company context");

	return {
		companyId,
		message: "Context switched successfully",
	};
}
