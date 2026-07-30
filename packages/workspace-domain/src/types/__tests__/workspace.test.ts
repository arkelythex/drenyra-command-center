import { describe, it, expect } from "vitest";
import {
	createWorkspace,
	addCompanyToWorkspace,
	changeWorkspaceObjective,
	parseWorkspaceId,
	createWorkspaceId,
	workspaceToJSON,
	workspaceFromJSON,
	objectiveDisplayName,
	type CreateWorkspaceInput,
	CURRENT_WORKSPACE_SCHEMA_VERSION,
} from "../workspace";
import {
	WorkspaceDuplicateCompanyError,
	WorkspaceSchemaVersionError,
} from "../errors";

describe("parseWorkspaceId", () => {
	it("should parse a valid UUID-formatted id", () => {
		const id = createWorkspaceId();
		const [parsed, err] = parseWorkspaceId(id);
		expect(err).toBeNull();
		expect(parsed).toBe(id);
	});

	it("should reject empty string", () => {
		const [parsed, err] = parseWorkspaceId("");
		expect(parsed).toBeNull();
		expect(err).toBeInstanceOf(Error);
		expect(err!.message).toContain("empty");
	});

	it("should reject whitespace-only string", () => {
		const [parsed, err] = parseWorkspaceId("   ");
		expect(parsed).toBeNull();
		expect(err).toBeInstanceOf(Error);
	});

	it("should reject malformed string", () => {
		const [parsed, err] = parseWorkspaceId("not-a-uuid");
		expect(parsed).toBeNull();
		expect(err).toBeInstanceOf(Error);
	});
});

describe("createWorkspace", () => {
	const validInput: CreateWorkspaceInput = {
		organizationId: "org-1",
		companyIds: ["company-a"],
		fiscalPeriodIds: ["2026-01"],
		objective: { kind: "monthly-close", fiscalPeriodId: "2026-01" },
		layoutId: null,
	};

	it("should create a FinancialWorkspace with all required fields", () => {
		const ws = createWorkspace(validInput);

		expect(ws.schemaVersion).toBe(CURRENT_WORKSPACE_SCHEMA_VERSION);
		expect(ws.revision).toBe(1);
		expect(ws.workspaceId).toBeDefined();
		expect(typeof ws.workspaceId).toBe("string");
		expect(ws.workspaceId.length).toBeGreaterThan(0);
		expect(ws.organizationId).toBe("org-1");
		expect(ws.companyIds).toEqual(["company-a"]);
		expect(ws.fiscalPeriodIds).toEqual(["2026-01"]);
		expect(ws.objective.kind).toBe("monthly-close");
		expect(ws.layoutId).toBeNull();
		expect(ws.createdAt).toBeInstanceOf(Date);
		expect(ws.updatedAt).toBeInstanceOf(Date);
	});

	it("should generate unique WorkspaceIds", () => {
		const ws1 = createWorkspace(validInput);
		const ws2 = createWorkspace(validInput);
		expect(ws1.workspaceId).not.toBe(ws2.workspaceId);
	});

	it("should set createdAt and updatedAt to the same initial value", () => {
		const ws = createWorkspace(validInput);
		expect(ws.createdAt.getTime()).toBe(ws.updatedAt.getTime());
	});

	it("should accept multiple companyIds", () => {
		const ws = createWorkspace({
			...validInput,
			companyIds: ["company-a", "company-b", "company-c"],
		});
		expect(ws.companyIds).toHaveLength(3);
	});

	it("should reject when companyIds is empty", () => {
		expect(() => createWorkspace({ ...validInput, companyIds: [] })).toThrow(
			Error,
		);
	});

	it("should reject when fiscalPeriodIds is empty", () => {
		expect(() =>
			createWorkspace({ ...validInput, fiscalPeriodIds: [] }),
		).toThrow(Error);
	});

	it("should reject when organizationId is empty", () => {
		expect(() =>
			createWorkspace({ ...validInput, organizationId: "" }),
		).toThrow(Error);
	});

	it("should accept all objective kinds", () => {
		const objectives = [
			{ kind: "monthly-close" as const, fiscalPeriodId: "2026-01" },
			{
				kind: "sire-review" as const,
				fiscalPeriodId: "2026-01",
				recordType: "RCE" as const,
			},
			{ kind: "tax-audit" as const, fiscalPeriodId: "2026-01" },
			{ kind: "bank-reconciliation" as const, accountIds: ["acc-1"] },
			{ kind: "rce-rectification" as const, fiscalPeriodId: "2026-01" },
			{ kind: "portfolio-operations" as const },
			{ kind: "evidence-audit" as const, fiscalPeriodId: "2026-01" },
			{ kind: "custom" as const, definitionId: "def-1" },
		];
		for (const obj of objectives) {
			const ws = createWorkspace({ ...validInput, objective: obj });
			expect(ws.objective.kind).toBe(obj.kind);
		}
	});
});

