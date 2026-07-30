import { describe, expect, it, vi, beforeEach } from "vitest";
import { MissionError, MissionErrorCode } from "@drenyra/mission-domain";

const mockDb = vi.hoisted(() => ({ db: { update: vi.fn(), select: vi.fn() } }));

vi.mock("@drenyra/persistence/schema", () => ({
  accountingMissions: { id: "id", companyId: "company_id", version: "version", status: "status", updatedAt: "updated_at" },
}));

import { optimisticUpdate } from "../middleware/concurrency.middleware";

describe("optimisticUpdate", () => {
  const missionId = "550e8400-e29b-41d4-a716-446655440001";
  const companyId = "550e8400-e29b-41d4-a716-446655440000";
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns new version when update succeeds", async () => {
    mockDb.db.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ newVersion: 4 }]),
        }),
      }),
    } as any);
    expect(await optimisticUpdate(mockDb.db as any, missionId, companyId, 3, { status: "APPROVED" })).toBe(4);
  });

  it("throws VERSION_CONFLICT when zero rows affected", async () => {
    mockDb.db.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }),
      }),
    } as any);
    mockDb.db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([{ version: 5 }]) }),
      }),
    } as any);
    try {
      await optimisticUpdate(mockDb.db as any, missionId, companyId, 3, { status: "APPROVED" });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(MissionError);
      expect((error as MissionError).code).toBe(MissionErrorCode.VERSION_CONFLICT);
      expect((error as MissionError).statusCode).toBe(409);
      expect((error as MissionError).details).toEqual({ currentVersion: 5, expectedVersion: 3 });
    }
  });

  it("throws VERSION_CONFLICT with null when mission not found", async () => {
    mockDb.db.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }),
      }),
    } as any);
    mockDb.db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }),
      }),
    } as any);
    try {
      await optimisticUpdate(mockDb.db as any, missionId, companyId, 3, { status: "APPROVED" });
      expect.fail("Should have thrown");
    } catch (error) {
      expect((error as MissionError).details).toEqual({ currentVersion: null, expectedVersion: 3 });
    }
  });
});
