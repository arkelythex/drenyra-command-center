import type {
	LexoriSkillContextResult,
	LexoriSkillDefinition,
} from "../_domain-types/domain-barrel";
import { renderLexoriSkillContext } from "../_domain-types/domain-barrel";
import {
	fiscalDetractionsSkill,
	fiscalIgvSkill,
	fiscalRetentionsSkill,
	niifPcgeSkill,
	sunatCpeSkill,
	sunatSireSkill,
} from "./skills/index";

/**
 * Maps agent IDs to their applicable Lexori fiscal skill categories.
 *
 * eviden → SUNAT CPE + SIRE (comprobantes y registros)
 * vigila → IGV + detracciones + retenciones (tributos)
 * traza  → SIRE + NIIF (trazabilidad contable-fiscal)
 * numina → NIIF (contabilidad general)
 */
const AGENT_SKILL_MAP: Record<string, LexoriSkillDefinition[]> = {
	eviden: [sunatCpeSkill, sunatSireSkill],
	vigila: [fiscalIgvSkill, fiscalDetractionsSkill, fiscalRetentionsSkill],
	traza: [sunatSireSkill, niifPcgeSkill],
	numina: [niifPcgeSkill],
};

/**
 * Resolves Lexori regulatory context for a target agent.
 *
 * Injected as optional dependency into DrenyraOrchestrator.
 * Each skill definition is rendered with case variables (RUC, periodo, etc.)
 * to produce a complete regulatory context block for the agent.
 */
export class LexoriSkillResolver {
	/**
	 * Resolve and render all applicable skill contexts for the given agent.
	 * Returns an empty array if the agent has no registered skills.
	 */
	async resolveForAgent(
		agentId: string,
		variables: Record<string, string>,
	): Promise<LexoriSkillContextResult[]> {
		const skills = AGENT_SKILL_MAP[agentId];
		if (!skills) return [];

		return skills.map((skill) => renderLexoriSkillContext(skill, variables));
	}
}
