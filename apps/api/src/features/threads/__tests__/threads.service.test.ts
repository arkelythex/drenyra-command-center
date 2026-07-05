import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted — everything the vi.mock factory needs MUST be in vi.hoisted()
// because vi.mock is hoisted above all other code.
// ---------------------------------------------------------------------------

const { mockDb, stubDbChain, mockSchema } = vi.hoisted(() => {
	const chain = (results: unknown) => {
		const c = new Proxy(() => ({}), {
			get(_target: unknown, prop: string) {
				if (prop === "then") {
					return (resolve: (v: unknown) => void) => resolve(results);
				}
				if (prop === "catch") return undefined;
				return () => c;
			},
		});
		return c;
	};

	const db = {
		select: vi.fn(),
		insert: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	};

	// Drizzle eq() needs column objects that don't crash.
	// We use a Proxy that returns itself for any property access.
	const col = new Proxy(
		{},
		{
			get(t: unknown, prop: string) {
				if (prop === "then") return undefined;
				if (prop === "catch") return undefined;
				if (prop === Symbol.toPrimitive) return () => "mock-col";
				if (prop === "constructor") return Object;
				return col;
			},
		},
	);

	const tbl = {
		id: col,
		companyId: col,
		title: col,
		status: col,
		environment: col,
		period: col,
		priority: col,
		tags: col,
		createdById: col,
		closedById: col,
		closeNote: col,
		createdAt: col,
		updatedAt: col,
		closedAt: col,
		threadId: col,
		evidenceId: col,
		isActive: col,
		sortOrder: col,
	};

	const schema = {
		threads: tbl,
		threadTasks: tbl,
		threadAgents: tbl,
		threadEvidence: tbl,
	};

	return { mockDb: db, stubDbChain: chain, mockSchema: schema };
});

vi.mock("../../../lib/db", () => ({
	db: mockDb,
	schema: mockSchema,
}));

import { ThreadServiceError, threadsService } from "../threads.service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeThreadRow(overrides: Record<string, unknown> = {}) {
	const now = new Date();
	return {
		id: "thread-1",
		companyId: "company-1",
		title: "Cierre Jun 2026",
		description: null,
		status: "DRAFT",
		environment: "local",
		period: "2026-06",
		priority: "HIGH",
		tags: ["cierre"],
		createdById: "user-1",
		closedById: null,
		closeNote: null,
		createdAt: now,
		updatedAt: now,
		closedAt: null,
		...overrides,
	};
}

function makeTaskRow(overrides: Record<string, unknown> = {}) {
	const now = new Date();
	return {
		id: "task-1",
		threadId: "thread-1",
		title: "Validar SIRE",
		description: null,
		status: "PENDING",
		agentId: null,
		assignedAt: null,
		completedAt: null,
		completedById: null,
		resultSummary: null,
		evidenceIds: [],
		sortOrder: 1,
		createdAt: now,
		updatedAt: now,
		...overrides,
	};
}

