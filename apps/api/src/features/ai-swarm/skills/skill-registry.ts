/**
 * SkillForge Registry
 *
 * Central registry for all AI swarm skills.
 * ZeroClaw equivalent: the `skillforge` module that maps skill IDs to implementations.
 *
 * Design principles:
 * - Single source of truth for available skills
 * - Type-safe invocation via Zod validation at boundaries
 * - AI-discoverable: `getAgentContext()` formats skill catalog for LLM prompts
 * - Auditable: every invocation is timestamped
 */

import type {
	Skill,
	SkillCategory,
	SkillContext,
	SkillInvocationResult,
	SkillSummary,
} from "./skill.types";

/**
 * SkillRegistry class.
 *
 * @example
 * ```ts
 * const value = new SkillRegistry();
 * console.log(value);
 * ```
 */
export class SkillRegistry {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private readonly skills = new Map<string, Skill<any, any>>();

	/**
	 * Register a skill. Throws if ID already registered.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	register(skill: Skill<any, any>): void {
		if (this.skills.has(skill.id)) {
			throw new Error(
				`[SkillRegistry] Skill '${skill.id}' is already registered. Use a unique ID.`,
			);
		}
		this.skills.set(skill.id, skill);
	}

	/**
	 * Invoke a skill by ID with type-safe input validation.
	 * Validates input against the skill's Zod schema before execution.
	 */
	async invoke<TOutput>(
		skillId: string,
		rawInput: unknown,
		ctx?: SkillContext,
	): Promise<SkillInvocationResult<TOutput>> {
		const skill = this.skills.get(skillId);
		if (!skill) {
			throw new Error(
				`[SkillRegistry] Skill '${skillId}' not found. Available: ${this.list().join(", ")}`,
			);
		}

		const parsed = skill.inputSchema.safeParse(rawInput);
		if (!parsed.success) {
			throw new Error(
				`[SkillRegistry] Invalid input for skill '${skillId}': ${parsed.error.message}`,
			);
		}

		const start = Date.now();
		const output = await skill.handler(parsed.data, ctx);

		return {
			skillId,
			output: output as TOutput,
			durationMs: Date.now() - start,
			timestamp: new Date(),
			traceId: ctx?.traceId,
		};
	}

	/**
	 * Discover available skills, optionally filtered by category.
	 * Used by agents to introspect available tools.
	 */
	discover(category?: SkillCategory): SkillSummary[] {
		const all = Array.from(this.skills.values());
		const filtered = category
			? all.filter((s) => s.category === category)
			: all;
		return filtered.map((s) => ({
			id: s.id,
			name: s.name,
			description: s.description,
			category: s.category,
			metadata: s.metadata,
		}));
	}

	/**
	 * Get a skill by ID. Returns undefined if not found.
	 */
	get(skillId: string): Skill | undefined {
		return this.skills.get(skillId);
	}

	/**
	 * List all registered skill IDs.
	 */
	list(): string[] {
		return Array.from(this.skills.keys());
	}

	/**
	 * Format skill catalog for injection into AI prompts.
	 * ZeroClaw equivalent: agent building its tool list string.
	 *
	 * Example output:
	 *   Tienes acceso a las siguientes habilidades SUNAT:
	 *   - sunat.sire-readiness: Verifica si la empresa está lista para SIRE...
	 *   - sunat.invoice-validation: Valida una factura contra las reglas SUNAT 2026...
	 */
	getAgentContext(category?: SkillCategory): string {
		const skills = this.discover(category);
		if (skills.length === 0) return "";

		const categoryLabel = category ?? "disponibles";
		const lines = skills.map(
			(s) =>
				`- ${s.id} [${s.metadata.deterministic ? "determinístico" : "IA"}]: ${s.description}`,
		);

		return [`Habilidades ${categoryLabel} en el enjambre:`, ...lines].join(
			"\n",
		);
	}
}

/**
 *  Singleton registry — shared across the entire AI swarm
 * @example
 * ```ts
 * console.log(skillRegistry);
 * ```
 */

export const skillRegistry = new SkillRegistry();
