/**
 * AISettings Entity (Configuración de IA del Usuario)
 * Core domain entity representing user-defined AI configuration
 *
 * Business Rules:
 * - One AISettings record per user (enforced at DB level)
 * - customSystemIndicator max length is 2000 characters
 * - When disabled (isEnabled=false), the indicator is not injected into prompts
 * Properties used to construct {@link AISettings}.
 *
 * @example
 * ```ts
 * const props: AISettingsProps = {
 *   id: 0,
 *   userId: "usr_123",
 *   customSystemIndicator: null,
 *   isEnabled: true,
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 * ```
 */

export interface AISettingsProps {
	id: number;
	userId: string;
	customSystemIndicator: string | null;
	isEnabled: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Maximum allowed characters for `customSystemIndicator`.
 *
 * @example
 * ```ts
 * const max = AI_SETTINGS_MAX_CHARS; // 2000
 * ```
 */
export const AI_SETTINGS_MAX_CHARS = 2000;

/**
 * User-configurable AI settings (per-user singleton).
 *
 * @example
 * ```ts
 * const settings = AISettings.createNew("usr_123", "Be concise", true);
 * settings.getEffectiveSystemIndicator(); // "Be concise"
 * ```
 */
export class AISettings {
	private constructor(private props: AISettingsProps) {
		this.validateBusinessRules();
	}

	/**
	 * Create a new AISettings instance
	 */
	static create(props: AISettingsProps): AISettings {
		return new AISettings(props);
	}

	/**
	 * Create a new AISettings instance for a user (factory method)
	 */
	static createNew(
		userId: string,
		customSystemIndicator?: string,
		isEnabled: boolean = true,
	): AISettings {
		const now = new Date();
		return new AISettings({
			id: 0, // Will be assigned by database
			userId,
			customSystemIndicator: customSystemIndicator?.trim() || null,
			isEnabled,
			createdAt: now,
			updatedAt: now,
		});
	}

	/**
	 * Validate all business rules
	 */
	private validateBusinessRules(): void {
		// Rule 1: userId is required
		if (!this.props.userId || this.props.userId.trim().length === 0) {
			throw new Error("El ID de usuario es requerido");
		}

		// Rule 2: customSystemIndicator max length
		if (
			this.props.customSystemIndicator &&
			this.props.customSystemIndicator.length > AI_SETTINGS_MAX_CHARS
		) {
			throw new Error(
				`El indicador del sistema no puede exceder ${AI_SETTINGS_MAX_CHARS} caracteres`,
			);
		}
	}

	/**
	 * Set the custom system indicator
	 * Enforces the 2000 character limit
	 */
	setCustomSystemIndicator(value: string | null): AISettings {
		const trimmedValue = value?.trim() || null;

		if (trimmedValue && trimmedValue.length > AI_SETTINGS_MAX_CHARS) {
			throw new Error(
				`El indicador del sistema no puede exceder ${AI_SETTINGS_MAX_CHARS} caracteres`,
			);
		}

		return new AISettings({
			...this.props,
			customSystemIndicator: trimmedValue,
			updatedAt: new Date(),
		});
	}

	/**
	 * Enable the custom system indicator
	 */
	enable(): AISettings {
		if (this.props.isEnabled) {
			return this; // Already enabled
		}

		return new AISettings({
			...this.props,
			isEnabled: true,
			updatedAt: new Date(),
		});
	}

	/**
	 * Disable the custom system indicator
	 */
	disable(): AISettings {
		if (!this.props.isEnabled) {
			return this; // Already disabled
		}

		return new AISettings({
			...this.props,
			isEnabled: false,
			updatedAt: new Date(),
		});
	}

	/**
	 * Toggle the enabled status
	 */
	toggle(): AISettings {
		return this.props.isEnabled ? this.disable() : this.enable();
	}

	/**
	 * Get the effective system indicator
	 * Returns the indicator only if it's enabled and has content
	 */
	getEffectiveSystemIndicator(): string | null {
		if (!this.props.isEnabled) {
			return null;
		}
		return this.props.customSystemIndicator;
	}

	/**
	 * Check if the settings have any custom indicator defined
	 */
	hasCustomIndicator(): boolean {
		return (
			this.props.customSystemIndicator !== null &&
			this.props.customSystemIndicator.trim().length > 0
		);
	}

	/**
	 * Get the character count of the custom indicator
	 */
	getCharacterCount(): number {
		return this.props.customSystemIndicator?.length || 0;
	}

	/**
	 * Get the remaining characters available
	 */
	getRemainingCharacters(): number {
		return AI_SETTINGS_MAX_CHARS - this.getCharacterCount();
	}

	/**
	 * Check equality by userId
	 */
	equals(other: AISettings | null | undefined): boolean {
		if (!other) return false;
		return this.props.userId === other.props.userId;
	}

	// Getters
	get id(): number {
		return this.props.id;
	}
	get userId(): string {
		return this.props.userId;
	}
	get customSystemIndicator(): string | null {
		return this.props.customSystemIndicator;
	}
	get isEnabled(): boolean {
		return this.props.isEnabled;
	}
	get createdAt(): Date {
		return this.props.createdAt;
	}
	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	/**
	 * Serialize to JSON (for persistence)
	 */
	toJSON(): Record<string, unknown> {
		return {
			id: this.props.id,
			userId: this.props.userId,
			customSystemIndicator: this.props.customSystemIndicator,
			isEnabled: this.props.isEnabled,
			createdAt: this.props.createdAt.toISOString(),
			updatedAt: this.props.updatedAt.toISOString(),
		};
	}

	/**
	 * Get props for persistence (internal use)
	 */
	getProps(): Readonly<AISettingsProps> {
		return { ...this.props };
	}
}
