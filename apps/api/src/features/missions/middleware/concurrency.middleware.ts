import { eq, and, sql } from "drizzle-orm";
import { accountingMissions } from "@drenyra/persistence/schema";
import { MissionError, MissionErrorCode } from "@drenyra/mission-domain";

export async function optimisticUpdate(
  db: any,
  missionId: string,
  companyId: string,
  expectedVersion: number,
  updates: Record<string, unknown>,
): Promise<number> {
  const result = await db
    .update(accountingMissions)
    .set({
      ...updates,
      version: sql`version + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(accountingMissions.id, missionId),
        eq(accountingMissions.companyId, companyId),
        eq(accountingMissions.version, expectedVersion),
      ),
    )
    .returning({ newVersion: accountingMissions.version });

  if (result.length === 0) {
    const current = await db
      .select({ version: accountingMissions.version })
      .from(accountingMissions)
      .where(
        and(
          eq(accountingMissions.id, missionId),
          eq(accountingMissions.companyId, companyId),
        ),
      )
      .limit(1);

    throw new MissionError(MissionErrorCode.VERSION_CONFLICT, 409, undefined, {
      currentVersion: current[0]?.version ?? null,
      expectedVersion,
    });
  }
  return result[0].newVersion;
}
