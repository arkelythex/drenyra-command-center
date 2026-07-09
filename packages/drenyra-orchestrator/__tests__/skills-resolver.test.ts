import { describe, it, expect } from "vitest";
import { parseSkillRegistry, matchSkills } from "../src/skills-resolver";

const SAMPLE_REGISTRY_MD = `# Drenyra Skill Registry

| Skill | Description | Trigger | Path |
|-------|-------------|---------|------|
| fiscal-compliance | Fiscal compliance review | fiscal, sunat, compliance, sires | .agent/skills/fiscal-compliance/SKILL.md |
| drenyra-sdd | Drenyra SDD pipeline | sdd, proposal, spec, design, tasks | .agent/skills/drenyra-sdd/SKILL.md |
| drenyra-gatekeeper | Phase gatekeeper validation | gatekeeper, phase-gate, validation | .agent/skills/drenyra-gatekeeper/SKILL.md |
| fiscal-review | Fiscal code review lens | review, audit, fiscal, compliance | .agent/skills/fiscal-review/SKILL.md |
| ruc-scope | RUC scoping and tenant isolation | ruc, tenant, scope, organization | .agent/skills/ruc-scope/SKILL.md |
| auth-review | Auth/security review lens | auth, security, permissions | .agent/skills/auth-review/SKILL.md |
`;

describe("skills-resolver", () => {
	describe("parseSkillRegistry", () => {
		it("parses markdown table into skill entries", () => {
			const registry = parseSkillRegistry(SAMPLE_REGISTRY_MD);
			expect(registry.skills).toHaveLength(6);
			expect(registry.skills[0]!.name).toBe("fiscal-compliance");
			expect(registry.skills[0]!.path).toBe(
				".agent/skills/fiscal-compliance/SKILL.md",
			);
			expect(registry.skills[0]!.scope).toBe("project");
		});

		it("marks global skills correctly", () => {
			const md = `| my-skill | desc | trig | ~/.pi/skills/foo/SKILL.md |`;
			const registry = parseSkillRegistry(md);
			expect(registry.skills).toHaveLength(1);
			expect(registry.skills[0]!.scope).toBe("global");
		});

		it("returns empty array for empty table", () => {
			const registry = parseSkillRegistry("no table here");
			expect(registry.skills).toHaveLength(0);
		});
	});

	describe("matchSkills", () => {
		const registry = parseSkillRegistry(SAMPLE_REGISTRY_MD);

		it("matches by intent keyword", () => {
			const result = matchSkills(
				{
					fileExtensions: [".ts"],
					targetPaths: ["packages/fiscal/"],
					intent: ["fiscal", "compliance"],
				},
				registry,
			);
			expect(result.names).toContain("fiscal-compliance");
			expect(result.paths).toContain(
				".agent/skills/fiscal-compliance/SKILL.md",
			);
		});

		it("matches by exact skill name", () => {
			const result = matchSkills(
				{
					fileExtensions: [".ts"],
					targetPaths: [],
					intent: [],
					skillNames: ["drenyra-sdd"],
				},
				registry,
			);
			expect(result.names).toContain("drenyra-sdd");
		});

		it("matches by file path", () => {
			const result = matchSkills(
				{
					fileExtensions: [".ts", ".tsx"],
					targetPaths: [
						"packages/phase-gatekeeper/",
						"apps/api/src/features/auth/",
					],
					intent: [],
				},
				registry,
			);
			expect(result.names).toContain("drenyra-gatekeeper");
			expect(result.names).toContain("auth-review");
		});

		it("matches by file extension", () => {
			const result = matchSkills(
				{
					fileExtensions: [".py"],
					targetPaths: ["apps/data-engine/"],
					intent: [],
				},
				registry,
			);
			// No .py-specific skills in the sample registry
			expect(result.names).toHaveLength(0);
		});

		it("returns empty for no match", () => {
			const result = matchSkills(
				{
					fileExtensions: [".css"],
					targetPaths: ["styles/"],
					intent: ["styling"],
				},
				registry,
			);
			expect(result.names).toHaveLength(0);
		});
	});
});
