import { and, eq } from "@drenyra/persistence/query";
import {
	companySkills,
	type InstallationStatus,
	skillCapabilities,
	skills,
} from "@drenyra/persistence/schema";
import { db } from "../../lib/db";

// ─── QUERIES ───

export async function findAllSkills(): Promise<
	Array<{
		id: string;
		name: string;
		description: string;
		category: string;
		version: string;
		author: string;
		status: string;
		metadata: Record<string, unknown> | null;
		createdAt: Date;
		updatedAt: Date;
	}>
> {
	return db.select().from(skills).orderBy(skills.name);
}

export async function findSkillById(id: string) {
	const [skill] = await db
		.select()
		.from(skills)
		.where(eq(skills.id, id))
		.limit(1);
	return skill ?? null;
}

export async function findCapabilitiesBySkillId(skillId: string) {
	return db
		.select()
		.from(skillCapabilities)
		.where(eq(skillCapabilities.skillId, skillId))
		.orderBy(skillCapabilities.sortOrder);
}

export async function findCompanySkill(companyId: string, skillId: string) {
	const [cs] = await db
		.select()
		.from(companySkills)
		.where(
			and(
				eq(companySkills.companyId, companyId),
				eq(companySkills.skillId, skillId),
			),
		)
		.limit(1);
	return cs ?? null;
}

export async function findCompanySkills(companyId: string) {
	return db
		.select()
		.from(companySkills)
		.where(eq(companySkills.companyId, companyId));
}

// ─── MUTATIONS ───

export async function installSkill(
	companyId: string,
	skillId: string,
	installedBy: string,
) {
	const [installation] = await db
		.insert(companySkills)
		.values({
			companyId,
			skillId,
			status: "installed" as InstallationStatus,
			config: {},
			installedBy,
		})
		.returning();
	return installation;
}

export async function uninstallSkill(companyId: string, skillId: string) {
	await db
		.delete(companySkills)
		.where(
			and(
				eq(companySkills.companyId, companyId),
				eq(companySkills.skillId, skillId),
			),
		);
}

export async function updateCompanySkillConfig(
	companyId: string,
	skillId: string,
	config: Record<string, unknown>,
) {
	const [updated] = await db
		.update(companySkills)
		.set({ config, updatedAt: new Date() })
		.where(
			and(
				eq(companySkills.companyId, companyId),
				eq(companySkills.skillId, skillId),
			),
		)
		.returning();
	return updated ?? null;
}
