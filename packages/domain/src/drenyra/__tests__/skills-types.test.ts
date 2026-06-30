import { describe, expect, it } from "vitest";
import {
	LEXORI_CANONICAL_SKILL_IDS,
	LEXORI_SKILL_CATEGORY,
	renderLexoriSkillContext,
	validateLexoriSkillDefinition,
} from "../skills-types";

describe("skills-types", () => {
	const validSkill = {
		id: "sunat-cpe",
		name: "SUNAT CPE",
		category: LEXORI_SKILL_CATEGORY.SUNAT_CPE,
		description: "CPE validation rules",
		version: "1.0.0",
		rules: [{ id: "r1", description: "Validate series" }],
		contextTemplate: "RUC={ruc} period={period}",
	};

	it("validates a complete skill definition", () => {
		expect(validateLexoriSkillDefinition(validSkill)).toBe(true);
	});

	it("rejects skill with invalid category", () => {
		expect(
			validateLexoriSkillDefinition({
				...validSkill,
				category: "invalid" as typeof LEXORI_SKILL_CATEGORY.SUNAT_CPE,
			}),
		).toBe(false);
	});

	it("renders context template", () => {
		const result = renderLexoriSkillContext(validSkill, {
			ruc: "20123456789",
			period: "2026-05",
		});
		expect(result.renderedContext).toBe("RUC=20123456789 period=2026-05");
		expect(result.skillId).toBe("sunat-cpe");
	});

	it("throws on unresolved template variables", () => {
		expect(() =>
			renderLexoriSkillContext(validSkill, { ruc: "20123456789" }),
		).toThrow(/unresolved template variables/);
	});

	it("lists canonical skill ids", () => {
		expect(LEXORI_CANONICAL_SKILL_IDS).toContain("sunat-sire");
		expect(LEXORI_CANONICAL_SKILL_IDS).toHaveLength(6);
	});
});
