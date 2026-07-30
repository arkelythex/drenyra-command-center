import { describe, it, expect } from "vitest";
import {
	CreateWorkspaceCommandSchema,
	AddCompanyCommandSchema,
	ChangeObjectiveCommandSchema,
	CreateViewCommandSchema,
	MoveViewCommandSchema,
	AttachToExecutionCommandSchema,
	DetachFromExecutionCommandSchema,
	ResumeWorkspaceCommandSchema,
	ApplyLayoutCommandSchema,
	WorkspaceCommandSchema,
	CommandEnvelopeSchema,
} from "../workspace-commands";

// ─── Helpers ────────────────────────────────────────────────────────────────

const validCreate = {
	commandType: "create-workspace" as const,
	organizationId: "org-1",
	companyIds: ["company-1"],
	fiscalPeriodIds: ["fp-2025-01"],
	objective: { kind: "monthly-close" as const, fiscalPeriodId: "fp-2025-01" },
};

// ─── CreateWorkspaceCommand ──────────────────────────────────────────────────

describe("CreateWorkspaceCommandSchema", () => {
	it("validates a correct create-workspace command", () => {
		const result = CreateWorkspaceCommandSchema.safeParse(validCreate);
		expect(result.success).toBe(true);
	});

	it("rejects empty companyIds", () => {
		const result = CreateWorkspaceCommandSchema.safeParse({
			...validCreate,
			companyIds: [],
		});
		expect(result.success).toBe(false);
	});

	it("rejects empty fiscalPeriodIds", () => {
		const result = CreateWorkspaceCommandSchema.safeParse({
			...validCreate,
			fiscalPeriodIds: [],
		});
		expect(result.success).toBe(false);
	});

	it("rejects empty organizationId", () => {
		const result = CreateWorkspaceCommandSchema.safeParse({
			...validCreate,
			organizationId: "",
		});
		expect(result.success).toBe(false);
	});

	it("validates monthly-close objective", () => {
		const result = CreateWorkspaceCommandSchema.safeParse({
			...validCreate,
			objective: { kind: "monthly-close", fiscalPeriodId: "fp-2025-03" },
		});
		expect(result.success).toBe(true);
	});

	it("validates sire-review objective with recordType", () => {
		const result = CreateWorkspaceCommandSchema.safeParse({
			...validCreate,
			objective: { kind: "sire-review", fiscalPeriodId: "fp-2025-03", recordType: "RCE" },
		});
		expect(result.success).toBe(true);
	});

	it("validates tax-audit objective", () => {
		const result = CreateWorkspaceCommandSchema.safeParse({
			...validCreate,
			objective: { kind: "tax-audit", fiscalPeriodId: "fp-2025-03" },
		});
		expect(result.success).toBe(true);
	});

	it("validates bank-reconciliation objective", () => {
		const result = CreateWorkspaceCommandSchema.safeParse({
			...validCreate,
			objective: { kind: "bank-reconciliation", accountIds: ["acc-1", "acc-2"] },
		});
		expect(result.success).toBe(true);
	});

	it("validates rce-rectification objective", () => {
		const result = CreateWorkspaceCommandSchema.safeParse({
			...validCreate,
			objective: { kind: "rce-rectification", fiscalPeriodId: "fp-2025-03" },
		});
		expect(result.success).toBe(true);
	});

	it("validates portfolio-operations objective", () => {
		const result = CreateWorkspaceCommandSchema.safeParse({
			...validCreate,
			objective: { kind: "portfolio-operations" },
		});
		expect(result.success).toBe(true);
	});

	it("validates evidence-audit objective", () => {
		const result = CreateWorkspaceCommandSchema.safeParse({
			...validCreate,
			objective: { kind: "evidence-audit", fiscalPeriodId: "fp-2025-03" },
		});
		expect(result.success).toBe(true);
	});

	it("validates custom objective", () => {
		const result = CreateWorkspaceCommandSchema.safeParse({
			...validCreate,
			objective: { kind: "custom", definitionId: "def-xyz" },
		});
		expect(result.success).toBe(true);
	});

	it("rejects unknown objective kind", () => {
		const result = CreateWorkspaceCommandSchema.safeParse({
			...validCreate,
			objective: { kind: "unknown-kind" },
		});
		expect(result.success).toBe(false);
	});

	it("defaults layoutId to null when omitted", () => {
		const result = CreateWorkspaceCommandSchema.safeParse(validCreate);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.layoutId).toBeNull();
		}
	});
});

// ─── AddCompanyCommand ───────────────────────────────────────────────────────

