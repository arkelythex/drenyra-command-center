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
	rules?: string[];
}

export interface LexoriSkillContextResult {
	resolved: boolean;
	context: Record<string, unknown>;
	skill: LexoriSkillDefinition;
}

export function renderLexoriSkillContext(
	skill: LexoriSkillDefinition,
): string {
	return `${skill.name}: ${skill.description}`;
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
