/**
 * Idempotency Middleware — Unit Tests (RED phase)
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockDb = vi.hoisted(() => {
  const insert = vi.fn();
  const select = vi.fn();
  const transaction = vi.fn();
  return { db: { insert, select, transaction } };
});

vi.mock("@drenyra/persistence/schema", () => ({
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

import { MissionIdempotencyService } from "../middleware/idempotency.middleware";

describe("MissionIdempotencyService", () => {
  const companyId = "550e8400-e29b-41d4-a716-446655440000";
  const commandType = "create";
  const idempotencyKey = "key-abc-123";
  const body = { intent: "monthly-close", fiscalPeriod: "2026-07" };
  let service: MissionIdempotencyService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MissionIdempotencyService(mockDb.db as any);
  });

  describe("resolveIdempotency", () => {
    it("returns 'proceed' when no existing idempotency record exists", async () => {
      mockDb.db.transaction.mockImplementation(async (fn: any) => {
        const tx = {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  for: vi.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockResolvedValue(undefined),
          }),
        };
        return fn(tx);
      });

      const result = await service.resolveIdempotency(
        mockDb.db as any, companyId, commandType, idempotencyKey, body);
      expect(result).toBe("proceed");
    });

    it("returns 409 IDEMPOTENCY_CONFLICT when different payload hash exists", async () => {
      mockDb.db.transaction.mockImplementation(async (fn: any) => {
        const tx = {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  for: vi.fn().mockResolvedValue([{
                    id: "idem-1", companyId, idempotencyKey,
                    payloadHash: "different-hash",
                    executionStatus: "COMPLETED",
                    response: { missionId: "m1" }, responseStatusCode: 201,
                  }]),
                }),
              }),
            }),
          }),
        };
        return fn(tx);
      });

      const result = await service.resolveIdempotency(
        mockDb.db as any, companyId, commandType, idempotencyKey,
        { intent: "different", fiscalPeriod: "2026-08" });
      expect(result).toEqual({
        status: 409,
        body: { success: false, error: "Idempotency key reused with different payload", code: "IDEMPOTENCY_CONFLICT" },
      });
    });

    it("returns 202 when EXECUTING", async () => {
      mockDb.db.transaction.mockImplementation(async (fn: any) => {
        const tx = {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  for: vi.fn().mockResolvedValue([{
                    id: "idem-1", executionStatus: "EXECUTING", payloadHash: "560f9ce077b48192614fe57a57af558b5171af7315729a6137900fff0a059017",
                    response: null, responseStatusCode: null,
                  }]),
                }),
              }),
            }),
          }),
        };
        return fn(tx);
      });

      const result = await service.resolveIdempotency(
        mockDb.db as any, companyId, commandType, idempotencyKey,
        { intent: "different", fiscalPeriod: "2026-08" });
      expect(result).toEqual({ status: 202, body: { message: "Operation in progress" } });
    });

    it("returns 409 when FAILED", async () => {
      mockDb.db.transaction.mockImplementation(async (fn: any) => {
        const tx = {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  for: vi.fn().mockResolvedValue([{
                    id: "idem-1", executionStatus: "FAILED", payloadHash: "560f9ce077b48192614fe57a57af558b5171af7315729a6137900fff0a059017",
                    response: null, responseStatusCode: null,
                  }]),
                }),
              }),
            }),
          }),
        };
        return fn(tx);
      });

      const result = await service.resolveIdempotency(
        mockDb.db as any, companyId, commandType, idempotencyKey,
        { intent: "different", fiscalPeriod: "2026-08" });
      expect(result).toEqual({
        status: 409,
        body: { success: false, error: "Previous execution failed", code: "IDEMPOTENCY_FAILED" },
      });
    });

    it("returns cached response when same key + payload (COMPLETED)", async () => {
      const { createHash } = await import("node:crypto");
      const bodyToUse = { intent: "monthly-close", fiscalPeriod: "2026-07" };
      const payloadHash = createHash("sha256")
        .update(JSON.stringify(bodyToUse, Object.keys(bodyToUse).sort()))
        .digest("hex");

      mockDb.db.transaction.mockImplementation(async (fn: any) => {
        const tx = {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  for: vi.fn().mockResolvedValue([{
                    id: "idem-1", companyId, idempotencyKey, payloadHash,
                    executionStatus: "COMPLETED",
                    response: { missionId: "mission-1", status: "DRAFT" },
                    responseStatusCode: 201,
                  }]),
                }),
              }),
            }),
          }),
        };
        return fn(tx);
      });

      const result = await service.resolveIdempotency(
        mockDb.db as any, companyId, commandType, idempotencyKey, bodyToUse);
      expect(result).toEqual({
        status: 201, body: { missionId: "mission-1", status: "DRAFT" },
      });
    });
  });
});