describe("AddCompanyCommandSchema", () => {
	it("validates a correct add-company command", () => {
		const result = AddCompanyCommandSchema.safeParse({
			commandType: "add-company",
			workspaceId: "00000000-0000-0000-0000-000000000001",
			companyId: "company-2",
		});
		expect(result.success).toBe(true);
	});

	it("rejects empty workspaceId", () => {
		const result = AddCompanyCommandSchema.safeParse({
			commandType: "add-company",
			workspaceId: "",
			companyId: "company-2",
		});
		expect(result.success).toBe(false);
	});
});

// ─── ChangeObjectiveCommand ──────────────────────────────────────────────────

describe("ChangeObjectiveCommandSchema", () => {
	it("validates a correct change-objective command", () => {
		const result = ChangeObjectiveCommandSchema.safeParse({
			commandType: "change-objective",
			workspaceId: "00000000-0000-0000-0000-000000000001",
			objective: { kind: "monthly-close", fiscalPeriodId: "fp-2025-03" },
		});
		expect(result.success).toBe(true);
	});

	it("rejects unknown objective kind", () => {
		const result = ChangeObjectiveCommandSchema.safeParse({
			commandType: "change-objective",
			workspaceId: "00000000-0000-0000-0000-000000000001",
			objective: { kind: "unknown" },
		});
		expect(result.success).toBe(false);
	});
});

// ─── CreateViewCommand ───────────────────────────────────────────────────────

describe("CreateViewCommandSchema", () => {
	const validView = {
		commandType: "create-view" as const,
		workspaceId: "00000000-0000-0000-0000-000000000001",
		kind: "ledger" as const,
		label: "Main Ledger",
		placement: { row: 0, column: 0, width: 800, height: 600 },
	};

	it("validates a correct create-view command", () => {
		const result = CreateViewCommandSchema.safeParse(validView);
		expect(result.success).toBe(true);
	});

	it("validates all view kinds", () => {
		const kinds = [
			"ledger",
			"evidence",
			"sire-comparison",
			"agent-activity",
			"financial-diff",
			"approval",
			"document-viewer",
			"close-readiness",
		] as const;

		for (const kind of kinds) {
			const result = CreateViewCommandSchema.safeParse({ ...validView, kind });
			expect(result.success).toBe(true);
		}
	});

	it("rejects empty label", () => {
		const result = CreateViewCommandSchema.safeParse({ ...validView, label: "" });
		expect(result.success).toBe(false);
	});

	it("rejects negative row placement", () => {
		const result = CreateViewCommandSchema.safeParse({
			...validView,
			placement: { row: -1, column: 0, width: 800, height: 600 },
		});
		expect(result.success).toBe(false);
	});

	it("rejects zero width", () => {
		const result = CreateViewCommandSchema.safeParse({
			...validView,
			placement: { row: 0, column: 0, width: 0, height: 600 },
		});
		expect(result.success).toBe(false);
	});

	it("rejects unknown view kind", () => {
		const result = CreateViewCommandSchema.safeParse({
			...validView,
			kind: "unknown-view",
		});
		expect(result.success).toBe(false);
	});
});

// ─── MoveViewCommand ─────────────────────────────────────────────────────────

describe("MoveViewCommandSchema", () => {
	it("validates a correct move-view command", () => {
		const result = MoveViewCommandSchema.safeParse({
			commandType: "move-view",
			viewId: "00000000-0000-0000-0000-000000000001",
			placement: { row: 2, column: 1, width: 800, height: 600 },
		});
		expect(result.success).toBe(true);
	});

	it("rejects empty viewId", () => {
		const result = MoveViewCommandSchema.safeParse({
			commandType: "move-view",
			viewId: "",
			placement: { row: 0, column: 0, width: 800, height: 600 },
		});
		expect(result.success).toBe(false);
	});
});

// ─── AttachToExecutionCommand ────────────────────────────────────────────────

describe("AttachToExecutionCommandSchema", () => {
	it("validates a correct attach-to-execution command", () => {
		const result = AttachToExecutionCommandSchema.safeParse({
			commandType: "attach-to-execution",
			executionId: "00000000-0000-0000-0000-000000000001",
		});
		expect(result.success).toBe(true);
	});

	it("validates with optional fields", () => {
		const result = AttachToExecutionCommandSchema.safeParse({
			commandType: "attach-to-execution",
			executionId: "00000000-0000-0000-0000-000000000001",
			fromSequence: 5,
			clientId: "client-1",
		});
		expect(result.success).toBe(true);
	});

	it("rejects empty executionId", () => {
		const result = AttachToExecutionCommandSchema.safeParse({
			commandType: "attach-to-execution",
			executionId: "",
		});
		expect(result.success).toBe(false);
	});

	it("rejects negative fromSequence", () => {
		const result = AttachToExecutionCommandSchema.safeParse({
			commandType: "attach-to-execution",
			executionId: "00000000-0000-0000-0000-000000000001",
			fromSequence: -1,
		});
		expect(result.success).toBe(false);
	});
});

