/**
 * GetAiToolPermissionQuery — Gets an AI tool permission by ID.
 *
 * Delegates to AiToolPermissionService for data access.
 *
 * @module ai-tool-permissions/application/queries
 */

import { AiToolPermissionService } from "../../ai-tool-permissions.service";

export interface GetPermissionInput {
	id: string;
}

/**
 * Gets an AI tool permission by ID.
 *
 * @param input - The permission ID
 * @returns The permission record or null if not found
 *
 * @example
 * ```ts
 * const permission = await getPermission({ id: 'uuid-123' });
 * ```
 */
export async function getPermission(input: GetPermissionInput) {
	return AiToolPermissionService.getById(input.id);
}
