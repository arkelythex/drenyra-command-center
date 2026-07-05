/**
 * Upsert AI Settings Use Case
 * Creates or updates AI settings for a user
 */

import {
	type AISettingsResponseDTO,
	toAISettingsResponseDTO,
	type UpsertAISettingsDTO,
	upsertAISettingsSchema,
} from "../../dtos/ai-settings/ai-settings.dto";
import {
	AI_SETTINGS_MAX_CHARS,
	AISettings,
} from "@drenyra/domain/entities/AISettings";
import type { AISettingsRepository } from "@drenyra/domain/repositories/ai-settings.repository";

/**
 * UpsertAISettingsUseCase class.
 *
 * @example
 * ```ts
 * const value = new UpsertAISettingsUseCase();
 * console.log(value);
 * ```
 */
export class UpsertAISettingsUseCase {
	constructor(private readonly repository: AISettingsRepository) {}

	/**
	 * Execute the use case
	 * @param userId - The authenticated user's ID
	 * @param data - The settings data to save
	 * @returns The saved AI settings
	 */
	async execute(
		userId: string,
		data: UpsertAISettingsDTO,
	): Promise<AISettingsResponseDTO> {
		// Validate userId
		if (!userId || userId.trim().length === 0) {
			throw new Error("El ID de usuario es requerido");
		}

		// Validate input data using Zod
		const validationResult = upsertAISettingsSchema.safeParse(data);
		if (!validationResult.success) {
			const firstError = validationResult.error.issues[0];
			throw new Error(firstError?.message || "Datos de entrada inválidos");
		}

		const validatedData = validationResult.data;

		// Additional business validation for character limit
		if (
			validatedData.customSystemIndicator &&
			validatedData.customSystemIndicator.length > AI_SETTINGS_MAX_CHARS
		) {
			throw new Error(
				`El indicador del sistema no puede exceder ${AI_SETTINGS_MAX_CHARS} caracteres`,
			);
		}

		// Try to find existing settings
		const existingSettings = await this.repository.findByUserId(userId);

		let settingsToSave: AISettings;

		if (existingSettings) {
			// Update existing settings
			settingsToSave = existingSettings.setCustomSystemIndicator(
				validatedData.customSystemIndicator || null,
			);

			// Update enabled status if provided
			if (validatedData.isEnabled !== undefined) {
				settingsToSave = validatedData.isEnabled
					? settingsToSave.enable()
					: settingsToSave.disable();
			}
		} else {
			// Create new settings
			settingsToSave = AISettings.createNew(
				userId,
				validatedData.customSystemIndicator || undefined,
				validatedData.isEnabled ?? true,
			);
		}

		// Save and return
		const savedSettings = await this.repository.save(settingsToSave);
		return toAISettingsResponseDTO(savedSettings);
	}
}
