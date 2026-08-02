import { isMissionError } from "@drenyra/mission-domain";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDb = vi.hoisted(() => ({
	db: {
		select: vi.fn(),
		insert: vi.fn(),
		update: vi.fn(),
		transaction: vi.fn(),
	},
}));

vi.mock("@drenyra/persistence/schema", () => ({
	accountingMissions: {
		id: "id",
		companyId: "company_id",
		fiscalPeriod: "fiscal_period",
		intent: "intent",
		status: "status",
		version: "version",
		progress: "progress",
		input: "input",
		proposal: "proposal",
		rejection: "rejection",
		receiptId: "receipt_id",
		receiptHash: "receipt_hash",
		lastEventSequence: "last_event_sequence",
		createdAt: "created_at",
		updatedAt: "updated_at",
	},
	missionIdempotency: {
		companyId: "company_id",
		idempotencyKey: "idempotency_key",
		commandType: "command_type",
		payloadHash: "payload_hash",
		missionId: "mission_id",
		executionStatus: "execution_status",
		response: "response",
		responseStatusCode: "response_status_code",
		expiresAt: "expires_at",
	},
}));

import { MissionsService } from "../missions.service";

const companyId = "550e8400-e29b-41d4-a716-446655440000";
const missionId = "550e8400-e29b-41d4-a716-446655440001";
const actorId = "user-123";

function m(overrides: Record<string, unknown> = {}) {
	return {
		id: missionId,
		companyId,
		fiscalPeriod: "2026-07",
		intent: "monthly-close",
		status: "DRAFT",
		version: 1,
		progress: 0,
		input: { instruction: "Run monthly close" },
		proposal: null,
		rejection: null,
		receiptId: null,
		receiptHash: null,
		lastEventSequence: 0,
		createdAt: new Date("2026-07-01"),
		updatedAt: new Date("2026-07-01"),
		...overrides,
	};
}
function sel(row: Record<string, unknown> | null) {
	mockDb.db.select.mockReturnValue({
		from: vi.fn().mockReturnValue({
			where: vi.fn().mockReturnValue({
				limit: vi.fn().mockResolvedValue(row ? [row] : []),
			}),
		}),
	} as any);
}
function upd(returned: Record<string, unknown>) {
	mockDb.db.update.mockReturnValue({
		set: vi.fn().mockReturnValue({
			where: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([returned]),
			}),
		}),
	} as any);
}
function updFail() {
	mockDb.db.update.mockReturnValue({
		set: vi.fn().mockReturnValue({
			where: vi
				.fn()
				.mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }),
		}),
	} as any);
}

