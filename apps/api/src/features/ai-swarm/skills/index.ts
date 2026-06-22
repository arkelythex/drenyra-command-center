/**
 * SkillForge — Registration & Public API
 *
 * All skills must be registered here at module load time.
 * Import this module once (in app-core.ts) to activate the full skill catalog.
 *
 * ZeroClaw equivalent: the skillforge module's initialization block
 * where all Tool implementations are discovered and registered.
 */

export { skillRegistry } from "./skill-registry";
export type {
	Skill,
	SkillCategory,
	SkillContext,
	SkillInvocationResult,
	SkillSummary,
	SkillMetadata,
} from "./skill.types";

// --- Skill implementations ---
export { sireReadinessSkill } from "./sunat/sire-readiness.skill";
export { adversarialAuditSkill } from "./sunat/adversarial-audit.skill";
export { knowledgeRetrievalSkill } from "./sunat/knowledge-retrieval.skill";

// --- Civic Skills ---
export { validateElectoralActSkill } from "./civic/validate-electoral-act.skill";
export { detectFraudPatternSkill } from "./civic/detect-fraud-pattern.skill";
export { queryElectionResultsSkill } from "./civic/query-election-results.skill";
export { queryAuditTrailSkill } from "./civic/query-audit-trail.skill";

// --- Bootstrap: register all skills into the singleton registry ---
import { skillRegistry } from "./skill-registry";
import { sireReadinessSkill } from "./sunat/sire-readiness.skill";
import { adversarialAuditSkill } from "./sunat/adversarial-audit.skill";
import { knowledgeRetrievalSkill } from "./sunat/knowledge-retrieval.skill";
import { validateElectoralActSkill } from "./civic/validate-electoral-act.skill";
import { detectFraudPatternSkill } from "./civic/detect-fraud-pattern.skill";
import { queryElectionResultsSkill } from "./civic/query-election-results.skill";
import { queryAuditTrailSkill } from "./civic/query-audit-trail.skill";

skillRegistry.register(sireReadinessSkill);
skillRegistry.register(adversarialAuditSkill);
skillRegistry.register(knowledgeRetrievalSkill);
skillRegistry.register(validateElectoralActSkill);
skillRegistry.register(detectFraudPatternSkill);
skillRegistry.register(queryElectionResultsSkill);
skillRegistry.register(queryAuditTrailSkill);
