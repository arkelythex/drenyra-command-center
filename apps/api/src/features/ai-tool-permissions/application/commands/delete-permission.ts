/**
 * DeleteAiToolPermissionCommand — Deletes an AI tool permission.
 *
 * Delegates to AiToolPermissionService for persistence.
 *
 * @module ai-tool-permissions/application/commands
 */

import { AiToolPermissionService } from "../../ai-tool-permissions.service";

/**
 * Deletes an AI tool permission by ID (hard delete).
 *
 * @param id - The permission ID to delete
 * @returns The deleted permission record
 * @throws If the permission is not found
 *
 * @example
 * ```ts
 * const deleted = await deletePermission('uuid-123');
 * ```
 */
export async function deletePermission(id: string) {
	return AiToolPermissionService.delete(id);
}
