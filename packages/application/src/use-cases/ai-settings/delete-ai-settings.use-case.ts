/**
 * Delete AI Settings Use Case
 * Removes AI settings for a user
 */

import type { AISettingsRepository } from "@drenyra/domain/repositories/ai-settings.repository";

/**
 * DeleteAISettingsUseCase class.
 *
 * @example
 * ```ts
 * const value = new DeleteAISettingsUseCase();
 * console.log(value);
 * ```
 */
export class DeleteAISettingsUseCase {
	constructor(private readonly repository: AISettingsRepository) {}

	/**
	 * Execute the use case
	 * @param userId - The authenticated user's ID
	 */
	async execute(userId: string): Promise<void> {
		if (!userId || userId.trim().length === 0) {
			throw new Error("El ID de usuario es requerido");
		}

		await this.repository.delete(userId);
	}
}
