/**
 * AIPrompt Entity
 * Core domain entity representing a versioned AI prompt for the system.
 *
 * Business Rules:
 * - Only ONE active prompt per (organizationId, promptType) combination
 * - Version follows semver (1.0.0, 1.1.0, 2.0.0)
 * - Prompts are immutable once created (create new version instead)
 * - Rollback creates a new version pointing to previous
 * - Organization-specific prompts override global defaults (null organizationId)
 */

import { PromptVersion } from "../value-objects/PromptVersion";

/**
 * Supported AI prompt types in the system.
 *
 * @example
 * ```ts
 * const t: PromptType = "classification";
 * ```
 */
export type PromptType =
	| "ocr_extraction"
	| "validation"
	| "antigravity"
	| "classification"
	| "journal_suggestion";

/**
 * Properties used to construct an {@link AIPrompt}.
 *
 * @example
 * ```ts
 * const props: AIPromptProps = {
 *   id: 0,
 *   organizationId: null,
 *   promptType: "classification",
 *   version: PromptVersion.initial(),
 *   isActive: false,
 *   name: "Default",
 *   description: null,
 *   systemPrompt: "You are ...",
 *   userPromptTemplate: null,
 *   modelPreference: null,
 *   temperature: 0.1,
 *   maxTokens: null,
 *   createdBy: "system",
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 *   previousVersionId: null,
 *   rollbackReason: null,
 * };
 * ```
 */
export interface AIPromptProps {
	id: number;
	organizationId: number | null; // null = global default
	promptType: PromptType;
	version: PromptVersion;
	isActive: boolean;
	name: string;
	description: string | null;
	systemPrompt: string;
	userPromptTemplate: string | null;
	modelPreference: string | null;
	temperature: number;
	maxTokens: number | null;
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
	previousVersionId: number | null;
	rollbackReason: string | null;
}

/**
 * Input payload for creating an initial prompt (version 1.0.0).
 *
 * @example
 * ```ts
 * const input: CreateAIPromptInput = { promptType: "classification", name: "My Prompt", systemPrompt: "You are ...", createdBy: "usr_1" };
 * ```
 */
export interface CreateAIPromptInput {
	organizationId?: number | null;
	promptType: PromptType;
	name: string;
	description?: string | null;
	systemPrompt: string;
	userPromptTemplate?: string | null;
	modelPreference?: string | null;
	temperature?: number;
	maxTokens?: number | null;
	createdBy: string;
}

/**
 * Input payload for creating a new prompt version.
 *
 * @example
 * ```ts
 * const input: NewVersionInput = { systemPrompt: "Updated...", createdBy: "usr_1", versionBump: "patch" };
 * ```
 */
export interface NewVersionInput {
	name?: string;
	description?: string | null;
	systemPrompt: string;
	userPromptTemplate?: string | null;
	modelPreference?: string | null;
	temperature?: number;
	maxTokens?: number | null;
	createdBy: string;
	versionBump: "patch" | "minor" | "major";
}

/**
 * Versioned AI prompt aggregate.
 *
 * @example
 * ```ts
 * const prompt = AIPrompt.createNew({ promptType: "classification", name: "Default", systemPrompt: "You are ...", createdBy: "system" });
 * const v2 = prompt.createNewVersion({ systemPrompt: "Updated", createdBy: "system", versionBump: "patch" });
 * ```
 */
export class AIPrompt {
	private constructor(private props: AIPromptProps) {
		this.validateBusinessRules();
		Object.freeze(this.props);
	}

	/**
	 * Reconstitute from persistence
	 */
	static create(props: AIPromptProps): AIPrompt {
		return new AIPrompt(props);
	}

	/**
	 * Create a new prompt (first version: 1.0.0)
	 */
	static createNew(input: CreateAIPromptInput): AIPrompt {
		const now = new Date();
		return new AIPrompt({
			id: 0, // Will be assigned by database
			organizationId: input.organizationId ?? null,
			promptType: input.promptType,
			version: PromptVersion.initial(),
			isActive: false, // Must be explicitly activated
			name: input.name.trim(),
			description: input.description?.trim() || null,
			systemPrompt: input.systemPrompt,
			userPromptTemplate: input.userPromptTemplate || null,
			modelPreference: input.modelPreference || null,
			temperature: input.temperature ?? 0.1,
			maxTokens: input.maxTokens ?? null,
			createdBy: input.createdBy,
			createdAt: now,
			updatedAt: now,
			previousVersionId: null,
			rollbackReason: null,
		});
	}

