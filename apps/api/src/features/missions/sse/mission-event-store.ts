import { eq, and, gt, sql } from "drizzle-orm";
import { missionEvents } from "@drenyra/persistence/schema";

export class MissionEventStore {
  constructor(private readonly db: any) {}

  async appendEvent(
    missionId: string,
    eventType: string,
    snapshot: Record<string, unknown>,
  ): Promise<number> {
    return await this.db.transaction(async (tx: any) => {
      const [row] = await tx
        .select({ maxSeq: sql<number>`COALESCE(MAX(${missionEvents.sequence}), 0)` })
        .from(missionEvents)
        .where(eq(missionEvents.missionId, missionId))
        .for("update");

      const nextSequence = (row?.maxSeq ?? 0) + 1;

      await tx.insert(missionEvents).values({
        missionId,
        sequence: nextSequence,
        eventType,
        snapshot,
      });

      return nextSequence;
    });
  }

  async getEventsSince(missionId: string, fromSequence: number) {
    return await this.db
      .select()
      .from(missionEvents)
      .where(
        and(
          eq(missionEvents.missionId, missionId),
          gt(missionEvents.sequence, fromSequence),
        ),
      )
      .orderBy(missionEvents.sequence);
  }

  async getEvent(missionId: string, sequence: number) {
    const [row] = await this.db
      .select()
      .from(missionEvents)
      .where(
        and(
          eq(missionEvents.missionId, missionId),
          eq(missionEvents.sequence, sequence),
        ),
      )
      .limit(1);
    return row ?? null;
  }
}
