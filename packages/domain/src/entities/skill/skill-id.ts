/**
 * SkillId — branded string type for skill identity
 *
 * @example
 * const id = createSkillId();
 * const repo: Map<SkillId, Skill> = new Map();
 * repo.set(id, skill);
 * repo.get(id) // type-safe: requires SkillId, not just string
 */

export type SkillId = string & { readonly __brand: "SkillId" };

export function createSkillId(): SkillId {
	return crypto.randomUUID() as SkillId;
}

export function skillIdFromString(value: string): SkillId {
	return value as SkillId;
}
