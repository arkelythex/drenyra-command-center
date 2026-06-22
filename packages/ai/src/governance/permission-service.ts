/**
 * PermissionService — Granular permission lookup for AI tools.
 *
 * Pre-loads permission entries from the DB into an in-memory Map for
 * synchronous lookups. Supports company-scoped and global (wildcard)
 * permission entries with most-specific-first resolution.
 *
 * Design invariants:
 * - No DB dependency at runtime — permissions are loaded once via load()
 * - Company-specific match takes precedence over global match
 * - Missing entry → REQUIRE_APPROVAL (safe default, preserves existing behavior)
 * - Purely synchronous — no async overhead in the evaluation path
 */

import type {
	PermissionResult,
	PermissionEffect,
	PermissionEntry,
	PermissionContext,
} from "../control-plane/contracts";

/**
 * PermissionMap: pre-resolved lookup from DB.
 * Keys are either `toolName` (global) or `toolName:companyId` (scoped).
 */
type PermissionMap = Map<string, PermissionEffect>;

export class PermissionService {
	private permissions: PermissionMap = new Map();

	/**
	 * Load entries from the database into the in-memory map.
	 * Replaces all existing entries — call during initialization or refresh.
	 */
	load(entries: PermissionEntry[]): void {
		this.permissions.clear();
		for (const entry of entries) {
			const key = entry.companyId
				? `${entry.toolName}:${entry.companyId}`
				: entry.toolName;
			this.permissions.set(key, entry.effect);
		}
	}

	/**
	 * Check whether a tool can execute in the given context.
	 *
	 * Resolution order:
	 * 1. Company-specific permission (toolName + companyId)
	 * 2. Global permission (toolName only, no company scoping)
	 * 3. Fall-through: REQUIRE_APPROVAL (safe default)
	 */
	canExecute(
		toolName: string,
		context?: PermissionContext,
	): PermissionResult {
		const toolEntry = this.lookupPermission(toolName, context);

		if (!toolEntry) {
			return { effect: "REQUIRE_APPROVAL" as PermissionEffect, source: "default" };
		}

		return { effect: toolEntry, source: "permission_entry" };
	}

	/**
	 * Look up the most specific permission for a tool+context pair.
	 */
	private lookupPermission(
		toolName: string,
		context?: PermissionContext,
	): PermissionEffect | undefined {
		// Company-specific match first (most specific)
		if (context?.companyId) {
			const companyKey = `${toolName}:${context.companyId}`;
			const entry = this.permissions.get(companyKey);
			if (entry) return entry;
		}

		// Global (toolName-only) match
		return this.permissions.get(toolName);
	}

	/**
	 * Set a permission entry (for testing or ad-hoc setup).
	 */
	setPermission(
		toolName: string,
		effect: PermissionEffect,
		companyId?: string,
	): void {
		const key = companyId ? `${toolName}:${companyId}` : toolName;
		this.permissions.set(key, effect);
	}

	/**
	 * Return a copy of all permissions (for inspection/debugging).
	 */
	getAllPermissions(): Map<string, PermissionEffect> {
		return new Map(this.permissions);
	}
}