describe("addCompanyToWorkspace", () => {
	const baseWs = createWorkspace({
		organizationId: "org-1",
		companyIds: ["company-a"],
		fiscalPeriodIds: ["2026-01"],
		objective: { kind: "monthly-close", fiscalPeriodId: "2026-01" },
		layoutId: null,
	});

	it("should add a new company to the workspace", () => {
		const updated = addCompanyToWorkspace(baseWs, "company-b");
		expect(updated.companyIds).toContain("company-b");
		expect(updated.companyIds).toHaveLength(2);
	});

	it("should not mutate the original workspace", () => {
		const original = baseWs.companyIds.length;
		addCompanyToWorkspace(baseWs, "company-b");
		expect(baseWs.companyIds).toHaveLength(original);
	});

	it("should return a new workspace reference", () => {
		const updated = addCompanyToWorkspace(baseWs, "company-b");
		expect(updated).not.toBe(baseWs);
	});

	it("should preserve workspace identity", () => {
		const updated = addCompanyToWorkspace(baseWs, "company-b");
		expect(updated.workspaceId).toBe(baseWs.workspaceId);
		expect(updated.organizationId).toBe(baseWs.organizationId);
		expect(updated.objective.kind).toBe(baseWs.objective.kind);
	});

	it("should reject duplicate companyId", () => {
		expect(() => addCompanyToWorkspace(baseWs, "company-a")).toThrow(
			WorkspaceDuplicateCompanyError,
		);
	});

	it("should update the updatedAt timestamp and revision", () => {
		const updated = addCompanyToWorkspace(baseWs, "company-b");
		expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
			baseWs.updatedAt.getTime(),
		);
		expect(updated.revision).toBe(baseWs.revision + 1);
	});
});

describe("changeWorkspaceObjective", () => {
	const baseWs = createWorkspace({
		organizationId: "org-1",
		companyIds: ["company-a"],
		fiscalPeriodIds: ["2026-01"],
		objective: { kind: "monthly-close", fiscalPeriodId: "2026-01" },
		layoutId: null,
	});

	it("should change the objective", () => {
		const updated = changeWorkspaceObjective(baseWs, {
			kind: "tax-audit",
			fiscalPeriodId: "2026-01",
		});
		expect(updated.objective.kind).toBe("tax-audit");
	});

	it("should not mutate the original workspace", () => {
		changeWorkspaceObjective(baseWs, {
			kind: "tax-audit",
			fiscalPeriodId: "2026-01",
		});
		expect(baseWs.objective.kind).toBe("monthly-close");
	});

	it("should update the updatedAt timestamp and revision", () => {
		const updated = changeWorkspaceObjective(baseWs, {
			kind: "tax-audit",
			fiscalPeriodId: "2026-01",
		});
		expect(updated.updatedAt.getTime()).toBeGreaterThan(
			baseWs.updatedAt.getTime(),
		);
		expect(updated.revision).toBe(baseWs.revision + 1);
	});

	it("should return a new workspace reference", () => {
		const updated = changeWorkspaceObjective(baseWs, {
			kind: "tax-audit",
			fiscalPeriodId: "2026-01",
		});
		expect(updated).not.toBe(baseWs);
	});
});

describe("objectiveDisplayName", () => {
	it("should return human-readable labels for all objectives", () => {
		expect(
			objectiveDisplayName({
				kind: "monthly-close",
				fiscalPeriodId: "2026-01",
			}),
		).toBe("Monthly Close");
		expect(
			objectiveDisplayName({
				kind: "sire-review",
				fiscalPeriodId: "2026-01",
				recordType: "RCE",
			}),
		).toBe("SIRE Review");
		expect(
			objectiveDisplayName({ kind: "tax-audit", fiscalPeriodId: "2026-01" }),
		).toBe("Tax Audit");
		expect(
			objectiveDisplayName({
				kind: "bank-reconciliation",
				accountIds: ["acc-1"],
			}),
		).toBe("Bank Reconciliation");
		expect(
			objectiveDisplayName({
				kind: "rce-rectification",
				fiscalPeriodId: "2026-01",
			}),
		).toBe("RCE Rectification");
		expect(objectiveDisplayName({ kind: "portfolio-operations" })).toBe(
			"Portfolio Operations",
		);
		expect(
			objectiveDisplayName({
				kind: "evidence-audit",
				fiscalPeriodId: "2026-01",
			}),
		).toBe("Evidence Audit");
		expect(
			objectiveDisplayName({ kind: "custom", definitionId: "def-1" }),
		).toBe("Custom");
	});
});

describe("workspace serialization round-trip", () => {
	it("should serialize to JSON and deserialize back to an equivalent workspace", () => {
		const ws = createWorkspace({
			organizationId: "org-1",
			companyIds: ["company-a", "company-b"],
			fiscalPeriodIds: ["2026-01", "2026-02"],
			objective: { kind: "monthly-close", fiscalPeriodId: "2026-01" },
			layoutId: "layout-1",
		});

		const json = workspaceToJSON(ws);
		const restored = workspaceFromJSON(json);

		expect(restored.schemaVersion).toBe(ws.schemaVersion);
		expect(restored.revision).toBe(ws.revision);
		expect(restored.workspaceId).toBe(ws.workspaceId);
		expect(restored.organizationId).toBe(ws.organizationId);
		expect(restored.companyIds).toEqual(ws.companyIds);
		expect(restored.fiscalPeriodIds).toEqual(ws.fiscalPeriodIds);
		expect(restored.objective.kind).toBe(ws.objective.kind);
		expect(restored.layoutId).toBe(ws.layoutId);
		expect(restored.createdAt.toISOString()).toBe(ws.createdAt.toISOString());
	});

	it("should reject unsupported schema version", () => {
		expect(() =>
			workspaceFromJSON({
				schemaVersion: 999,
				revision: 1,
				workspaceId: "test",
				organizationId: "org-1",
				companyIds: [],
				fiscalPeriodIds: [],
				objective: { kind: "portfolio-operations" },
				layoutId: null,
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-01T00:00:00.000Z",
			}),
		).toThrow(WorkspaceSchemaVersionError);
	});
});