function makeAgentRow(overrides: Record<string, unknown> = {}) {
	const now = new Date();
	return {
		id: "agent-assignment-1",
		threadId: "thread-1",
		agentId: "agent-1",
		agentName: "SIRE Agent",
		role: "PRIMARY",
		assignedAt: now,
		unassignedAt: null,
		isActive: true,
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ThreadsService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getById", () => {
		it("returns full thread detail with tasks, agents, and evidence", async () => {
			const threadRow = makeThreadRow({ status: "ACTIVE" });
			const taskRows = [makeTaskRow({ status: "COMPLETED" })];
			const agentRows = [makeAgentRow()];
			const evidenceRows = [
				{
					id: "ev-link-1",
					threadId: "thread-1",
					evidenceId: "evidence-1",
					linkedBy: null,
					linkedAt: new Date(),
					note: null,
				},
			];

			const responses = [[threadRow], taskRows, agentRows, evidenceRows];
			let idx = 0;
			mockDb.select.mockImplementation(() => stubDbChain(responses[idx++]));

			const result = await threadsService.getById("thread-1");

			expect(result.id).toBe("thread-1");
			expect(result.title).toBe("Cierre Jun 2026");
			expect(result.status).toBe("ACTIVE");
			expect(result.tasks).toHaveLength(1);
			expect(result.tasks[0]!.title).toBe("Validar SIRE");
			expect(result.agents).toHaveLength(1);
			expect(result.agents[0]!.agentName).toBe("SIRE Agent");
			expect(result.evidenceIds).toHaveLength(1);
			expect(result.evidenceIds[0]).toBe("evidence-1");
		});

		it("throws THREAD_NOT_FOUND when thread does not exist", async () => {
			mockDb.select.mockImplementation(() => stubDbChain([]));

			await expect(threadsService.getById("nonexistent")).rejects.toThrow(
				ThreadServiceError,
			);
			await expect(threadsService.getById("nonexistent")).rejects.toMatchObject(
				{
					code: "THREAD_NOT_FOUND",
					httpStatus: 404,
				},
			);
		});
	});

	describe("create", () => {
		it("creates a thread with tasks and returns summary", async () => {
			const threadRow = makeThreadRow();

			mockDb.insert.mockImplementation(() => stubDbChain([threadRow]));

			const result = await threadsService.create({
				companyId: "company-1",
				title: "Cierre Jun 2026",
				period: "2026-06",
				priority: "HIGH",
				tags: ["cierre"],
				tasks: [{ title: "Validar SIRE", order: 1 }],
			});

			expect(result.id).toBe("thread-1");
			expect(result.title).toBe("Cierre Jun 2026");
			expect(result.status).toBe("DRAFT");
			expect(result.taskCount).toBe(1);
			expect(result.completedTaskCount).toBe(0);
		});
	});

	describe("updateStatus", () => {
		it("transitions DRAFT → ACTIVE", async () => {
			const threadRow = makeThreadRow({ status: "DRAFT" });
			const taskRows = [makeTaskRow()];
			const updatedRow = makeThreadRow({ status: "ACTIVE" });

			let selectCalls = 0;
			mockDb.select.mockImplementation(() =>
				stubDbChain(++selectCalls === 1 ? [threadRow] : taskRows),
			);
			mockDb.update.mockImplementation(() => stubDbChain([updatedRow]));

			const result = await threadsService.updateStatus("thread-1", "ACTIVE");
			expect(result.status).toBe("ACTIVE");
		});

		it("rejects DRAFT → CLOSED transition via entity guard", async () => {
			mockDb.select.mockImplementation(() =>
				stubDbChain([makeThreadRow({ status: "DRAFT" })]),
			);

			await expect(
				threadsService.updateStatus("thread-1", "CLOSED", "user-1"),
			).rejects.toThrow("Cannot transition from DRAFT to CLOSED");
		});

		it("transitions REVIEWED → CLOSED via closeThread", async () => {
			const threadRow = makeThreadRow({ status: "REVIEWED" });
			const taskRows = [makeTaskRow({ status: "COMPLETED" })];
			const updatedRow = makeThreadRow({
				status: "CLOSED",
				closedById: "user-1",
				closeNote: "Cierre completado",
				closedAt: new Date(),
			});

			let selectCalls = 0;
			mockDb.select.mockImplementation(() =>
				stubDbChain(++selectCalls === 1 ? [threadRow] : taskRows),
			);
			mockDb.update.mockImplementation(() => stubDbChain([updatedRow]));

			const result = await threadsService.closeThread(
				"thread-1",
				"user-1",
				"Cierre completado",
			);
			expect(result.status).toBe("CLOSED");
		});
	});

	describe("assignAgent", () => {
		it("assigns an agent and returns the assignment", async () => {
			mockDb.select.mockImplementation(() =>
				stubDbChain([makeThreadRow({ status: "ACTIVE" })]),
			);
			mockDb.insert.mockImplementation(() => stubDbChain([makeAgentRow()]));

			const result = await threadsService.assignAgent(
				"thread-1",
				"agent-1",
				"SIRE Agent",
				"PRIMARY",
			);

			expect(result.agentId).toBe("agent-1");
			expect(result.agentName).toBe("SIRE Agent");
			expect(result.role).toBe("PRIMARY");
			expect(result.isActive).toBe(true);
		});

		it("throws THREAD_ALREADY_CLOSED when thread is CLOSED", async () => {
			mockDb.select.mockImplementation(() =>
				stubDbChain([makeThreadRow({ status: "CLOSED" })]),
			);

			await expect(
				threadsService.assignAgent("thread-1", "agent-1", "Agent", "PRIMARY"),
			).rejects.toMatchObject({ code: "THREAD_ALREADY_CLOSED" });
		});
	});

	describe("removeAgent", () => {
		it("soft-deletes the agent assignment", async () => {
			mockDb.select.mockImplementation(() =>
				stubDbChain([makeThreadRow({ status: "ACTIVE" })]),
			);
			mockDb.update.mockImplementation(() => stubDbChain([]));

			await threadsService.removeAgent("thread-1", "agent-1");
			expect(mockDb.update).toHaveBeenCalled();
		});
	});

	describe("linkEvidence", () => {
		it("links evidence to thread", async () => {
			mockDb.select.mockImplementation(() =>
				stubDbChain([makeThreadRow({ status: "ACTIVE" })]),
			);
			mockDb.insert.mockImplementation(() => stubDbChain([]));

			await threadsService.linkEvidence("thread-1", "evidence-1", "CDR note");
			expect(mockDb.insert).toHaveBeenCalled();
		});

		it("throws THREAD_EVIDENCE_ALREADY_LINKED on duplicate", async () => {
			const errorChain = new Proxy(() => ({}), {
				get(_target: unknown, prop: string) {
					if (prop === "then") {
						return (_resolve: unknown, reject: (e: Error) => void) =>
							reject(
								new Error("duplicate key value violates unique constraint"),
							);
					}
					if (prop === "catch") {
						return (fn: (e: Error) => void) => {
							fn(new Error("duplicate"));
							return errorChain;
						};
					}
					return () => errorChain;
				},
			});

			mockDb.select.mockImplementation(() =>
				stubDbChain([makeThreadRow({ status: "ACTIVE" })]),
			);
			mockDb.insert.mockReturnValue(errorChain);

			await expect(
				threadsService.linkEvidence("thread-1", "evidence-1"),
			).rejects.toMatchObject({ code: "THREAD_EVIDENCE_ALREADY_LINKED" });
		});
	});

	describe("createTask", () => {
		it("creates a task within a thread", async () => {
			let selectCalls = 0;
			mockDb.select.mockImplementation(() =>
				stubDbChain(
					++selectCalls === 1
						? [makeThreadRow({ status: "ACTIVE" })]
						: [{ max: 0 }],
				),
			);
			mockDb.insert.mockImplementation(() => stubDbChain([makeTaskRow()]));

			const result = await threadsService.createTask("thread-1", {
				title: "Validar SIRE",
				order: 1,
			});

			expect(result.title).toBe("Validar SIRE");
			expect(result.status).toBe("PENDING");
		});
	});
});

describe("QuickActionsService", () => {
	it("returns 4 quick actions", async () => {
		const { quickActionsService } = await import("../quick-actions.service");
		const actions = quickActionsService.getForCompany("company-1", "2026-06");
		expect(actions).toHaveLength(4);
		expect(actions[0]!.id).toBe("quick-close-month");
		expect(actions[1]!.id).toBe("quick-reconcile-banks");
		expect(actions[2]!.id).toBe("quick-validate-sire");
		expect(actions[3]!.id).toBe("quick-fiscal-risks");
	});

	it("interpolates period into template titles", async () => {
		const { quickActionsService } = await import("../quick-actions.service");
		const actions = quickActionsService.getForCompany("company-1", "2026-06");
		expect(actions[0]!.template.title).toContain("2026-06");
	});
});
