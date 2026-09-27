import { renderLexoriSkillContext } from "../_domain-types/domain-barrel";
import { fiscalDetractionsSkill, fiscalIgvSkill, fiscalRetentionsSkill, niifPcgeSkill, sunatCpeSkill, sunatSireSkill, } from "./skills/index";
const AGENT_SKILL_MAP = {
    eviden: [sunatCpeSkill, sunatSireSkill],
    vigila: [fiscalIgvSkill, fiscalDetractionsSkill, fiscalRetentionsSkill],
    traza: [sunatSireSkill, niifPcgeSkill],
    numina: [niifPcgeSkill],
};
export class LexoriSkillResolver {
    async resolveForAgent(agentId, variables) {
        const skills = AGENT_SKILL_MAP[agentId];
        if (!skills)
            return [];
        return skills.map((skill) => renderLexoriSkillContext(skill, variables));
    }
}
//# sourceMappingURL=lexori.resolver.js.map