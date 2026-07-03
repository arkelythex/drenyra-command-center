/**
 * SkillStatus — lifecycle status of a skill in the catalog
 */

export type SkillStatus = "active" | "deprecated" | "experimental";

export const SKILL_STATUSES: readonly SkillStatus[] = [
	"active",
	"deprecated",
	"experimental",
] as const;

export type InstallationStatus = "installed" | "disabled";

export const INSTALLATION_STATUSES: readonly InstallationStatus[] = [
	"installed",
	"disabled",
] as const;
