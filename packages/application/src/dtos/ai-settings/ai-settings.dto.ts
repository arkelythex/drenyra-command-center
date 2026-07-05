/**
 * AI Settings DTOs (Data Transfer Objects)
 * Used for communication between layers
 */

import { z } from "zod";

// ============================================
// Validation Schema
// ============================================

/**
 * AI_SETTINGS_MAX_CHARS const.
 *
 * @example
 * ```ts
 * console.log(AI_SETTINGS_MAX_CHARS);
 * ```
 */
export const AI_SETTINGS_MAX_CHARS = 2000;

/**
 * upsertAISettingsSchema const.
 *
 * @example
 * ```ts
 * console.log(upsertAISettingsSchema);
 * ```
 */
export const upsertAISettingsSchema = z.object({
	customSystemIndicator: z
		.string()
		.max(AI_SETTINGS_MAX_CHARS, {
			message: `El indicador del sistema no puede exceder ${AI_SETTINGS_MAX_CHARS} caracteres`,
		})
		.optional()
		.nullable(),
	isEnabled: z.boolean().default(true),
});

// ============================================
// Request DTOs
// ============================================

/**
 * DTO for creating or updating AI settings
 * @example
 * ```ts
 * const value: UpsertAISettingsDTO = {} as UpsertAISettingsDTO;
 * console.log(value);
 * ```
 */

export interface UpsertAISettingsDTO {
	customSystemIndicator?: string | null;
	isEnabled?: boolean;
}

// ============================================
// Response DTOs
// ============================================

/**
 * DTO for returning AI settings to the client
 * @example
 * ```ts
 * const value: AISettingsResponseDTO = {} as AISettingsResponseDTO;
 * console.log(value);
 * ```
 */

export interface AISettingsResponseDTO {
	id: number;
	userId: string;
	customSystemIndicator: string | null;
	isEnabled: boolean;
	characterCount: number;
	remainingCharacters: number;
	createdAt: string;
	updatedAt: string;
}

// ============================================
// Mapper Functions
// ============================================

import type { AISettings } from "@drenyra/domain/entities/AISettings";

/**
 * Map domain entity to response DTO
 * @param entity - Input for entity.
 * @returns Result of toAISettingsResponseDTO.
 * @example
 * ```ts
 * const result = toAISettingsResponseDTO({} as AISettings);
 * console.log(result);
 * ```
 */

export function toAISettingsResponseDTO(
	entity: AISettings,
): AISettingsResponseDTO {
	return {
		id: entity.id,
		userId: entity.userId,
		customSystemIndicator: entity.customSystemIndicator,
		isEnabled: entity.isEnabled,
		characterCount: entity.getCharacterCount(),
		remainingCharacters: entity.getRemainingCharacters(),
		createdAt: entity.createdAt.toISOString(),
		updatedAt: entity.updatedAt.toISOString(),
	};
}

/**
 * Create a default response when no settings exist
 * @param userId - Input for userId.
 * @returns Result of createDefaultAISettingsResponseDTO.
 * @example
 * ```ts
 * const result = createDefaultAISettingsResponseDTO("");
 * console.log(result);
 * ```
 */

export function createDefaultAISettingsResponseDTO(
	userId: string,
): AISettingsResponseDTO {
	const now = new Date().toISOString();
	return {
		id: 0,
		userId,
		customSystemIndicator: null,
		isEnabled: true,
		characterCount: 0,
		remainingCharacters: AI_SETTINGS_MAX_CHARS,
		createdAt: now,
		updatedAt: now,
	};
}
