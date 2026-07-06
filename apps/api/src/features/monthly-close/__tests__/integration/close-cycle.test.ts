/**
 * Integration Test: Close Cycle
 *
 * Tests the end-to-end fiscal close pipeline:
 *   create evidence → attach to accounting PR → approve PR → run monthly close
 *
 * @module features/monthly-close/__tests__/integration
 */
import {
	accountingPrs,
	closeChecklistItems,
	closeChecklists,
	closeGates,
	evidence,
	evidenceLinks,
} from "@drenyra/persistence/schema";
import { createTransactionHooks } from "@drenyra/test-utils/database";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadApiEnv } from "../../../../env/load-api-env";
import {
	TEST_CHECKLIST_ID,
	TEST_CHECKLIST_ITEM_ID,
	TEST_CLOSE_GATE_ID,
	TEST_COMPANY_ID,
	TEST_EVIDENCE_HASH,
	TEST_ORG_ID,
	TEST_OWNER_ID,
	TEST_PR_ID,
} from "../../../shared/__tests__/integration/test-constants";

await loadApiEnv();

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

describeDb("Close Cycle (integration)", () => {
	const {
		beforeEach: setupTx,
		afterEach: teardownTx,
		getDb,
	} = createTransactionHooks();

	const TEST_FILE = "close-cycle-evidence.pdf";
	const TEST_PERIOD = "2026-06";

	beforeEach(async () => {
		await setupTx();
		const db = getDb();

		// 1. Evidence record
		await db.insert(evidence).values({
			organizationId: String(TEST_ORG_ID),
			companyId: TEST_COMPANY_ID,
			filename: TEST_FILE,
			mimeType: "application/pdf",
			sizeBytes: 2048,
			hash: TEST_EVIDENCE_HASH,
			evidenceType: "BANK_STATEMENT",
			source: "UPLOAD",
			status: "VALIDATED",
		});

		// 2. Accounting PR (DRAFT)
		await db.insert(accountingPrs).values({
			id: TEST_PR_ID,
			companyId: TEST_COMPANY_ID,
			prNumber: 1001,
			title: "Cierre mensual Junio 2026 - Provisiones",
			description: "Provisiones contables del período",
			status: "DRAFT",
			entries: ["entry-1", "entry-2"],
			evidenceIds: [],
			totalDebitCents: 15000000,
			totalCreditCents: 15000000,
			createdById: TEST_OWNER_ID,
		});

		// 3. Monthly close checklist
		await db.insert(closeChecklists).values({
			id: TEST_CHECKLIST_ID,
			companyId: TEST_COMPANY_ID,
			period: TEST_PERIOD,
			name: "Cierre Junio 2026",
			status: "IN_PROGRESS",
			progress: 30,
			assignedToId: TEST_OWNER_ID,
		});

		// 4. Checklist item with evidence reference
		await db.insert(closeChecklistItems).values({
			id: TEST_CHECKLIST_ITEM_ID,
			checklistId: TEST_CHECKLIST_ID,
			name: "Conciliación bancaria",
			description: "Verificar saldos bancarios vs contabilidad",
			category: "bank_reconciliation",
			status: "IN_PROGRESS",
			assignedToId: TEST_OWNER_ID,
			evidenceIds: [],
			sortOrder: 1,
		});

		// 5. Gate
		await db.insert(closeGates).values({
			id: TEST_CLOSE_GATE_ID,
			companyId: TEST_COMPANY_ID,
			period: TEST_PERIOD,
			gateType: "open_prs",
			status: "OPEN",
			description: "Revisar PRs abiertos antes del cierre",
		});
	});

	afterEach(async () => {
		await teardownTx();
	});

	it("should create evidence and link to accounting PR", async () => {
		const db = getDb();

		const [ev] = await db
			.select()
			.from(evidence)
			.where(eq(evidence.filename, TEST_FILE));
		expect(ev).toBeDefined();

		await db.insert(evidenceLinks).values({
			evidenceId: ev.id,
			entityType: "accounting_pr",
			entityId: TEST_PR_ID,
			relationship: "supporting",
			linkedBy: TEST_OWNER_ID,
		});

		const [pr] = await db
			.select()
			.from(accountingPrs)
			.where(eq(accountingPrs.id, TEST_PR_ID));
		expect(pr).toBeDefined();
		expect(pr.status).toBe("DRAFT");
		expect(pr.companyId).toBe(TEST_COMPANY_ID);

		const links = await db
			.select()
			.from(evidenceLinks)
			.where(
				and(
					eq(evidenceLinks.evidenceId, ev.id),
					eq(evidenceLinks.entityType, "accounting_pr"),
				),
			);
		expect(links).toHaveLength(1);
	});

	it("should transition PR through approval workflow", async () => {
		const db = getDb();

		// PENDING_REVIEW → APPROVED
		for (const nextStatus of ["PENDING_REVIEW", "APPROVED"] as const) {
			await db
				.update(accountingPrs)
				.set({
					status: nextStatus,
					...(nextStatus === "APPROVED"
						? {
								reviewerId: TEST_OWNER_ID,
								reviewedAt: new Date(),
								reviewComment: "Aprobado - documentación completa",
							}
						: { reviewerId: null }),
				})
				.where(eq(accountingPrs.id, TEST_PR_ID));

			const [pr] = await db
				.select()
				.from(accountingPrs)
				.where(eq(accountingPrs.id, TEST_PR_ID));
			expect(pr.status).toBe(nextStatus);
		}
	});

	it("should update checklist item with evidence and mark complete", async () => {
		const db = getDb();

		const [ev] = await db
			.select()
			.from(evidence)
			.where(eq(evidence.filename, TEST_FILE));

		// Link evidence to checklist item
		await db
			.update(closeChecklistItems)
			.set({
				status: "COMPLETED",
				completedAt: new Date(),
				completedById: TEST_OWNER_ID,
				evidenceIds: [ev.id],
				notes: "Conciliación verificada con extracto bancario",
			})
			.where(eq(closeChecklistItems.id, TEST_CHECKLIST_ITEM_ID));

		const [item] = await db
			.select()
			.from(closeChecklistItems)
			.where(eq(closeChecklistItems.id, TEST_CHECKLIST_ITEM_ID));

		expect(item.status).toBe("COMPLETED");
		expect(item.evidenceIds).toContain(ev.id);
		expect(item.completedAt).toBeDefined();
	});

	it("should close and pass a gate", async () => {
		const db = getDb();

		await db
			.update(closeGates)
			.set({
				status: "PASSED",
				resolution: "Todos los PRs relevantes cerrados",
			})
			.where(eq(closeGates.id, TEST_CLOSE_GATE_ID));

		const [gate] = await db
			.select()
			.from(closeGates)
			.where(eq(closeGates.id, TEST_CLOSE_GATE_ID));

		expect(gate.status).toBe("PASSED");
		expect(gate.resolution).toBeTruthy();
	});

	it("should complete the full close checklist", async () => {
		const db = getDb();

		// Complete the checklist
		await db
			.update(closeChecklists)
			.set({
				status: "COMPLETED",
				progress: 100,
				completedAt: new Date(),
			})
			.where(eq(closeChecklists.id, TEST_CHECKLIST_ID));

		const [checklist] = await db
			.select()
			.from(closeChecklists)
			.where(eq(closeChecklists.id, TEST_CHECKLIST_ID));

		expect(checklist.status).toBe("COMPLETED");
		expect(checklist.progress).toBe(100);
		expect(checklist.completedAt).toBeDefined();
	});
});
