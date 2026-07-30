/**
 * Drenyra domain types — minimal set needed by drenyra-pi.
 * Extracted from @drenyra/domain/drenyra.
 */

// ─── Skills Types ──────────────────────────────────────────────────────
export interface LexoriSkillDefinition {
	id: string;
	name: string;
	description: string;
	version?: string;
	category?: string;
	context?: Record<string, unknown>;
	contextTemplate?: string;
	modelHint?: string;
	tags?: string[];
	rules?: Array<{ id: string; description: string }>;
}

export interface LexoriSkillContextResult {
	resolved: boolean;
	context: Record<string, unknown>;
	skill: LexoriSkillDefinition;
}

export function renderLexoriSkillContext(
	skill: LexoriSkillDefinition,
	variables?: Record<string, string>,
): LexoriSkillContextResult {
	const rendered =
		variables && skill.context
			? Object.entries(variables).reduce(
					(text, [key, value]) => text.replace(`{{${key}}}`, value),
					`${skill.name}: ${skill.description}`,
				)
			: `${skill.name}: ${skill.description}`;
	return {
		resolved: true,
		context: { rendered },
		skill,
	};
}

export function validateLexoriSkillDefinition(
	skill: Partial<LexoriSkillDefinition>,
): skill is LexoriSkillDefinition {
	return !!(skill.id && skill.name);
}

// ─── Drenyra Base Types ────────────────────────────────────────────────
export type DrenyraCapability =
	| "fiscal"
	| "compliance"
	| "audit"
	| "reporting"
	| "integration"
	| "intelligence";
