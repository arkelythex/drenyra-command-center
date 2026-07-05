import { api } from "@/lib/api";
import { unwrap } from "@/lib/api-helpers";

export interface SkillDTO {
	id: string;
	name: string;
	description: string;
	category: string;
	version: string;
	author: string;
	status: string;
	installed?: boolean;
	capabilities?: SkillCapabilityDTO[];
}

export interface SkillCapabilityDTO {
	id: string;
	name: string;
	description: string;
	actionType: string;
}

export interface CompanySkillDTO {
	id: string;
	skillId: string;
	companyId: string;
	status: string;
	config: Record<string, unknown>;
	installedAt: string;
	installedBy: string;
	skill: SkillDTO;
}

export async function listSkills(): Promise<{ data: SkillDTO[] }> {
	return unwrap(api.api.skills.index.get()) as Promise<{ data: SkillDTO[] }>;
}

export async function getSkillDetail(id: string): Promise<SkillDTO> {
	return unwrap(api.api.skills({ id }).get()) as Promise<SkillDTO>;
}

export async function listInstalledSkills(): Promise<{
	data: CompanySkillDTO[];
}> {
	return unwrap(api.api.skills.installed.get()) as Promise<{
		data: CompanySkillDTO[];
	}>;
}

export async function installSkill(id: string): Promise<CompanySkillDTO> {
	return unwrap(
		api.api.skills({ id }).install.post(),
	) as Promise<CompanySkillDTO>;
}

export async function uninstallSkillApi(
	id: string,
): Promise<{ uninstalled: boolean }> {
	return unwrap(api.api.skills({ id }).uninstall.post()) as Promise<{
		uninstalled: boolean;
	}>;
}

export async function updateSkillConfig(
	id: string,
	config: Record<string, unknown>,
): Promise<CompanySkillDTO> {
	return unwrap(
		api.api.skills({ id }).config.patch({ config }),
	) as Promise<CompanySkillDTO>;
}

// ─── Query Keys ───

export const skillKeys = {
	all: ["skills"] as const,
	lists: () => [...skillKeys.all, "list"] as const,
	list: (filters?: Record<string, unknown>) =>
		[...skillKeys.lists(), filters] as const,
	details: () => [...skillKeys.all, "detail"] as const,
	detail: (id: string) => [...skillKeys.details(), id] as const,
	installed: () => [...skillKeys.all, "installed"] as const,
};
