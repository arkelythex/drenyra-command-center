/**
 * SkillCategory — classification for skills in the library
 */

export type SkillCategory = "fiscal" | "finance" | "operations" | "audit";

export const SKILL_CATEGORIES: readonly SkillCategory[] = [
	"fiscal",
	"finance",
	"operations",
	"audit",
] as const;

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
	fiscal: "Fiscal",
	finance: "Finanzas",
	operations: "Operaciones",
	audit: "Auditoría",
};