	/**
	 * Create a new version based on this prompt
	 */
	createNewVersion(input: NewVersionInput): AIPrompt {
		const newVersion =
			input.versionBump === "major"
				? this.props.version.incrementMajor()
				: input.versionBump === "minor"
					? this.props.version.incrementMinor()
					: this.props.version.incrementPatch();

		const now = new Date();
		return new AIPrompt({
			id: 0, // New ID from database
			organizationId: this.props.organizationId,
			promptType: this.props.promptType,
			version: newVersion,
			isActive: false, // New versions are not active by default
			name: input.name?.trim() || this.props.name,
			description:
				input.description !== undefined
					? input.description?.trim() || null
					: this.props.description,
			systemPrompt: input.systemPrompt,
			userPromptTemplate:
				input.userPromptTemplate !== undefined
					? input.userPromptTemplate
					: this.props.userPromptTemplate,
			modelPreference:
				input.modelPreference !== undefined
					? input.modelPreference
					: this.props.modelPreference,
			temperature: input.temperature ?? this.props.temperature,
			maxTokens:
				input.maxTokens !== undefined ? input.maxTokens : this.props.maxTokens,
			createdBy: input.createdBy,
			createdAt: now,
			updatedAt: now,
			previousVersionId: this.props.id,
			rollbackReason: null,
		});
	}

	/**
	 * Create a rollback version (restores previous prompt content with new version)
	 */
	createRollbackVersion(
		targetPrompt: AIPrompt,
		createdBy: string,
		reason: string,
	): AIPrompt {
		if (targetPrompt.props.organizationId !== this.props.organizationId) {
			throw new Error(
				"Cannot rollback to a prompt from a different organization",
			);
		}
		if (targetPrompt.props.promptType !== this.props.promptType) {
			throw new Error("Cannot rollback to a prompt of a different type");
		}

		const newVersion = this.props.version.incrementPatch();
		const now = new Date();

		return new AIPrompt({
			id: 0,
			organizationId: this.props.organizationId,
			promptType: this.props.promptType,
			version: newVersion,
			isActive: false,
			name: `${targetPrompt.props.name} (Rollback)`,
			description: `Rollback to v${targetPrompt.props.version.toString()}: ${reason}`,
			systemPrompt: targetPrompt.props.systemPrompt,
			userPromptTemplate: targetPrompt.props.userPromptTemplate,
			modelPreference: targetPrompt.props.modelPreference,
			temperature: targetPrompt.props.temperature,
			maxTokens: targetPrompt.props.maxTokens,
			createdBy: createdBy,
			createdAt: now,
			updatedAt: now,
			previousVersionId: this.props.id,
			rollbackReason: reason,
		});
	}

	/**
	 * Activate this prompt (will be used for inference)
	 */
	activate(): AIPrompt {
		if (this.props.isActive) {
			return this;
		}
		return new AIPrompt({
			...this.props,
			isActive: true,
			updatedAt: new Date(),
		});
	}

	/**
	 * Deactivate this prompt
	 */
	deactivate(): AIPrompt {
		if (!this.props.isActive) {
			return this;
		}
		return new AIPrompt({
			...this.props,
			isActive: false,
			updatedAt: new Date(),
		});
	}

	/**
	 * Validate business rules
	 */
	private validateBusinessRules(): void {
		// Rule 1: Name is required
		if (!this.props.name || this.props.name.trim().length === 0) {
			throw new Error("El nombre del prompt es requerido");
		}

		// Rule 2: System prompt is required
		if (
			!this.props.systemPrompt ||
			this.props.systemPrompt.trim().length === 0
		) {
			throw new Error("El system prompt es requerido");
		}

		// Rule 3: Temperature must be between 0 and 2
		if (this.props.temperature < 0 || this.props.temperature > 2) {
			throw new Error("La temperatura debe estar entre 0 y 2");
		}

		// Rule 4: createdBy is required
		if (!this.props.createdBy || this.props.createdBy.trim().length === 0) {
			throw new Error("El creador del prompt es requerido");
		}

		// Rule 5: maxTokens must be positive if set
		if (this.props.maxTokens !== null && this.props.maxTokens <= 0) {
			throw new Error("maxTokens debe ser un número positivo");
		}
	}

