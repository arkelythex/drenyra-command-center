/**
 * CreateAiToolPermissionCommand — Creates a new AI tool permission.
 *
 * Delegates to AiToolPermissionService for persistence.
 *
 * @module ai-tool-permissions/application/commands
 */

import type { AiToolPermissionCreateInput } from "../../ai-tool-permissions.service";
import { AiToolPermissionService } from "../../ai-tool-permissions.service";

/**
 * Creates a new AI tool permission.
 *
 * @param input - The permission data
 * @returns The created permission record
 *
 * @example
 * ```ts
 * const permission = await createPermission({
 *   toolName: 'data-analyzer',
 *   effect: 'ALLOW',
 * });
 * ```
 */
export async function createPermission(input: AiToolPermissionCreateInput) {
	return AiToolPermissionService.create(input);
}
