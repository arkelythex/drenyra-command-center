import type { AIPrompt, PromptType } from "../entities/AIPrompt";

/**
 * Filters for querying AI prompts
 *
 * @example
 * ```ts
 * const filters: AIPromptFilters = {
 *   organizationId: 1,
 *   promptType: "INVOICE_SUMMARY" as PromptType,
 *   isActive: true,
 *   includeGlobal: true,
 * };
 * ```
 */
export interface AIPromptFilters {
	organizationId?: number | null;
	promptType?: PromptType;
	isActive?: boolean;
	createdBy?: string;
	includeGlobal?: boolean; // Include global prompts (null organizationId)
}

/**
 * Repository interface for AI Prompts
 * Defines persistence operations for versioned prompt management
 *
 * @example
 * ```ts
 * const repo: AIPromptRepository = getAIPromptRepository();
 * const active = await repo.findActive("INVOICE_SUMMARY" as PromptType, 1);
 * ```
 */
export interface AIPromptRepository {
	/**
	 * Save a new prompt
	 * @param prompt - The prompt entity to save
	 * @returns The saved prompt with assigned ID
	 */
	save(prompt: AIPrompt): Promise<AIPrompt>;

	/**
	 * Update an existing prompt (only isActive and updatedAt can change)
	 * @param prompt - The prompt entity to update
	 */
	update(prompt: AIPrompt): Promise<void>;

	/**
	 * Find a prompt by ID
	 * @param id - The prompt ID
	 * @returns The prompt if found, null otherwise
	 */
	findById(id: number): Promise<AIPrompt | null>;

	/**
	 * Find the active prompt for a given type and organization
	 * Falls back to global prompt if no organization-specific one exists
	 * @param promptType - The type of prompt
	 * @param organizationId - The organization ID (null for global)
	 */
	findActive(
		promptType: PromptType,
		organizationId?: number | null,
	): Promise<AIPrompt | null>;

	/**
	 * Find all prompts matching the filters
	 * @param filters - Optional filters
	 */
	findAll(filters?: AIPromptFilters): Promise<AIPrompt[]>;

	/**
	 * Find all versions of a prompt type for an organization
	 * Ordered by version (newest first)
	 */
	findVersionHistory(
		promptType: PromptType,
		organizationId?: number | null,
	): Promise<AIPrompt[]>;

	/**
	 * Find the latest version of a prompt type
	 */
	findLatestVersion(
		promptType: PromptType,
		organizationId?: number | null,
	): Promise<AIPrompt | null>;

	/**
	 * Deactivate all prompts of a type for an organization
	 * Used before activating a new version
	 */
	deactivateAllOfType(
		promptType: PromptType,
		organizationId?: number | null,
	): Promise<void>;

	/**
	 * Count prompts matching filters
	 */
	count(filters?: AIPromptFilters): Promise<number>;

	/**
	 * Delete a prompt (soft delete by marking inactive, or hard delete for drafts)
	 * Should only delete non-active prompts
	 */
	delete(id: number): Promise<void>;
}
