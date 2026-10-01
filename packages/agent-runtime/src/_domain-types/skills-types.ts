/**
 * Lexori skill types — canonical schema shared by TS registry and Python executor.
 */

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

export interface LexoriSkillContextRequest {
	skillId: string;
	variables: Record<string, string>;
}

export interface LexoriSkillContextResult {
	skillId: string;
	category: LexoriSkillCategory;
	renderedContext: string;
	version: string;
}

/** Validates a skill definition has required fields. Fail-closed. */
export function validateLexoriSkillDefinition(
	skill: Partial<LexoriSkillDefinition>,
): skill is LexoriSkillDefinition {
	if (!skill.id?.trim()) return false;
	if (!skill.name?.trim()) return false;
	if (!skill.description?.trim()) return false;
	if (!skill.version?.trim()) return false;
	if (!skill.contextTemplate?.trim()) return false;
	if (!skill.category) return false;
	if (!Object.values(LEXORI_SKILL_CATEGORY).includes(skill.category)) {
		return false;
	}
	if (!Array.isArray(skill.rules)) return false;
	for (const rule of skill.rules) {
		if (!rule.id?.trim() || !rule.description?.trim()) return false;
	}
	return true;
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

/** Canonical skill ids matching apps/data-engine/src/skills/skills/*.skill.yaml */
export const LEXORI_CANONICAL_SKILL_IDS = [
	"sunat-cpe",
	"sunat-sire",
	"niif-pcge",
	"fiscal-igv",
	"fiscal-detractions",
	"fiscal-retentions",
] as const;
export type LexoriCanonicalSkillId =
	(typeof LEXORI_CANONICAL_SKILL_IDS)[number];
