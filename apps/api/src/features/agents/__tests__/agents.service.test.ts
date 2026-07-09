import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../../lib/errors";

// ---------------------------------------------------------------------------
// Hoisted — create mock SessionManager + fake session factory
// ---------------------------------------------------------------------------

const { mockSessionManager, mockAgentSession } = vi.hoisted(() => {
	function makeSession(overrides: Record<string, unknown> = {}) {
		const now = new Date("2026-07-02T10:00:00Z");
		const fiveMinAgo = new Date("2026-07-02T09:55:00Z");
		return {
			id: "session-1",
			goal: "Auditar SIRE Junio 2026",
			context: {
				companyId: "company-1",
				period: "2026-06",
			},
			startedAt: fiveMinAgo,
			lastActivityAt: now,
			status: "active" as const,
			steps: [
				{
					id: "step-1",
					domain: "audit",
					status: "completed" as const,
					startedAt: fiveMinAgo,
					completedAt: new Date("2026-07-02T09:57:00Z"),
					result: { ok: true },
				},
				{
					id: "step-2",
					domain: "evidence",
					status: "running" as const,
					startedAt: new Date("2026-07-02T09:57:00Z"),
				},
				{
					id: "step-3",
					domain: "approval",
					status: "pending" as const,
				},
			],
			metadata: {
				agentId: "cerno",
				agentName: "Cerno",
				clientName: "Empresa SAC",
				period: "2026-06",
				phase: "audit",
				changesProposed: 3,
				evidenceCollected: 12,
				tokensUsed: 4500,
				risk: "medium",
				requiresAction: true,
			},
			...overrides,
		};
	}

	const sessionManager = {
		get: vi.fn(),
		update: vi.fn(),
		create: vi.fn(),
		getActiveSessions: vi.fn(),
		cleanup: vi.fn(),
		addStep: vi.fn(),
		updateStep: vi.fn(),
	};

	return { mockSessionManager: sessionManager, mockAgentSession: makeSession };
});

// ---------------------------------------------------------------------------
// Mock SessionManager at module level — vi.fn() uses IIFE not arrow
// so `new SessionManager()` in the service file works.
// ---------------------------------------------------------------------------

vi.mock("@drenyra/pi", () => {
	function SessionManager() {
		return mockSessionManager;
	}
	return { SessionManager };
});

vi.mock("@drenyra/pi", () => ({}));

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

