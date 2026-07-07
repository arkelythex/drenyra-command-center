/**
 * Integration Test: Evidence Lifecycle
 *
 * Tests the end-to-end flow: create evidence → link to accounting PR → verify FK integrity
 *
 * @module features/evidence-v2/__tests__/integration
 */
import { evidence, evidenceLinks } from "@drenyra/persistence/schema";
import { createTransactionHooks } from "@drenyra/test-utils/database";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadApiEnv } from "../../../../env/load-api-env";
import {
	TEST_COMPANY_ID,
	TEST_EVIDENCE_HASH,
	TEST_ORG_ID,
	TEST_OWNER_ID,
	TEST_PR_ID,
} from "../../../shared/__tests__/integration/test-constants";

await loadApiEnv();

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;
const TEST_FILE_NAME = "test-invoice-EL.pdf";

describeDb("Evidence Lifecycle (integration)", () => {
	const {
		beforeEach: setupTx,
		afterEach: teardownTx,
		getDb,
	} = createTransactionHooks();

	beforeEach(async () => {
		await setupTx();
		const db = getDb();

		await db.insert(evidence).values({
			organizationId: String(TEST_ORG_ID),
			companyId: TEST_COMPANY_ID,
			filename: TEST_FILE_NAME,
			mimeType: "application/pdf",
			sizeBytes: 1024,
			hash: TEST_EVIDENCE_HASH,
			evidenceType: "INVOICE",
			source: "UPLOAD",
			status: "UPLOADED",
		});
	});

	afterEach(async () => {
		await teardownTx();
	});

	it("should create evidence record with required fields", async () => {
		const db = getDb();

		const [row] = await db
			.select()
			.from(evidence)
			.where(eq(evidence.filename, TEST_FILE_NAME));

		expect(row).toBeDefined();
		expect(row.filename).toBe(TEST_FILE_NAME);
		expect(row.hash).toBe(TEST_EVIDENCE_HASH);
		expect(row.evidenceType).toBe("INVOICE");
		expect(row.source).toBe("UPLOAD");
		expect(row.status).toBe("UPLOADED");
		expect(row.companyId).toBe(TEST_COMPANY_ID);
	});

	it("should link evidence to accounting PR via evidence_links junction", async () => {
		const db = getDb();

		// Retrieve the auto-generated ID
		const [ev] = await db
			.select()
			.from(evidence)
			.where(eq(evidence.filename, TEST_FILE_NAME));
		const evidenceId = ev.id;

		await db.insert(evidenceLinks).values({
			evidenceId,
			entityType: "accounting_pr",
			entityId: TEST_PR_ID,
			relationship: "supporting",
			linkedBy: TEST_OWNER_ID,
		});

		const links = await db
			.select()
			.from(evidenceLinks)
			.where(
				and(
					eq(evidenceLinks.evidenceId, evidenceId),
					eq(evidenceLinks.entityType, "accounting_pr"),
				),
			);

		expect(links).toHaveLength(1);
		expect(links[0].entityId).toBe(TEST_PR_ID);
		expect(links[0].relationship).toBe("supporting");
		expect(links[0].linkedBy).toBe(TEST_OWNER_ID);
		expect(links[0].linkedAt).toBeDefined();
		expect(links[0].metadata).toBeDefined();
	});

	it("should enforce FK constraint from evidence_links to evidence", async () => {
		const db = getDb();

		const fakeEvidenceId = "00000000-0000-0000-0000-999999999999";

		await expect(
			db.insert(evidenceLinks).values({
				evidenceId: fakeEvidenceId,
				entityType: "accounting_pr",
				entityId: TEST_PR_ID,
				relationship: "supporting",
				linkedBy: TEST_OWNER_ID,
			}),
		).rejects.toThrow();
	});

	it("should cascade delete evidence_links when evidence is removed", async () => {
		const db = getDb();

		const [ev] = await db
			.select()
			.from(evidence)
			.where(eq(evidence.filename, TEST_FILE_NAME));
		const evidenceId = ev.id;

		// Create link
		await db.insert(evidenceLinks).values({
			evidenceId,
			entityType: "accounting_pr",
			entityId: TEST_PR_ID,
			relationship: "supporting",
			linkedBy: TEST_OWNER_ID,
		});

		// Delete evidence (cascades to links)
		await db.delete(evidence).where(eq(evidence.id, evidenceId));

		const links = await db
			.select()
			.from(evidenceLinks)
			.where(eq(evidenceLinks.evidenceId, evidenceId));

		expect(links).toHaveLength(0);
	});

	it("should enforce unique constraint on (evidence_id, entity_type, entity_id, relationship)", async () => {
		const db = getDb();

		const [ev] = await db
			.select()
			.from(evidence)
			.where(eq(evidence.filename, TEST_FILE_NAME));
		const evidenceId = ev.id;

		// First insert
		await db.insert(evidenceLinks).values({
			evidenceId,
			entityType: "accounting_pr",
			entityId: TEST_PR_ID,
			relationship: "supporting",
			linkedBy: TEST_OWNER_ID,
		});

		// Duplicate should fail
		await expect(
			db.insert(evidenceLinks).values({
				evidenceId,
				entityType: "accounting_pr",
				entityId: TEST_PR_ID,
				relationship: "supporting",
				linkedBy: TEST_OWNER_ID,
			}),
		).rejects.toThrow();

		// Different relationship should be allowed
		await expect(
			db.insert(evidenceLinks).values({
				evidenceId,
				entityType: "accounting_pr",
				entityId: TEST_PR_ID,
				relationship: "audit_trail",
				linkedBy: TEST_OWNER_ID,
			}),
		).resolves.toBeDefined();
	});
});
