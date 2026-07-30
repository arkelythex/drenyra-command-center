import { createHash } from "node:crypto";
import { eq, and } from "drizzle-orm";
import { missionIdempotency } from "@drenyra/persistence/schema";

export class MissionIdempotencyService {
  sha256(input: string): string {
    return createHash("sha256").update(input).digest("hex");
  }

  canonicalPayload(body: unknown): string {
    if (typeof body !== "object" || body === null) {
      return JSON.stringify(body);
    }
    return JSON.stringify(body, Object.keys(body as Record<string, unknown>).sort());
  }

  async resolveIdempotency(
    db: any,
    companyId: string,
    commandType: string,
    idempotencyKey: string,
    body: unknown,
  ): Promise<"proceed" | { status: number; body: unknown }> {
    const payloadHash = this.sha256(this.canonicalPayload(body));

    return await db.transaction(async (tx: any) => {
      const existing = await tx
        .select()
        .from(missionIdempotency)
        .where(
          and(
            eq(missionIdempotency.companyId, companyId),
            eq(missionIdempotency.idempotencyKey, idempotencyKey),
          ),
        )
        .limit(1)
        .for("update");

      if (existing.length === 0) {
        await tx.insert(missionIdempotency).values({
          companyId,
          commandType,
          idempotencyKey,
          payloadHash,
          executionStatus: "EXECUTING",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        return "proceed";
      }

      const record = existing[0];
      if (record.payloadHash !== payloadHash) {
        return {
          status: 409,
          body: {
            success: false,
            error: "Idempotency key reused with different payload",
            code: "IDEMPOTENCY_CONFLICT",
          },
        };
      }
      if (record.executionStatus === "COMPLETED") {
        return {
          status: record.responseStatusCode ?? 200,
          body: record.response ?? {},
        };
      }
      if (record.executionStatus === "EXECUTING") {
        return {
          status: 202,
          body: { message: "Operation in progress" },
        };
      }
      // FAILED
      return {
        status: 409,
        body: {
          success: false,
          error: "Previous execution failed",
          code: "IDEMPOTENCY_FAILED",
        },
      };
    });
  }
}