	/**
	 * Check if this is a global (default) prompt
	 */
	isGlobal(): boolean {
		return this.props.organizationId === null;
	}

	/**
	 * Check if this is an organization-specific prompt
	 */
	isOrganizationSpecific(): boolean {
		return this.props.organizationId !== null;
	}

	/**
	 * Check if this prompt is a rollback
	 */
	isRollback(): boolean {
		return this.props.rollbackReason !== null;
	}

	/**
	 * Compare versions
	 */
	isNewerThan(other: AIPrompt): boolean {
		return this.props.version.isNewerThan(other.props.version);
	}

	/**
	 * Check equality by ID
	 */
	equals(other: AIPrompt | null | undefined): boolean {
		if (!other) return false;
		return this.props.id === other.props.id;
	}

	// Getters
	get id(): number {
		return this.props.id;
	}
	get organizationId(): number | null {
		return this.props.organizationId;
	}
	get promptType(): PromptType {
		return this.props.promptType;
	}
	get version(): PromptVersion {
		return this.props.version;
	}
	get versionString(): string {
		return this.props.version.toString();
	}
	get isActive(): boolean {
		return this.props.isActive;
	}
	get name(): string {
		return this.props.name;
	}
	get description(): string | null {
		return this.props.description;
	}
	get systemPrompt(): string {
		return this.props.systemPrompt;
	}
	get userPromptTemplate(): string | null {
		return this.props.userPromptTemplate;
	}
	get modelPreference(): string | null {
		return this.props.modelPreference;
	}
	get temperature(): number {
		return this.props.temperature;
	}
	get maxTokens(): number | null {
		return this.props.maxTokens;
	}
	get createdBy(): string {
		return this.props.createdBy;
	}
	get createdAt(): Date {
		return this.props.createdAt;
	}
	get updatedAt(): Date {
		return this.props.updatedAt;
	}
	get previousVersionId(): number | null {
		return this.props.previousVersionId;
	}
	get rollbackReason(): string | null {
		return this.props.rollbackReason;
	}

	/**
	 * Get the full prompt for use in AI inference
	 * Combines system prompt with user template
	 */
	getFullPrompt(userInput?: Record<string, string>): {
		system: string;
		user?: string;
	} {
		let userPrompt: string | undefined;

		if (this.props.userPromptTemplate && userInput) {
			userPrompt = this.props.userPromptTemplate;
			for (const [key, value] of Object.entries(userInput)) {
				userPrompt = userPrompt.replace(new RegExp(`{{${key}}}`, "g"), value);
			}
		} else if (this.props.userPromptTemplate) {
			userPrompt = this.props.userPromptTemplate;
		}

		return {
			system: this.props.systemPrompt,
			user: userPrompt,
		};
	}

	/**
	 * Serialize to JSON
	 */
	toJSON(): Record<string, unknown> {
		return {
			id: this.props.id,
			organizationId: this.props.organizationId,
			promptType: this.props.promptType,
			version: this.props.version.toString(),
			isActive: this.props.isActive,
			name: this.props.name,
			description: this.props.description,
			systemPrompt: this.props.systemPrompt,
			userPromptTemplate: this.props.userPromptTemplate,
			modelPreference: this.props.modelPreference,
			temperature: this.props.temperature,
			maxTokens: this.props.maxTokens,
			createdBy: this.props.createdBy,
			createdAt: this.props.createdAt.toISOString(),
			updatedAt: this.props.updatedAt.toISOString(),
			previousVersionId: this.props.previousVersionId,
			rollbackReason: this.props.rollbackReason,
		};
	}

	/**
	 * Get props (internal use)
	 */
	getProps(): Readonly<AIPromptProps> {
		return { ...this.props };
	}
}
