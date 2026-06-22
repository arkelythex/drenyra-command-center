/**
 * AI Settings Repository Interface
 * Defines the contract for AI settings persistence
 * This is a PORT in Clean Architecture (Application Layer)
 */

import type { AISettings } from "../entities/AISettings";

/**
 * Repository contract for persisting {@link AISettings}.
 *
 * @example
 * ```ts
 * const repo: AISettingsRepository = getAISettingsRepository();
 *
 * const existing = await repo.findByUserId("user_123");
 * const saved = await repo.save(existing ?? ({ userId: "user_123" } as AISettings));
 *
 * await repo.delete(saved.userId);
 * ```
 */
export interface AISettingsRepository {
	/**
	 * Find AI settings by user ID
	 * Returns null if no settings exist for the user
	 */
	findByUserId(userId: string): Promise<AISettings | null>;

	/**
	 * Save AI settings (create or update using UPSERT)
	 * Returns the saved/updated settings
	 */
	save(settings: AISettings): Promise<AISettings>;

	/**
	 * Delete AI settings for a user
	 * No-op if settings don't exist
	 */
	delete(userId: string): Promise<void>;
}
