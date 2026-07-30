import { describe, expect, it, vi, beforeEach } from "vitest";

const mockDb = vi.hoisted(() => ({ db: { select: vi.fn(), insert: vi.fn(), transaction: vi.fn() } }));

vi.mock("@drenyra/persistence/schema", () => ({
  missionEvents: { missionId: "mission_id", sequence: "sequence", eventType: "event_type", snapshot: "snapshot", id: "id", createdAt: "created_at" },
}));

import { MissionEventStore } from "../sse/mission-event-store";

describe("MissionEventStore", () => {
  const missionId = "550e8400-e29b-41d4-a716-446655440001";
  let store: MissionEventStore;
  beforeEach(() => { vi.clearAllMocks(); store = new MissionEventStore(mockDb.db as any); });

  describe("appendEvent", () => {
    it("assigns sequence 1 for first event", async () => {
      mockDb.db.transaction.mockImplementation(async (fn: any) => {
        const tx = { select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ for: vi.fn().mockResolvedValue([{ maxSeq: 0 }]) }) }) }), insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }) };
        return fn(tx);
      });
      expect(await store.appendEvent(missionId, "STATE_TRANSITION", { id: missionId })).toBe(1);
    });

    it("increments sequence", async () => {
      mockDb.db.transaction.mockImplementation(async (fn: any) => {
        const tx = { select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ for: vi.fn().mockResolvedValue([{ maxSeq: 5 }]) }) }) }), insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }) };
        return fn(tx);
      });
      expect(await store.appendEvent(missionId, "PROGRESS_UPDATE", { progress: 5000 })).toBe(6);
    });

    it("uses FOR UPDATE lock", async () => {
      const forSpy = vi.fn().mockResolvedValue([{ maxSeq: 0 }]);
      mockDb.db.transaction.mockImplementation(async (fn: any) => {
        const tx = { select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ for: forSpy }) }) }), insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }) };
        return fn(tx);
      });
      await store.appendEvent(missionId, "STATE_TRANSITION", { id: missionId });
      expect(forSpy).toHaveBeenCalledWith("update");
    });
  });

  describe("getEventsSince", () => {
    it("returns events after fromSequence", async () => {
      const events = [{ id: "e1", missionId, sequence: 5, eventType: "S", snapshot: {}, createdAt: new Date() }, { id: "e2", missionId, sequence: 6, eventType: "P", snapshot: {}, createdAt: new Date() }];
      mockDb.db.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ orderBy: vi.fn().mockResolvedValue(events) }) }) } as any);
      const r = await store.getEventsSince(missionId, 4);
      expect(r).toHaveLength(2);
    });

    it("returns empty when no events", async () => {
      mockDb.db.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ orderBy: vi.fn().mockResolvedValue([]) }) }) } as any);
      expect(await store.getEventsSince(missionId, 10)).toEqual([]);
    });
  });

  describe("getEvent", () => {
    it("returns event when found", async () => {
      const ev = { id: "e1", missionId, sequence: 3, eventType: "S", snapshot: {}, createdAt: new Date() };
      mockDb.db.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([ev]) }) }) } as any);
      expect(await store.getEvent(missionId, 3)).toEqual(ev);
    });

    it("returns null when not found", async () => {
      mockDb.db.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) }) } as any);
      expect(await store.getEvent(missionId, 999)).toBeNull();
    });
  });
});
