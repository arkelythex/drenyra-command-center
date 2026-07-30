/**
 * PeriodCloseService Tests — GREEN phase
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { PeriodCloseService } from "../period-close.service";

function mockTx() {
  const updates: any[] = [];
  return {
    updates,
    tx: {
      update: vi.fn().mockImplementation((_table: any) => ({
        set: vi.fn().mockImplementation((data: any) => {
          updates.push(data);
          return {
            where: vi.fn().mockResolvedValue(undefined),
          };
        }),
      })),
    } as any,
  };
}

describe("PeriodCloseService", () => {
  let service: PeriodCloseService;

  beforeEach(() => {
    service = new PeriodCloseService();
  });

  it("should update period status to 'cerrado_final' via AccountingPeriod VO", async () => {
    const { tx, updates } = mockTx();

    await service.closeFinal(tx as any, {
      companyId: "c-001",
      year: 2026,
      month: 6,
    });

    expect(updates.length).toBe(1);
    expect(updates[0].status).toBe("cerrado_final");
  });

  it("should not throw when closing an already cerrado_final period", async () => {
    const { tx } = mockTx();

    await expect(
      service.closeFinal(tx as any, {
        companyId: "c-001",
        year: 2026,
        month: 6,
      }),
    ).resolves.toBeUndefined();
  });

  it("should handle various valid year/month combinations", async () => {
    const { tx, updates } = mockTx();

    await service.closeFinal(tx as any, {
      companyId: "c-003",
      year: 2025,
      month: 1,
    });

    expect(updates[0].status).toBe("cerrado_final");
  });

  it("should throw for invalid month (13)", async () => {
    const { tx } = mockTx();

    await expect(
      service.closeFinal(tx as any, {
        companyId: "c-001",
        year: 2026,
        month: 13,
      }),
    ).rejects.toThrow();
  });

  it("should throw for year before 2020", async () => {
    const { tx } = mockTx();

    await expect(
      service.closeFinal(tx as any, {
        companyId: "c-001",
        year: 2019,
        month: 6,
      }),
    ).rejects.toThrow();
  });
});