import { AgentsService } from "../agents.service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const session1 = mockAgentSession();
const session2 = mockAgentSession({
	id: "session-2",
	goal: "Verificar retenciones Mayo 2026",
	metadata: {
		agentId: "custos",
		agentName: "Custos",
		clientName: "Otra Empresa",
		period: "2026-05",
		phase: "compliance",
		changesProposed: 0,
		evidenceCollected: 5,
		tokensUsed: 1200,
		risk: "low",
		requiresAction: false,
	},
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AgentsService", () => {
	let service: AgentsService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new AgentsService(mockSessionManager as never);
	});

	// ──────────────────────────────────────────────────────────────────
	describe("listSessions", () => {
		it("returns paginated session list with DTO transformation", () => {
			mockSessionManager.getActiveSessions.mockReturnValue([
				session1,
				session2,
			]);

			const result = service.listSessions("company-1", {
				limit: 10,
				offset: 0,
			});

			expect(result).toEqual({
				data: [
					expect.objectContaining({
						id: "session-1",
						agentId: "cerno",
						agentName: "Cerno",
						clientName: "Empresa SAC",
						status: "running",
						progress: 33,
						changesProposed: 3,
						evidenceCollected: 12,
						tokensUsed: 4500,
						risk: "medium",
						requiresAction: true,
						steps: [
							expect.objectContaining({
								id: "step-1",
								label: "Auditoría fiscal",
								status: "completed",
							}),
							expect.objectContaining({
								id: "step-2",
								label: "Recolección de evidencia",
								status: "running",
							}),
							expect.objectContaining({
								id: "step-3",
								label: "Aprobación humana",
								status: "pending",
							}),
						],
					}),
					expect.objectContaining({
						id: "session-2",
						agentId: "custos",
						agentName: "Custos",
						risk: "low",
						requiresAction: false,
					}),
				],
				total: 2,
			});

			expect(result.data).toHaveLength(2);
		});

		it("applies client, status, and risk filters", () => {
			mockSessionManager.getActiveSessions.mockReturnValue([
				session1,
				session2,
			]);

			const byClient = service.listSessions("company-1", { client: "Otra" });
			expect(byClient.data).toHaveLength(1);
			expect(byClient.data[0]?.id).toBe("session-2");

			const byStatus = service.listSessions("company-1", { status: "running" });
			expect(byStatus.data).toHaveLength(2);

			const byRisk = service.listSessions("company-1", { risk: "low" });
			expect(byRisk.data).toHaveLength(1);
			expect(byRisk.data[0]?.id).toBe("session-2");
		});

		it("respects pagination limits", () => {
			mockSessionManager.getActiveSessions.mockReturnValue([
				session1,
				session2,
			]);

			const page1 = service.listSessions("company-1", { limit: 1, offset: 0 });
			expect(page1.data).toHaveLength(1);
			expect(page1.data[0]?.id).toBe("session-1");
			expect(page1.total).toBe(2);

			const page2 = service.listSessions("company-1", { limit: 1, offset: 1 });
			expect(page2.data).toHaveLength(1);
			expect(page2.data[0]?.id).toBe("session-2");
			expect(page2.total).toBe(2);
		});
	});

	// ──────────────────────────────────────────────────────────────────
	describe("getSession", () => {
		it("returns DTO for existing session", () => {
			mockSessionManager.get.mockReturnValue(session1);

			const result = service.getSession("company-1", "session-1");

			expect(result).toEqual(
				expect.objectContaining({
					id: "session-1",
					agentId: "cerno",
					status: "running",
				}),
			);
			expect(result?.steps).toHaveLength(3);
		});

		it("throws AGENT_NOT_FOUND for nonexistent session", () => {
			mockSessionManager.get.mockReturnValue(undefined);

			expect(() => service.getSession("company-1", "nonexistent")).toThrow(
				AppError,
			);
			expect(() => service.getSession("company-1", "nonexistent")).toThrow(
				/not found/,
			);
		});
	});

	// ──────────────────────────────────────────────────────────────────
	describe("getTimeline", () => {
		it("returns steps for existing session", () => {
			mockSessionManager.get.mockReturnValue(session1);

			const result = service.getTimeline("company-1", "session-1");

			expect(result).toHaveLength(3);
			expect(result?.[0]).toEqual(
				expect.objectContaining({
					id: "step-1",
					label: "Auditoría fiscal",
					status: "completed",
				}),
			);
			expect(typeof result?.[0]?.duration).toBe("number");
		});

		it("throws AGENT_NOT_FOUND for nonexistent session", () => {
			mockSessionManager.get.mockReturnValue(undefined);

			expect(() => service.getTimeline("company-1", "nonexistent")).toThrow(
				AppError,
			);
		});
	});

	// ──────────────────────────────────────────────────────────────────
	describe("pause / resume / cancel lifecycle", () => {
		it("pauses an active session", () => {
			// First get() returns active session (for getSessionOrThrow), second returns paused
			mockSessionManager.get.mockReturnValueOnce(session1);
			mockSessionManager.update.mockImplementation(() => {});
			mockSessionManager.get.mockReturnValue({
				...session1,
				metadata: { ...session1.metadata, internalStatus: "paused" },
			});

			const result = service.pauseSession("company-1", "session-1");

			expect(mockSessionManager.update).toHaveBeenCalledWith("session-1", {
				metadata: expect.objectContaining({ internalStatus: "paused" }),
			});
			expect(result).toBeDefined();
		});

		it("resumes a paused session", () => {
			const pausedSession = mockAgentSession({
				metadata: {
					...session1.metadata,
					internalStatus: "paused",
				},
			});
			// First get() returns paused (for getSessionOrThrow), second get() returns normal
			mockSessionManager.get.mockReturnValueOnce(pausedSession);
			mockSessionManager.update.mockImplementation(() => {});
			mockSessionManager.get.mockReturnValue(session1);

			const result = service.resumeSession("company-1", "session-1");

			expect(mockSessionManager.update).toHaveBeenCalledWith("session-1", {
				metadata: expect.not.objectContaining({ internalStatus: "paused" }),
			});
			expect(result).toBeDefined();
		});

		it("cancels an active session", () => {
			// First get() returns active (for getSessionOrThrow), second get() returns failed
			mockSessionManager.get.mockReturnValueOnce(session1);
			mockSessionManager.update.mockImplementation(() => {});
			mockSessionManager.get.mockReturnValue({
				...session1,
				status: "failed",
			});

			const result = service.cancelSession("company-1", "session-1");

			expect(mockSessionManager.update).toHaveBeenCalledWith("session-1", {
				status: "failed",
				metadata: expect.objectContaining({
					cancelledAt: expect.any(String),
				}),
			});
			expect(result).toBeDefined();
		});

		it("throws INVALID_TRANSITION when resuming a non-paused session", () => {
			mockSessionManager.get.mockReturnValue(session1);

			expect(() => service.resumeSession("company-1", "session-1")).toThrow(
				AppError,
			);
			expect(() => service.resumeSession("company-1", "session-1")).toThrow(
				/not in "paused"/,
			);
		});

		it("throws INVALID_TRANSITION when canceling a completed session", () => {
			const completedSession = mockAgentSession({ status: "completed" });
			mockSessionManager.get.mockReturnValue(completedSession);

			expect(() => service.cancelSession("company-1", "session-1")).toThrow(
				AppError,
			);
			expect(() => service.cancelSession("company-1", "session-1")).toThrow(
				/Cannot cancel/,
			);
		});
	});
});
