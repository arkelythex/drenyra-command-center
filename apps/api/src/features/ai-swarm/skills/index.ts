/**
 * SkillForge — Registration & Public API
 *
 * All skills must be registered here at module load time.
 * Import this module once (in app-core.ts) to activate the full skill catalog.
 *
 * ZeroClaw equivalent: the skillforge module's initialization block
 * where all Tool implementations are discovered and registered.
 */

export type {
	Skill,
	SkillCategory,
	SkillContext,
	SkillInvocationResult,
	SkillMetadata,
	SkillSummary,
} from "./skill.types";
export { skillRegistry } from "./skill-registry";
export { adversarialAuditSkill } from "./sunat/adversarial-audit.skill";
export { knowledgeRetrievalSkill } from "./sunat/knowledge-retrieval.skill";
// --- Skill implementations ---
export { sireReadinessSkill } from "./sunat/sire-readiness.skill";

// --- Bootstrap: register all skills into the singleton registry ---
import { skillRegistry } from "./skill-registry";
import { adversarialAuditSkill } from "./sunat/adversarial-audit.skill";
import { knowledgeRetrievalSkill } from "./sunat/knowledge-retrieval.skill";
import { sireReadinessSkill } from "./sunat/sire-readiness.skill";

skillRegistry.register(sireReadinessSkill);
skillRegistry.register(adversarialAuditSkill);
skillRegistry.register(knowledgeRetrievalSkill);
