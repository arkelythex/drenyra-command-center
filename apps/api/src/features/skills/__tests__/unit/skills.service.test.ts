import { beforeEach, describe, expect, it, vi } from "vitest";
import { SkillsService } from "../../skills.service";
import * as repo from "../../skills.repository";

vi.mock("../../skills.repository", () => ({
	findAllSkills: vi.fn(), findCompanySkills: vi.fn(), findSkillById: vi.fn(),
	findCapabilitiesBySkillId: vi.fn(), findCompanySkill: vi.fn(), installSkill: vi.fn(),
	uninstallSkill: vi.fn(), updateCompanySkillConfig: vi.fn(),
}));

const skill = { id: "skill-1", name: "Tax", description: "Tax checks", category: "fiscal", version: "1.0.0", author: "Drenyra", status: "active" };
const installation = { id: "install-1", skillId: "skill-1", companyId: "company-1", status: "installed", config: {}, installedAt: new Date("2026-01-01"), installedBy: "user-1" };

describe("SkillsService", () => {
	const service = new SkillsService();
	beforeEach(() => vi.resetAllMocks());

	it("lists available skills", async () => {
		vi.mocked(repo.findAllSkills).mockResolvedValue([skill]);
		await expect(service.listSkills()).resolves.toEqual({ data: [{ ...skill, installed: false }] });
	});

	it("marks company installations in the skill list", async () => {
		vi.mocked(repo.findAllSkills).mockResolvedValue([skill]);
		vi.mocked(repo.findCompanySkills).mockResolvedValue([installation] as never);
		await expect(service.listSkills("company-1")).resolves.toMatchObject({ data: [{ id: "skill-1", installed: true }] });
	});

	it("rejects details for an unknown skill", async () => {
		vi.mocked(repo.findSkillById).mockResolvedValue(null);
		await expect(service.getSkillDetail("missing")).rejects.toThrow("Skill not found");
	});

	it("rejects installation when the skill is already installed", async () => {
		vi.mocked(repo.findSkillById).mockResolvedValue(skill);
		vi.mocked(repo.findCompanySkill).mockResolvedValue(installation as never);
		await expect(service.installSkill("company-1", "skill-1", "user-1")).rejects.toThrow("already installed");
	});

	it("uninstalls an existing company skill", async () => {
		vi.mocked(repo.findCompanySkill).mockResolvedValue(installation as never);
		await expect(service.uninstallSkill("company-1", "skill-1")).resolves.toEqual({ uninstalled: true });
		expect(repo.uninstallSkill).toHaveBeenCalledWith("company-1", "skill-1");
	});
});