// ─── DetachFromExecutionCommand ──────────────────────────────────────────────

describe("DetachFromExecutionCommandSchema", () => {
	it("validates a correct detach-from-execution command", () => {
		const result = DetachFromExecutionCommandSchema.safeParse({
			commandType: "detach-from-execution",
			executionId: "00000000-0000-0000-0000-000000000001",
		});
		expect(result.success).toBe(true);
	});

	it("validates with reason", () => {
		const result = DetachFromExecutionCommandSchema.safeParse({
			commandType: "detach-from-execution",
			executionId: "00000000-0000-0000-0000-000000000001",
			reason: "workspace closed",
		});
		expect(result.success).toBe(true);
	});
});

// ─── ResumeWorkspaceCommand ──────────────────────────────────────────────────

describe("ResumeWorkspaceCommandSchema", () => {
	it("validates a correct resume-workspace command", () => {
		const result = ResumeWorkspaceCommandSchema.safeParse({
			commandType: "resume-workspace",
			workspaceId: "00000000-0000-0000-0000-000000000001",
			executionIds: ["exec-1", "exec-2"],
		});
		expect(result.success).toBe(true);
	});

	it("rejects empty executionIds", () => {
		const result = ResumeWorkspaceCommandSchema.safeParse({
			commandType: "resume-workspace",
			workspaceId: "00000000-0000-0000-0000-000000000001",
			executionIds: [],
		});
		expect(result.success).toBe(false);
	});
});

// ─── ApplyLayoutCommand ──────────────────────────────────────────────────────

describe("ApplyLayoutCommandSchema", () => {
	it("validates all 5 layout templates", () => {
		const templates = [
			"portfolio-operations",
			"monthly-close",
			"sire-review",
			"bank-reconciliation",
			"evidence-audit",
		] as const;

		for (const template of templates) {
			const result = ApplyLayoutCommandSchema.safeParse({
				commandType: "apply-layout",
				workspaceId: "00000000-0000-0000-0000-000000000001",
				template,
			});
			expect(result.success).toBe(true);
		}
	});

	it("rejects unknown template", () => {
		const result = ApplyLayoutCommandSchema.safeParse({
			commandType: "apply-layout",
			workspaceId: "00000000-0000-0000-0000-000000000001",
			template: "unknown-template",
		});
		expect(result.success).toBe(false);
	});
});

// ─── Discriminated Union ─────────────────────────────────────────────────────

describe("WorkspaceCommandSchema (discriminated union)", () => {
	it("parses create-workspace via discriminated union", () => {
		const result = WorkspaceCommandSchema.safeParse(validCreate);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.commandType).toBe("create-workspace");
		}
	});

	it("parses add-company via discriminated union", () => {
		const result = WorkspaceCommandSchema.safeParse({
			commandType: "add-company",
			workspaceId: "00000000-0000-0000-0000-000000000001",
			companyId: "company-2",
		});
		expect(result.success).toBe(true);
	});

	it("parses detach-from-execution via discriminated union", () => {
		const result = WorkspaceCommandSchema.safeParse({
			commandType: "detach-from-execution",
			executionId: "00000000-0000-0000-0000-000000000001",
		});
		expect(result.success).toBe(true);
	});

	it("parses apply-layout via discriminated union", () => {
		const result = WorkspaceCommandSchema.safeParse({
			commandType: "apply-layout",
			workspaceId: "00000000-0000-0000-0000-000000000001",
			template: "monthly-close",
		});
		expect(result.success).toBe(true);
	});

	it("rejects unknown commandType", () => {
		const result = WorkspaceCommandSchema.safeParse({
			commandType: "unknown-command",
		});
		expect(result.success).toBe(false);
	});
});

// ─── CommandEnvelope ─────────────────────────────────────────────────────────

describe("CommandEnvelopeSchema", () => {
	it("wraps a command correctly", () => {
		const result = CommandEnvelopeSchema.safeParse({
			command: validCreate,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.command.commandType).toBe("create-workspace");
		}
	});

	it("includes optional envelope fields", () => {
		const result = CommandEnvelopeSchema.safeParse({
			command: validCreate,
			correlationId: "corr-123",
			userId: "user-1",
			clientId: "client-1",
			idempotencyKey: "idem-456",
		});
		expect(result.success).toBe(true);
	});

	it("rejects unknown commandType in envelope", () => {
		const result = CommandEnvelopeSchema.safeParse({
			command: { commandType: "unknown-command" },
		});
		expect(result.success).toBe(false);
	});

	it("rejects envelope without command", () => {
		const result = CommandEnvelopeSchema.safeParse({
			correlationId: "corr-123",
		});
		expect(result.success).toBe(false);
	});
});
