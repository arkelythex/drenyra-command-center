/**
 * PostgreSQL Implementation of AISettingsRepository
 * Infrastructure layer - implements domain repository interface
 */

import { eq } from "drizzle-orm";
import { AISettings } from "@arkelythex/domain/entities/AISettings";
import type { AISettingsRepository } from "@arkelythex/domain/repositories/ai-settings.repository";
import { db } from "@arkelythex/persistence/client";
import { userAISettings } from "@arkelythex/persistence/schema";

/**
 * PostgresAISettingsRepository class.
 *
 * @example
 * ```ts
 * const value = new PostgresAISettingsRepository();
 * console.log(value);
 * ```
 */
export class PostgresAISettingsRepository implements AISettingsRepository {
	/**
	 * Find AI settings by user ID
	 */
	async findByUserId(userId: string): Promise<AISettings | null> {
		const result = await db
			.select()
			.from(userAISettings)
			.where(eq(userAISettings.userId, userId))
			.limit(1);

		if (!result[0]) return null;

		return this.mapToDomain(result[0]);
	}

	/**
	 * Save AI settings (create or update using UPSERT)
	 */
	async save(settings: AISettings): Promise<AISettings> {
		const props = settings.getProps();

		// Use upsert pattern (insert or update on conflict)
		const result = await db
			.insert(userAISettings)
			.values({
				userId: props.userId,
				customSystemIndicator: props.customSystemIndicator,
				isEnabled: props.isEnabled,
				createdAt: props.createdAt,
				updatedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: userAISettings.userId,
				set: {
					customSystemIndicator: props.customSystemIndicator,
					isEnabled: props.isEnabled,
					updatedAt: new Date(),
				},
			})
			.returning();

		if (!result[0]) {
			throw new Error("Failed to save AI settings");
		}

		return this.mapToDomain(result[0]);
	}

	/**
	 * Delete AI settings for a user
	 */
	async delete(userId: string): Promise<void> {
		await db.delete(userAISettings).where(eq(userAISettings.userId, userId));
	}

	/**
	 * Map database record to domain entity
	 */
	private mapToDomain(raw: typeof userAISettings.$inferSelect): AISettings {
		return AISettings.create({
			id: raw.id,
			userId: raw.userId,
			customSystemIndicator: raw.customSystemIndicator,
			isEnabled: raw.isEnabled,
			createdAt: raw.createdAt,
			updatedAt: raw.updatedAt,
		});
	}
}
