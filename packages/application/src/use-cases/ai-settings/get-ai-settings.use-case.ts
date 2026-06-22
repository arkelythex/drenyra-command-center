/**
 * Get AI Settings Use Case
 * Retrieves current AI settings for an authenticated user
 */

import {
	type AISettingsResponseDTO,
	createDefaultAISettingsResponseDTO,
	toAISettingsResponseDTO,
} from "../../dtos/ai-settings/ai-settings.dto";
import type { AISettingsRepository } from "@arkelythex/domain/repositories/ai-settings.repository";

/**
 * GetAISettingsUseCase class.
 *
 * @example
 * ```ts
 * const value = new GetAISettingsUseCase();
 * console.log(value);
 * ```
 */
export class GetAISettingsUseCase {
	constructor(private readonly repository: AISettingsRepository) {}

	/**
	 * Execute the use case
	 * @param userId - The authenticated user's ID
	 * @returns The user's AI settings or default settings if none exist
	 */
	async execute(userId: string): Promise<AISettingsResponseDTO> {
		if (!userId || userId.trim().length === 0) {
			throw new Error("El ID de usuario es requerido");
		}

		const settings = await this.repository.findByUserId(userId);

		if (!settings) {
			// Return default settings when no record exists
			return createDefaultAISettingsResponseDTO(userId);
		}

		return toAISettingsResponseDTO(settings);
	}
}
