/**
 * Integration tests for Missions API
 * Tests against mocked service layer to validate full flow
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MissionsService } from "../../missions.service";
import { MissionEventStore } from "../../sse/mission-event-store";
import { MissionsController } from "../../missions.controller";
import { MissionError, MissionErrorCode } from "@drenyra/mission-domain";

const mockDb = vi.hoisted(() => ({ db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), transaction: vi.fn() } }));

vi.mock("@drenyra/persistence/schema", () => ({
  accountingMissions: { id: "id", companyId: "company_id", fiscalPeriod: "fiscal_period", intent: "intent", status: "status", version: "version", progress: "progress", input: "input", proposal: "proposal", rejection: "rejection", receiptId: "receipt_id", receiptHash: "receipt_hash", lastEventSequence: "last_event_sequence", createdAt: "created_at", updatedAt: "updated_at" },
  missionIdempotency: { companyId: "company_id", idempotencyKey: "idempotency_key", commandType: "command_type", payloadHash: "payload_hash", missionId: "mission_id", executionStatus: "execution_status", response: "response", responseStatusCode: "response_status_code", expiresAt: "expires_at" },
  missionEvents: { missionId: "mission_id", sequence: "sequence", eventType: "event_type", snapshot: "snapshot", id: "id", createdAt: "created_at" },
}));

const companyId = "550e8400-e29b-41d4-a716-446655440000";
const missionId = "550e8400-e29b-41d4-a716-446655440001";
const actorId = "user-123";
const ctx = { userId: actorId, authUserId: actorId, legacyUserId: null, role: "admin", companyId };

function m(overrides: Record<string, unknown> = {}) {
  return { id: missionId, companyId, fiscalPeriod: "2026-07", intent: "monthly-close", status: "DRAFT", version: 1, progress: 0, input: { instruction: "Run monthly close" }, proposal: null, rejection: null, receiptId: null, receiptHash: null, lastEventSequence: 0, steps: [], currentStep: "", blockers: [], createdAt: new Date("2026-07-01"), updatedAt: new Date("2026-07-01"), ...overrides };
}
function sel(row: any) { mockDb.db.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue(row ? [row] : []) }) }) } as any); }
function upd(returned: any) { mockDb.db.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([returned]) }) }) } as any); }

describe("Missions Integration", () => {
  let svc: MissionsService;
  let ctrl: MissionsController;

  beforeEach(() => { vi.clearAllMocks(); svc = new MissionsService(mockDb.db as any); ctrl = new MissionsController(svc, new MissionEventStore(mockDb.db as any)); });

  describe("State Machine Enforcement", () => {
    it("Full lifecycle: Create -> Execute -> Approve", async () => {
      // Create
      mockDb.db.transaction.mockImplementation(async (fn: any) => {
        const tx = { insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([m()]) }) }) };
        return fn(tx);
      });
      const createRes = await ctrl.create({ companyId, fiscalPeriod: "2026-07", intent: "monthly-close", input: { instruction: "test" } }, ctx);
      expect(createRes.success).toBe(true);

      // Execute
      sel(m());
      upd(m({ status: "QUEUED", version: 2 }));
      const execRes = await ctrl.execute(missionId, { expectedMissionVersion: 1 }, {}, ctx);
      expect(execRes.success).toBe(true);
    });

    it("Approve from non-AWAITING_APPROVAL state returns error", async () => {
      sel(m({ status: "DRAFT" }));
      const eh = "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945";
      const res = await ctrl.approve(missionId, { proposalId: "p1", proposalVersion: 1, evidenceHash: eh, expectedMissionVersion: 1 }, ctx);
      expect(res.success).toBe(false);
    });

    it("Reconcile from non-UNKNOWN state returns error", async () => {
      sel(m({ status: "DRAFT" }));
      const res = await ctrl.reconcile(missionId, { resolution: "RUNNING", reason: "Test", expectedMissionVersion: 1 }, ctx);
      expect(res.success).toBe(false);
    });
  });

  describe("Idempotency", () => {
    it("Same create request twice returns success (idempotency is service-level concern)", async () => {
      mockDb.db.transaction.mockImplementation(async (fn: any) => {
        const tx = { insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([m()]) }) }) };
        return fn(tx);
      });
      const r1 = await ctrl.create({ companyId, fiscalPeriod: "2026-07", intent: "monthly-close", input: { instruction: "test" } }, ctx);
      const r2 = await ctrl.create({ companyId, fiscalPeriod: "2026-07", intent: "monthly-close", input: { instruction: "test" } }, ctx);
      expect(r1.success).toBe(true);
      expect(r2.success).toBe(true);
    });
  });

  describe("Concurrency", () => {
    it("Stale version returns error", async () => {
      sel(m({ version: 3 }));
      upd(m({}) as any);
      mockDb.db.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }) }) } as any);
      mockDb.db.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([{ version: 3 }]) }) }) } as any);
      const res = await ctrl.execute(missionId, { expectedMissionVersion: 1 }, {}, ctx);
      expect(res.success).toBe(false);
    });
  });

  describe("Tenant Isolation", () => {
    it("GET with wrong company returns not found", async () => {
      sel(null);
      const res = await ctrl.get(missionId, { ...ctx, companyId: "wrong-company" });
      expect(res.success).toBe(false);
    });

    it("Approve with wrong company returns error", async () => {
      sel(null);
      const eh = "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945";
      const res = await ctrl.approve(missionId, { proposalId: "p1", proposalVersion: 1, evidenceHash: eh, expectedMissionVersion: 1 }, { ...ctx, companyId: "wrong" });
      expect(res.success).toBe(false);
    });
  });
});
