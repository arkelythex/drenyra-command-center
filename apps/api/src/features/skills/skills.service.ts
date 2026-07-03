import { AppError } from "../../lib/errors";
import * as repo from "./skills.repository";

const ERROR_PREFIX = "SKILLS";

const ErrorCodes = {
	NOT_FOUND: `${ERROR_PREFIX}_NOT_FOUND`,
	ALREADY_INSTALLED: `${ERROR_PREFIX}_ALREADY_INSTALLED`,
	NOT_INSTALLED: `${ERROR_PREFIX}_NOT_INSTALLED`,
	SKILL_UNAVAILABLE: `${ERROR_PREFIX}_UNAVAILABLE`,
} as const;

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

export class SkillsService {
	async listSkills(
		companyId?: string,
	): Promise<{ data: SkillDTO[] }> {
		const allSkills = await repo.findAllSkills();

		// If company context exists, fetch installed skills for enrichment
		let installedSkillIds = new Set<string>();
		if (companyId) {
			const installed = await repo.findCompanySkills(companyId);
			installedSkillIds = new Set(installed.map((i) => i.skillId));
		}

		const data: SkillDTO[] = allSkills.map((s) => ({
			id: s.id,
			name: s.name,
			description: s.description,
			category: s.category,
			version: s.version,
			author: s.author,
			status: s.status,
			installed: installedSkillIds.has(s.id),
		}));

		return { data };
	}

	async getSkillDetail(
		id: string,
		companyId?: string,
	): Promise<SkillDTO> {
		const skill = await repo.findSkillById(id);
		if (!skill) {
			throw new AppError(
				404,
				ErrorCodes.NOT_FOUND,
				`Skill not found: ${id}`,
			);
		}

		const capabilities = await repo.findCapabilitiesBySkillId(id);

		let installed = false;
		if (companyId) {
			const cs = await repo.findCompanySkill(companyId, id);
			installed = cs !== null;
		}

		return {
			id: skill.id,
			name: skill.name,
			description: skill.description,
			category: skill.category,
			version: skill.version,
			author: skill.author,
			status: skill.status,
			installed,
			capabilities: capabilities.map((c) => ({
				id: c.id,
				name: c.name,
				description: c.description,
				actionType: c.actionType,
			})),
		};
	}

	async listInstalled(companyId: string): Promise<{ data: CompanySkillDTO[] }> {
		const installed = await repo.findCompanySkills(companyId);

		const data: CompanySkillDTO[] = [];
		for (const cs of installed) {
			const skill = await repo.findSkillById(cs.skillId);
			if (!skill) continue;

			data.push({
				id: cs.id,
				skillId: cs.skillId,
				companyId: cs.companyId,
				status: cs.status,
				config: cs.config as Record<string, unknown>,
				installedAt: cs.installedAt.toISOString(),
				installedBy: cs.installedBy,
				skill: {
					id: skill.id,
					name: skill.name,
					description: skill.description,
					category: skill.category,
					version: skill.version,
					author: skill.author,
					status: skill.status,
					installed: true,
				},
			});
		}

		return { data };
	}

	async installSkill(
		companyId: string,
		skillId: string,
		installedBy: string,
	): Promise<CompanySkillDTO> {
		// Verify skill exists
		const skill = await repo.findSkillById(skillId);
		if (!skill) {
			throw new AppError(
				404,
				ErrorCodes.NOT_FOUND,
				`Skill not found: ${skillId}`,
			);
		}

		// Check not already installed
		const existing = await repo.findCompanySkill(companyId, skillId);
		if (existing) {
			throw new AppError(
				409,
				ErrorCodes.ALREADY_INSTALLED,
				`Skill already installed: ${skillId}`,
			);
		}

		const installation = await repo.installSkill(companyId, skillId, installedBy);

		return {
			id: installation.id,
			skillId: installation.skillId,
			companyId: installation.companyId,
			status: installation.status,
			config: installation.config as Record<string, unknown>,
			installedAt: installation.installedAt.toISOString(),
			installedBy: installation.installedBy,
			skill: {
				id: skill.id,
				name: skill.name,
				description: skill.description,
				category: skill.category,
				version: skill.version,
				author: skill.author,
				status: skill.status,
				installed: true,
			},
		};
	}

	async uninstallSkill(
		companyId: string,
		skillId: string,
	): Promise<{ uninstalled: boolean }> {
		const existing = await repo.findCompanySkill(companyId, skillId);
		if (!existing) {
			throw new AppError(
				404,
				ErrorCodes.NOT_INSTALLED,
				`Skill not installed: ${skillId}`,
			);
		}

		await repo.uninstallSkill(companyId, skillId);
		return { uninstalled: true };
	}

	async updateConfig(
		companyId: string,
		skillId: string,
		config: Record<string, unknown>,
	): Promise<CompanySkillDTO> {
		const existing = await repo.findCompanySkill(companyId, skillId);
		if (!existing) {
			throw new AppError(
				404,
				ErrorCodes.NOT_INSTALLED,
				`Skill not installed: ${skillId}`,
			);
		}

		const updated = await repo.updateCompanySkillConfig(
			companyId,
			skillId,
			config,
		);
		if (!updated) {
			throw new AppError(500, "INTERNAL_ERROR", "Failed to update config");
		}

		const skill = await repo.findSkillById(skillId);

		return {
			id: updated.id,
			skillId: updated.skillId,
			companyId: updated.companyId,
			status: updated.status,
			config: updated.config as Record<string, unknown>,
			installedAt: updated.installedAt.toISOString(),
			installedBy: updated.installedBy,
			skill: {
				id: skill!.id,
				name: skill!.name,
				description: skill!.description,
				category: skill!.category,
				version: skill!.version,
				author: skill!.author,
				status: skill!.status,
				installed: true,
			},
		};
	}
}

export const skillsService = new SkillsService();
