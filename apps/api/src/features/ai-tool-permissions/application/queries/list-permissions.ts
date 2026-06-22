/**
 * ListAiToolPermissionsQuery — Lists AI tool permissions with optional company filter.
 *
 * Delegates to AiToolPermissionService for data access.
 *
 * @module ai-tool-permissions/application/queries
 */

import type { AiToolPermissionRow } from "../../ai-tool-permissions.service";
import { AiToolPermissionService } from "../../ai-tool-permissions.service";

export interface ListPermissionsInput {
	companyId?: string;
}

/**
 * Lists AI tool permissions.
 *
 * @param input - Optional company filter
 * @returns Array of permission records
 *
 * @example
 * ```ts
 * const all = await listPermissions();
 * const filtered = await listPermissions({ companyId: 'cmp-123' });
 * ```
 */
export async function listPermissions(
	input: ListPermissionsInput = {},
): Promise<AiToolPermissionRow[]> {
	return AiToolPermissionService.list(input.companyId);
}
