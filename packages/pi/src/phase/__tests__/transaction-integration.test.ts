// ─── TransactionIntegration Tests ──────────────────────────────────

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DomainAgent } from "../../transaction/domain-agent";
import type { LatinModernoOrchestrator } from "../../transaction/latin-orchestrator";
import type { DrenyraOrchestrator } from "../../transaction/orchestrator";
import type { TransactionContext } from "../transaction-integration";
import { TransactionIntegration } from "../transaction-integration";

// ─── Mock Helpers ────────────────────────────────────────────────

function createMockOrchestrator(): DrenyraOrchestrator {
	return {
		handleInput: vi.fn().mockResolvedValue({
			intent: { agent: "cerno", tool: "extract" },
			result: { success: true, data: { documents: [] } },
			agent: "cerno",
			sessionId: "mock-session",
		}),
		getAgent: vi.fn(),
		getAllAgents: vi.fn().mockReturnValue([]),
		registerAgent: vi.fn(),
		getApprovalGate: vi.fn(),
		getEventBus: vi.fn(),
		enableSwarmMode: vi.fn(),
		disableSwarmMode: vi.fn(),
		isSwarmMode: vi.fn().mockReturnValue(false),
	} as unknown as DrenyraOrchestrator;
}

function createMockDomainAgent(id: string, name: string): DomainAgent {
	return {
		id: id as never,
		name,
		description: `Mock ${name}`,
		capabilities: [],
		primaryAgent: { id, name },
		receiveTask: vi.fn().mockResolvedValue({
			domainId: id,
			taskId: "mock-task",
			status: "completed",
			data: { mock: true },
			confidence: 0.85,
		}),
		selectBestAgent: vi.fn(),
		spawnSubAgent: vi.fn(),
		checkApproval: vi.fn(),
		escalate: vi.fn(),
	} as unknown as DomainAgent;
}

function createMockSwarm(): LatinModernoOrchestrator {
	return {
		handleRequest: vi.fn().mockResolvedValue({
			success: true,
			data: { documents: [{ id: "doc-1", tipo: "FACT" }] },
			conflicts: [],
			traceId: "mock-trace",
			sessionId: "mock-session",
			timings: [],
		}),
		getDomainAgent: vi
			.fn()
			.mockReturnValue(createMockDomainAgent("regula", "Regula")),
		getAllDomainAgents: vi.fn().mockReturnValue([]),
		registerDomainAgent: vi.fn(),
	} as unknown as LatinModernoOrchestrator;
}

function createCtx(
	overrides?: Partial<TransactionContext>,
): TransactionContext {
	return {
		ruc: "20123456789",
		periodo: "2026-06",
		userId: "test-user",
		sessionId: "test-session",
		...overrides,
	};
}

// ─── Tests ───────────────────────────────────────────────────────

