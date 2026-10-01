/**
 * Drenyra domain types — minimal set needed by drenyra-pi.
 * Extracted from @drenyra/domain/drenyra.
 */

// ─── Skills Types ──────────────────────────────────────────────────────

export const LEXORI_SKILL_CATEGORY = {
	SUNAT_CPE: "sunat-cpe",
	SUNAT_SIRE: "sunat-sire",
	SUNAT_PLE: "sunat-ple",
	NIIF_PCGE: "niif-pcge",
	FISCAL_IGV: "fiscal-igv",
	FISCAL_DETRACTIONS: "fiscal-detractions",
	FISCAL_RETENTIONS: "fiscal-retentions",
} as const;
export type LexoriSkillCategory =
	(typeof LEXORI_SKILL_CATEGORY)[keyof typeof LEXORI_SKILL_CATEGORY];

export interface LexoriSkillRule {
	id: string;
	description: string;
	condition?: string;
	action?: string;
	references?: readonly string[];
}

export interface LexoriSkillDefinition {
	id: string;
	name: string;
	category: LexoriSkillCategory;
	description: string;
	version: string;
	rules: readonly LexoriSkillRule[];
	contextTemplate: string;
	tags?: readonly string[];
	modelHint?: string;
}

export interface LexoriSkillContextResult {
	skillId: string;
	category: LexoriSkillCategory;
	renderedContext: string;
	version: string;
}

/** Renders a skill context template with provided variables. Missing keys fail-closed. */
export function renderLexoriSkillContext(
	skill: LexoriSkillDefinition,
	variables: Record<string, string>,
): LexoriSkillContextResult {
	let rendered = skill.contextTemplate;
	for (const [key, value] of Object.entries(variables)) {
		rendered = rendered.replaceAll(`{${key}}`, value);
	}
	if (/\{[a-zA-Z_]+\}/.test(rendered)) {
		throw new Error(
			`Lexori skill ${skill.id}: unresolved template variables remain`,
		);
	}
	return {
		skillId: skill.id,
		category: skill.category,
		renderedContext: rendered,
		version: skill.version,
	};
}

// ─── Drenyra Base Types ────────────────────────────────────────────────
export type DrenyraCapability =
	| "fiscal"
	| "compliance"
	| "audit"
	| "reporting"
	| "integration"
	| "intelligence";
