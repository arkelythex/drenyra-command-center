import { randomUUID } from "node:crypto";
import { db, eq, sireSubmissions } from "@drenyra/infrastructure";
import { Elysia } from "elysia";
import { afterEach, describe, expect, it } from "vitest";
import { sireModule } from "../../index";
import { resetSireRateLimitStateForTests } from "../../middleware/rate-limit.middleware";
import { createSireAuthHeaders } from "../support/sire-auth-test-helpers";

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;
const jwtSecret = "integration-sire-secret-12345678901234567890";

describeDb("SIRE submit governance (integration)", () => {
	const app = new Elysia().use(sireModule);
	const idempotencyKeys: string[] = [];
	const originalEnv = { ...process.env };

	afterEach(async () => {
		process.env = { ...originalEnv };
		resetSireRateLimitStateForTests();

		for (const idempotencyKey of idempotencyKeys.splice(0)) {
			await db
				.delete(sireSubmissions)
				.where(eq(sireSubmissions.idempotencyKey, idempotencyKey));
		}
	});

	it("persists BLOCKED_POLICY record when kill switch is active", async () => {
		process.env.AUTONOMY_GLOBAL_KILL_SWITCH = "true";
		process.env.SIRE_SUBMISSION_MODE = "simulation";
		process.env.SIRE_JWT_SECRET = jwtSecret;

		const idempotencyKey = `itest-block-${Date.now()}`;
		idempotencyKeys.push(idempotencyKey);

		const companyId = randomUUID();
		const response = await app.handle(
			new Request("http://localhost/api/sire/submit", {
				method: "POST",
				headers: createSireAuthHeaders(companyId, jwtSecret, {
					"content-type": "application/json",
				}),
				body: JSON.stringify({
					companyId,
					period: "2026-02",
					ledgerType: "ventas",
					payloadFormat: "txt",
					payloadBase64: "dGVzdA==",
					idempotencyKey,
				}),
			}),
		);

		expect(response.status).toBe(503);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "AUTONOMY_KILL_SWITCH_ACTIVE",
			governance: { decision: "BLOCK" },
		});

		const record = await db.query.sireSubmissions.findFirst({
			where: eq(sireSubmissions.idempotencyKey, idempotencyKey),
		});

		expect(record).toBeTruthy();
		expect(record?.status).toBe("BLOCKED_POLICY");
		expect(record?.errors).toMatchObject({
			governance: {
				decision: "BLOCK",
			},
		});
	});

	it("allows submission with approval override and stores governance trace", async () => {
		process.env.AUTONOMY_GLOBAL_KILL_SWITCH = "false";
		process.env.SIRE_SUBMISSION_MODE = "simulation";
		process.env.AUTONOMY_MAX_AUTO_EXECUTION_PEN = "10000";
		process.env.SIRE_JWT_SECRET = jwtSecret;

		const idempotencyKey = `itest-allow-${Date.now()}`;
		idempotencyKeys.push(idempotencyKey);
		const companyId = randomUUID();

		const response = await app.handle(
			new Request("http://localhost/api/sire/submit", {
				method: "POST",
				headers: createSireAuthHeaders(companyId, jwtSecret, {
					"content-type": "application/json",
				}),
				body: JSON.stringify({
					companyId,
					period: "2026-02",
					ledgerType: "ventas",
					payloadFormat: "txt",
					payloadBase64: "dGVzdA==",
					idempotencyKey,
					governance: {
						estimatedAmountPen: 25000,
						approval: {
							approvedBy: "compliance.lead@arkalythix.local",
							reason: "Emergency submission window",
						},
					},
				}),
			}),
		);

		expect(response.status).toBe(202);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				provider: "simulation",
				governance: {
					decision: "ALLOW",
				},
			},
		});

		const record = await db.query.sireSubmissions.findFirst({
			where: eq(sireSubmissions.idempotencyKey, idempotencyKey),
		});

		expect(record).toBeTruthy();
		expect(record?.status).toBe("ACCEPTED");
		expect(record?.warnings).toMatchObject({
			governance: {
				decision: "ALLOW",
			},
		});
	});
});
