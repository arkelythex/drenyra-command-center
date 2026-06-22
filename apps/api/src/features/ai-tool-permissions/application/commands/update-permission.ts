/**
 * UpdateAiToolPermissionCommand — Updates an existing AI tool permission.
 *
 * Delegates to AiToolPermissionService for persistence.
 *
 * @module ai-tool-permissions/application/commands
 */

import type { AiToolPermissionUpdateInput } from "../../ai-tool-permissions.service";
import { AiToolPermissionService } from "../../ai-tool-permissions.service";

export interface UpdatePermissionInput {
	id: string;
	data: AiToolPermissionUpdateInput;
}

/**
 * Updates an AI tool permission by ID.
 *
 * @param input - The permission ID and update data
 * @returns The updated permission record
 * @throws If the permission is not found
 *
 * @example
 * ```ts
 * const updated = await updatePermission({
 *   id: 'uuid-123',
 *   data: { effect: 'DENY' },
 * });
 * ```
 */
export async function updatePermission(input: UpdatePermissionInput) {
	return AiToolPermissionService.update(input.id, input.data);
}