describe("MissionsService", () => {
	let svc: MissionsService;
	beforeEach(() => {
		vi.clearAllMocks();
		svc = new MissionsService(mockDb.db as any);
	});

	describe("createMission", () => {
		it("creates in DRAFT with version 1", async () => {
			mockDb.db.transaction.mockImplementation(async (fn: any) => {
				const tx = {
					insert: vi.fn().mockReturnValue({
						values: vi.fn().mockReturnValue({
							returning: vi.fn().mockResolvedValue([m()]),
						}),
					}),
				};
				return fn(tx);
			});
			const r = await svc.createMission(companyId, {
				companyId,
				fiscalPeriod: "2026-07",
				intent: "monthly-close",
				input: { instruction: "Run monthly close" },
			});
			expect(r.status).toBe("DRAFT");
			expect(r.version).toBe(1);
		});
		it("rejects invalid intent", async () => {
			await expect(
				svc.createMission(companyId, {
					companyId,
					fiscalPeriod: "2026-07",
					intent: "bad" as any,
					input: { instruction: "x" },
				}),
			).rejects.toSatisfy(isMissionError);
		});
	});

	describe("getMission", () => {
		it("returns mission for matching company", async () => {
			sel(m());
			const found = await svc.getMission(missionId, companyId);
			expect(found?.id).toBe(missionId);
		});
		it("returns null for wrong company", async () => {
			sel(null);
			expect(await svc.getMission(missionId, "other")).toBeNull();
		});
	});

	describe("executeMission", () => {
		it("DRAFT->QUEUED->RUNNING", async () => {
			sel(m());
			upd(m({ status: "QUEUED", version: 2 }));
			const r = await svc.executeMission(missionId, companyId, {
				expectedMissionVersion: 1,
			});
			expect(r.status).toBe("RUNNING");
		});
		it("rejects COMPLETED", async () => {
			sel(m({ status: "COMPLETED" }));
			await expect(
				svc.executeMission(missionId, companyId, { expectedMissionVersion: 1 }),
			).rejects.toSatisfy(isMissionError);
		});
		it("rejects AWAITING_APPROVAL", async () => {
			sel(m({ status: "AWAITING_APPROVAL" }));
			await expect(
				svc.executeMission(missionId, companyId, { expectedMissionVersion: 1 }),
			).rejects.toSatisfy(isMissionError);
		});
		it("rejects stale version", async () => {
			sel(m({ version: 3 }));
			updFail();
			mockDb.db.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([{ version: 3 }]),
					}),
				}),
			} as any);
			await expect(
				svc.executeMission(missionId, companyId, { expectedMissionVersion: 1 }),
			).rejects.toSatisfy(isMissionError);
		});
	});

	const eh = "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945";
	describe("approveMission", () => {
		it("AWAITING_APPROVAL->APPROVED", async () => {
			sel(
				m({
					status: "AWAITING_APPROVAL",
					version: 2,
					proposal: {
						id: "p1",
						missionId,
						version: 1,
						evidence: [],
						evidenceHash: eh,
						summary: "T",
						riskLevel: "LOW",
						generatedAt: "2026-07-15",
					},
				}),
			);
			upd(
				m({
					status: "APPROVED",
					version: 3,
					receiptId: "r1",
					receiptHash:
						"abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1",
				}),
			);
			const r = await svc.approveMission(missionId, companyId, actorId, {
				proposalId: "p1",
				proposalVersion: 1,
				evidenceHash: eh,
				expectedMissionVersion: 2,
			});
			expect(r.status).toBe("APPROVED");
			expect(r.receiptId).toBeDefined();
		});
		it("rejects when not AWAITING_APPROVAL", async () => {
			sel(m({ status: "DRAFT" }));
			await expect(
				svc.approveMission(missionId, companyId, actorId, {
					proposalId: "p1",
					proposalVersion: 1,
					evidenceHash: eh,
					expectedMissionVersion: 1,
				}),
			).rejects.toSatisfy(isMissionError);
		});
		it("rejects EVIDENCE_MISMATCH", async () => {
			sel(
				m({
					status: "AWAITING_APPROVAL",
					version: 2,
					proposal: {
						id: "p1",
						missionId,
						version: 1,
						evidence: [],
						evidenceHash: "different",
						summary: "T",
						riskLevel: "LOW",
						generatedAt: "2026-07-15",
					},
				}),
			);
			await expect(
				svc.approveMission(missionId, companyId, actorId, {
					proposalId: "p1",
					proposalVersion: 1,
					evidenceHash: "other",
					expectedMissionVersion: 2,
				}),
			).rejects.toSatisfy(isMissionError);
		});
		it("rejects proposal version mismatch", async () => {
			sel(
				m({
					status: "AWAITING_APPROVAL",
					version: 2,
					proposal: {
						id: "p1",
						missionId,
						version: 2,
						evidence: [],
						evidenceHash: eh,
						summary: "T",
						riskLevel: "LOW",
						generatedAt: "2026-07-15",
					},
				}),
			);
			await expect(
				svc.approveMission(missionId, companyId, actorId, {
					proposalId: "p1",
					proposalVersion: 1,
					evidenceHash: eh,
					expectedMissionVersion: 2,
				}),
			).rejects.toSatisfy(isMissionError);
		});
	});

	describe("rejectMission", () => {
		it("AWAITING_APPROVAL->REJECTED", async () => {
			sel(
				m({
					status: "AWAITING_APPROVAL",
					version: 2,
					proposal: {
						id: "p1",
						missionId,
						version: 1,
						evidence: [],
						evidenceHash: "abc",
						summary: "T",
						riskLevel: "LOW",
						generatedAt: "2026-07-15",
					},
				}),
			);
			upd(
				m({
					status: "REJECTED",
					version: 3,
					rejection: {
						reason: "Nope",
						rejectedBy: actorId,
						rejectedAt: "2026-07-15",
						proposalVersion: 1,
					},
				}),
			);
			expect(
				(
					await svc.rejectMission(missionId, companyId, actorId, {
						proposalId: "p1",
						proposalVersion: 1,
						reason: "Nope",
						expectedMissionVersion: 2,
					})
				).status,
			).toBe("REJECTED");
		});
		it("rejects empty reason", async () => {
			await expect(
				svc.rejectMission(missionId, companyId, actorId, {
					proposalId: "p1",
					proposalVersion: 1,
					reason: "",
					expectedMissionVersion: 1,
				}),
			).rejects.toSatisfy(isMissionError);
		});
	});

	describe("reconcileMission", () => {
		it("UNKNOWN->RUNNING", async () => {
			sel(m({ status: "UNKNOWN", version: 2 }));
			upd(m({ status: "RUNNING", version: 3 }));
			expect(
				(
					await svc.reconcileMission(missionId, companyId, actorId, {
						resolution: "RUNNING",
						reason: "Recovered",
						expectedMissionVersion: 2,
					})
				).status,
			).toBe("RUNNING");
		});
		it("rejects when not UNKNOWN", async () => {
			sel(m({ status: "DRAFT" }));
			await expect(
				svc.reconcileMission(missionId, companyId, actorId, {
					resolution: "RUNNING",
					reason: "x",
					expectedMissionVersion: 1,
				}),
			).rejects.toSatisfy(isMissionError);
		});
		it("rejects invalid resolution", async () => {
			sel(m({ status: "UNKNOWN" }));
			await expect(
				svc.reconcileMission(missionId, companyId, actorId, {
					resolution: "DRAFT" as any,
					reason: "x",
					expectedMissionVersion: 1,
				}),
			).rejects.toSatisfy(isMissionError);
		});
		it("rejects empty reason", async () => {
			await expect(
				svc.reconcileMission(missionId, companyId, actorId, {
					resolution: "RUNNING",
					reason: "",
					expectedMissionVersion: 1,
				}),
			).rejects.toSatisfy(isMissionError);
		});
	});

	describe("mission memory recorder hook", () => {
		it("records completion when reconciled to COMPLETED", async () => {
			const recorder = {
				recordCompletion: vi.fn().mockResolvedValue(undefined),
			};
			const hooked = new MissionsService(
				mockDb.db as any,
				undefined,
				undefined,
				recorder as any,
			);

			sel(m({ status: "UNKNOWN", version: 2 }));
			upd(m({ status: "COMPLETED", version: 3 }));

			const result = await hooked.reconcileMission(
				missionId,
				companyId,
				actorId,
				{
					resolution: "COMPLETED",
					reason: "Evidence reviewed",
					expectedMissionVersion: 2,
				},
			);

			expect(result.status).toBe("COMPLETED");
			expect(recorder.recordCompletion).toHaveBeenCalledTimes(1);
			const input = recorder.recordCompletion.mock.calls[0][0];
			expect(input.missionId).toBe(missionId);
			expect(input.companyId).toBe(companyId);
			expect(input.intent).toBe("monthly-close");
			expect(input.fiscalPeriod).toBe("2026-07");
			expect(input.actorId).toBe(actorId);
		});

		it("does NOT record for non-COMPLETED resolutions", async () => {
			const recorder = {
				recordCompletion: vi.fn().mockResolvedValue(undefined),
			};
			const hooked = new MissionsService(
				mockDb.db as any,
				undefined,
				undefined,
				recorder as any,
			);

			sel(m({ status: "UNKNOWN", version: 2 }));
			upd(m({ status: "RUNNING", version: 3 }));

			await hooked.reconcileMission(missionId, companyId, actorId, {
				resolution: "RUNNING",
				reason: "Recovered",
				expectedMissionVersion: 2,
			});

			expect(recorder.recordCompletion).not.toHaveBeenCalled();
		});

		it("recorder failure never breaks the mission flow (best-effort)", async () => {
			const recorder = {
				recordCompletion: vi
					.fn()
					.mockRejectedValue(new Error("ENGINE_UNREACHABLE")),
			};
			const hooked = new MissionsService(
				mockDb.db as any,
				undefined,
				undefined,
				recorder as any,
			);
			const warn = vi
				.spyOn(console, "warn")
				.mockImplementation(() => undefined);

			sel(m({ status: "UNKNOWN", version: 2 }));
			upd(m({ status: "COMPLETED", version: 3 }));

			const result = await hooked.reconcileMission(
				missionId,
				companyId,
				actorId,
				{
					resolution: "COMPLETED",
					reason: "Evidence reviewed",
					expectedMissionVersion: 2,
				},
			);

			expect(result.status).toBe("COMPLETED"); // flow unaffected
			expect(warn).toHaveBeenCalled(); // failure surfaced as a warning
			warn.mockRestore();
		});

		it("does nothing when no recorder is injected", async () => {
			sel(m({ status: "UNKNOWN", version: 2 }));
			upd(m({ status: "COMPLETED", version: 3 }));
			const result = await svc.reconcileMission(missionId, companyId, actorId, {
				resolution: "COMPLETED",
				reason: "Evidence reviewed",
				expectedMissionVersion: 2,
			});
			expect(result.status).toBe("COMPLETED");
		});
	});
});
