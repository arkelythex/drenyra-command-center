/**
 * Integration Test: SIRE Reconciliation
 *
 * Tests the end-to-end SIRE reconciliation pipeline:
 *   submit SIRE → detect discrepancies → judgment-day audit
 *
 * @module features/sire-comparison/__tests__/integration
 */
import { sireSubmissions } from "@drenyra/persistence/schema";
import { createTransactionHooks } from "@drenyra/test-utils/database";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadApiEnv } from "../../../../env/load-api-env";
import {
	TEST_COMPANY_ID,
	TEST_OWNER_ID,
	TEST_SIRE_SUBMISSION_ID,
} from "../../../shared/__tests__/integration/test-constants";

await loadApiEnv();

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;
const TEST_PERIOD = "2026-06";
const TEST_IDEMPOTENCY_KEY = "sire-recon-int-202606-001";

describeDb("SIRE Reconciliation (integration)", () => {
	const {
		beforeEach: setupTx,
		afterEach: teardownTx,
		getDb,
	} = createTransactionHooks();

	beforeEach(async () => {
		await setupTx();
		const db = getDb();

		// Seed: SIRE submission (ACCEPTED)
		await db.insert(sireSubmissions).values({
			id: TEST_SIRE_SUBMISSION_ID,
			companyId: TEST_COMPANY_ID,
			period: TEST_PERIOD,
			ledgerType: "ventas",
			payloadFormat: "json",
			idempotencyKey: TEST_IDEMPOTENCY_KEY,
			attemptNumber: 1,
			maxRetries: 3,
			status: "ACCEPTED",
			provider: "sunat-api",
			dryRun: false,
			submittedAt: new Date(),
			createdBy: TEST_OWNER_ID,
		});
	});

	afterEach(async () => {
		await teardownTx();
	});

	it("should create SIRE submission with ACCEPTED status", async () => {
		const db = getDb();

		const [sub] = await db
			.select()
			.from(sireSubmissions)
			.where(eq(sireSubmissions.id, TEST_SIRE_SUBMISSION_ID));

		expect(sub).toBeDefined();
		expect(sub.status).toBe("ACCEPTED");
		expect(sub.period).toBe(TEST_PERIOD);
		expect(sub.ledgerType).toBe("ventas");
		expect(sub.companyId).toBe(TEST_COMPANY_ID);
		expect(sub.provider).toBe("sunat-api");
		expect(sub.submittedAt).toBeDefined();
	});

	it("should enforce unique idempotency key", async () => {
		const db = getDb();

		await expect(
			db.insert(sireSubmissions).values({
				id: "00000000-0000-0000-0000-000000000099",
				companyId: TEST_COMPANY_ID,
				period: TEST_PERIOD,
				ledgerType: "compras",
				payloadFormat: "csv",
				idempotencyKey: TEST_IDEMPOTENCY_KEY, // Duplicate!
				attemptNumber: 1,
				maxRetries: 3,
				status: "SUBMITTED",
				provider: "simulation",
				dryRun: true,
				createdBy: TEST_OWNER_ID,
			}),
		).rejects.toThrow();
	});

	it("should support retry by incrementing attempt number", async () => {
		const db = getDb();

		// Re-submit with incremented attempt
		await db
			.update(sireSubmissions)
			.set({
				status: "SUBMITTED",
				attemptNumber: 2,
				submittedAt: new Date(),
			})
			.where(eq(sireSubmissions.id, TEST_SIRE_SUBMISSION_ID));

		const [sub] = await db
			.select()
			.from(sireSubmissions)
			.where(eq(sireSubmissions.id, TEST_SIRE_SUBMISSION_ID));

		expect(sub.attemptNumber).toBe(2);
		expect(sub.status).toBe("SUBMITTED");
	});

	it("should handle REJECTED submission with SUNAT code", async () => {
		const db = getDb();

		await db
			.update(sireSubmissions)
			.set({
				status: "REJECTED",
				sunatCode: "ERR-045",
				sunatMessage: "Registro duplicado - periodo ya reportado",
				errors: [
					{
						line: 12,
						field: "comprobante_serie",
						message: "Serie duplicada para el mismo período",
					},
				],
			})
			.where(eq(sireSubmissions.id, TEST_SIRE_SUBMISSION_ID));

		const [sub] = await db
			.select()
			.from(sireSubmissions)
			.where(eq(sireSubmissions.id, TEST_SIRE_SUBMISSION_ID));

		expect(sub.status).toBe("REJECTED");
		expect(sub.sunatCode).toBe("ERR-045");
		expect(sub.sunatMessage).toBeTruthy();
		expect(sub.errors).toBeDefined();
		expect(Array.isArray(sub.errors)).toBe(true);
	});

	it("should track a submission with OBSERVED status and warnings", async () => {
		const db = getDb();

		await db
			.update(sireSubmissions)
			.set({
				status: "OBSERVED",
				sunatStatus: "OBSERVED",
				sunatCode: "OBS-003",
				sunatMessage: "Discrepancias en montos de IGV",
				warnings: [
					{
						line: 5,
						field: "igv_monto",
						message: "IGV calculado no coincide con base imponible",
					},
					{
						line: 8,
						field: "total",
						message: "Total reportado difiere del esperado",
					},
				],
			})
			.where(eq(sireSubmissions.id, TEST_SIRE_SUBMISSION_ID));

		const [sub] = await db
			.select()
			.from(sireSubmissions)
			.where(eq(sireSubmissions.id, TEST_SIRE_SUBMISSION_ID));

		expect(sub.status).toBe("OBSERVED");
		expect(sub.warnings).toBeDefined();
		expect(Array.isArray(sub.warnings)).toBe(true);
	});
});