describe("TransactionIntegration", () => {
	let integration: TransactionIntegration;
	let mockOrch: DrenyraOrchestrator;

	beforeEach(() => {
		mockOrch = createMockOrchestrator();
		integration = new TransactionIntegration(mockOrch);
	});

	describe("constructor", () => {
		it("creates integration with orchestrator only", () => {
			const i = new TransactionIntegration(mockOrch);
			expect(i).toBeDefined();
		});

		it("creates integration with orchestrator and swarm", () => {
			const mockSwarm = createMockSwarm();
			const i = new TransactionIntegration(mockOrch, mockSwarm);
			expect(i).toBeDefined();
		});
	});

	describe("extractDocuments", () => {
		it("returns extract result", async () => {
			const result = await integration.extractDocuments(createCtx());
			expect(result.success).toBe(true);
			expect(result.documents).toBeDefined();
			expect(typeof result.summary).toBe("string");
		});

		it("passes ctx to orchestrator", async () => {
			const ctx = createCtx();
			await integration.extractDocuments(ctx, { sunatSol: true });

			expect(mockOrch.handleInput).toHaveBeenCalledWith(
				expect.stringContaining(ctx.ruc),
				expect.objectContaining({ ruc: ctx.ruc }),
				ctx.sessionId,
			);
		});

		it("uses swarm when available", async () => {
			const mockSwarm = createMockSwarm();
			const i = new TransactionIntegration(mockOrch, mockSwarm);

			const result = await i.extractDocuments(createCtx());

			expect(mockSwarm.handleRequest).toHaveBeenCalled();
			expect(result.success).toBe(true);
			expect(result.documents).toHaveLength(1);
			expect(result.documents[0].id).toBe("doc-1");
		});
	});

	describe("classifyDocuments", () => {
		it("returns classifications for documents", async () => {
			const docs = [
				{ id: "F001-1", tipo: "FACT", monto: 1000 },
				{ id: "B001-1", tipo: "BOLETA", monto: 500 },
			];

			const result = await integration.classifyDocuments(createCtx(), docs);

			expect(result.success).toBe(true);
			expect(result.classifications).toHaveLength(2);
		});

		it("uses swarm for classification when available", async () => {
			const mockSwarm = createMockSwarm();
			const i = new TransactionIntegration(mockOrch, mockSwarm);

			const docs = [{ id: "F001-1", tipo: "FACT", monto: 1000 }];
			const result = await i.classifyDocuments(createCtx(), docs);

			expect(mockSwarm.handleRequest).toHaveBeenCalled();
			expect(result.success).toBe(true);
		});

		it("falls back to basic classification", async () => {
			const docs = [{ id: "F001-1", tipo: "FACT", monto: 1000 }];
			const result = await integration.classifyDocuments(createCtx(), docs);

			expect(result.classifications[0].cuentaPCGE).toBe("70111");
		});
	});

	describe("reconcileAccounts", () => {
		it("returns reconcile result", async () => {
			const result = await integration.reconcileAccounts(createCtx());
			expect(result.success).toBe(true);
			expect(typeof result.matched).toBe("number");
			expect(typeof result.summary).toBe("string");
		});

		it("uses swarm when available", async () => {
			const mockSwarm = createMockSwarm();
			const i = new TransactionIntegration(mockOrch, mockSwarm);

			const result = await i.reconcileAccounts(createCtx());
			expect(mockSwarm.handleRequest).toHaveBeenCalled();
			expect(result.success).toBe(true);
		});
	});

	describe("runComplianceCheck", () => {
		it("returns compliance result", async () => {
			const result = await integration.runComplianceCheck(createCtx());
			expect(result.success).toBe(true);
			expect(Array.isArray(result.findings)).toBe(true);
		});

		it("uses Regula agent when swarm available", async () => {
			const mockSwarm = createMockSwarm();
			const i = new TransactionIntegration(mockOrch, mockSwarm);

			const regula = mockSwarm.getDomainAgent("regula")!;
			const spy = vi.spyOn(regula, "receiveTask");

			const result = await i.runComplianceCheck(createCtx());
			expect(spy).toHaveBeenCalled();
			expect(result.success).toBe(true);
		});
	});

	describe("fileDeclaration", () => {
		it("returns declaration result", async () => {
			const result = await integration.fileDeclaration(createCtx(), "SIRE");
			expect(result.success).toBe(true);
			expect(result.numeroComprobante).toContain("SIRE");
		});

		it("uses swarm when available", async () => {
			const mockSwarm = createMockSwarm();
			const i = new TransactionIntegration(mockOrch, mockSwarm);

			const result = await i.fileDeclaration(createCtx(), "PDT");
			expect(mockSwarm.handleRequest).toHaveBeenCalled();
			expect(result.success).toBe(true);
		});
	});

	describe("archivePeriod", () => {
		it("returns archive reference", async () => {
			const result = await integration.archivePeriod(createCtx());
			expect(result.success).toBe(true);
			expect(result.archiveRef).toBeDefined();
			expect(typeof result.archiveRef).toBe("string");
		});

		it("uses Capsa agent when swarm available", async () => {
			const mockSwarm = createMockSwarm();
			const i = new TransactionIntegration(mockOrch, mockSwarm);

			const capsa = createMockDomainAgent("capsa", "Capsa");
			mockSwarm.getDomainAgent = vi.fn().mockReturnValue(capsa);
			const spy = vi.spyOn(capsa, "receiveTask");

			const result = await i.archivePeriod(createCtx());
			expect(spy).toHaveBeenCalled();
			expect(result.success).toBe(true);
		});
	});

	describe("transaction context", () => {
		it("builds AgentContext with tenant from RUC", async () => {
			await integration.extractDocuments(createCtx());

			const ctxArg = (mockOrch.handleInput as ReturnType<typeof vi.fn>).mock
				.calls[0][1] as Record<string, unknown>;
			expect(ctxArg.tenantId).toBe("20123456789");
			expect(ctxArg.organizationId).toBe("20123456789");
		});
	});
});
