/**
 * Auto-Reconciliation Integration Test
 *
 * Tests the FULL auto-reconciliation flow:
 * 1. Create test invoice with amount
 * 2. Create bank transaction with matching reference
 * 3. Run auto-reconcile
 * 4. Verify transaction.isReconciled = true
 * 5. Verify transaction.invoiceId = invoice.id
 */

// Apply integration test mocks FIRST
import "./integration-mocks";

import { randomUUID } from "node:crypto";
import {
	bankTransactions,
	businessPartners,
	companies,
	db,
	eq,
	invoices,
	users,
} from "@drenyra/infrastructure";
import { createId } from "@paralleldrive/cuid2";
import { afterEach, describe, expect, it } from "vitest";
import { ReconciliationService } from "../../application/services/reconciliation.service";
import {
	createTestAccount,
	describeBankingIntegration,
	setupTestDb,
} from "./test-db-setup";

describeBankingIntegration("Auto-Reconciliation (E2E)", () => {
	const getCtx = setupTestDb();
	const reconciliationService = new ReconciliationService();

	// Test data cleanup helpers
	const createdInvoiceIds: string[] = [];
	const createdPartnerIds: string[] = [];
	const createdCompanyIds: string[] = [];
	const createdUserIds: string[] = [];

	afterEach(async () => {
		// Clean up test data in correct order (foreign keys)
		for (const id of createdInvoiceIds) {
			await db.delete(invoices).where(eq(invoices.id, id));
		}
		for (const id of createdPartnerIds) {
			await db.delete(businessPartners).where(eq(businessPartners.id, id));
		}
		for (const id of createdCompanyIds) {
			await db.delete(companies).where(eq(companies.id, id));
		}
		for (const id of createdUserIds) {
			await db.delete(users).where(eq(users.id, id));
		}

		createdInvoiceIds.length = 0;
		createdPartnerIds.length = 0;
		createdCompanyIds.length = 0;
		createdUserIds.length = 0;
	});

	/**
	 * Helper: Create test company
	 */
	async function createTestCompany(companyId: string) {
		const ownerId = randomUUID();
		await db.insert(users).values({
			id: ownerId,
			email: `owner-${createId()}@test.local`,
			password: "test-password",
			name: "Test Owner",
			role: "USER",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		createdUserIds.push(ownerId);

		await db.insert(companies).values({
			id: companyId,
			ownerId,
			ruc: "20" + createId().slice(0, 9),
			businessName: "Test Company SAC",
			tradeName: "Test Co",
			address: "Av Test 123",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		createdCompanyIds.push(companyId);
	}

	/**
	 * Helper: Create test business partner (customer)
	 */
	async function createTestCustomer(companyId: string) {
		const customerId = randomUUID();
		await db.insert(businessPartners).values({
			id: customerId,
			companyId,
			taxId: "20" + createId().slice(0, 9),
			legalName: "Test Customer SAC",
			email: "customer@test.com",
			createdAt: new Date(),
		});
		createdPartnerIds.push(customerId);
		return customerId;
	}

	/**
	 * Helper: Create test invoice
	 */
	async function createTestInvoice(
		companyId: string,
		customerId: string,
		options: {
			invoiceNumber: string;
			totalAmount: string;
			issueDate?: Date;
		},
	) {
		const invoiceId = randomUUID();
		const [invoice] = await db
			.insert(invoices)
			.values({
				id: invoiceId,
				companyId,
				customerId,
				invoiceNumber: options.invoiceNumber,
				series: "F001",
				correlative: Math.floor(Math.random() * 100000),
				issueDate: options.issueDate || new Date(),
				dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
				currency: "PEN",
				exchangeRate: "1.0000",
				subtotal: String(Number(options.totalAmount) / 1.18),
				igvAmount: String((Number(options.totalAmount) * 0.18) / 1.18),
				totalAmount: options.totalAmount,
				status: "SENT",
				sunatStatus: "ACCEPTED",
				paidAmount: "0",
				balanceDue: options.totalAmount,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		createdInvoiceIds.push(invoiceId);
		return invoice;
	}

	describe("Reference-Based Reconciliation", () => {
		it("reconciles transaction with exact invoice number reference", async () => {
			const ctx = getCtx();
			await createTestCompany(ctx.companyId);

			const customerId = await createTestCustomer(ctx.companyId);
			const account = await createTestAccount(ctx);

			// 1. Create invoice with specific number
			const invoiceNumber = "F001-00001234";
			const invoice = await createTestInvoice(ctx.companyId, customerId, {
				invoiceNumber,
				totalAmount: "1180.00", // S/ 1,180 (inc. IGV 18%)
			});

			// 2. Create bank transaction with matching reference
			const [transaction] = await db
				.insert(bankTransactions)
				.values({
					id: randomUUID(),
					companyId: ctx.companyId,
					accountId: account.id,
					transactionDate: new Date().toISOString().split("T")[0],
					description: `Pago factura ${invoiceNumber}`,
					reference: invoiceNumber, // EXACT MATCH
					type: "CREDIT",
					amount: "1180.00",
					isReconciled: false,
					importedFrom: "TEST",
					createdAt: new Date(),
				})
				.returning();

			ctx.addTransaction(transaction.id);

			// 3. Run auto-reconcile
			const result = await reconciliationService.autoReconcile(
				ctx.companyId,
				account.id,
			);

			// 4. Verify reconciliation happened
			expect(result.reconciledCount).toBeGreaterThanOrEqual(1);

			// 5. Verify transaction is reconciled and linked to invoice
			const [reconciledTx] = await db
				.select()
				.from(bankTransactions)
				.where(eq(bankTransactions.id, transaction.id));

			expect(reconciledTx.isReconciled).toBe(true);
			expect(reconciledTx.invoiceId).toBe(invoice.id);
			expect(reconciledTx.reconciledAt).toBeInstanceOf(Date);
		});

		it("reconciles transaction with partial invoice reference (F001-123)", async () => {
			const ctx = getCtx();
			await createTestCompany(ctx.companyId);

			const customerId = await createTestCustomer(ctx.companyId);
			const account = await createTestAccount(ctx);

			const invoiceNumber = "F001-00005678";
			const invoice = await createTestInvoice(ctx.companyId, customerId, {
				invoiceNumber,
				totalAmount: "2360.00",
			});

			// Reference uses SHORT format
			const [transaction] = await db
				.insert(bankTransactions)
				.values({
					id: randomUUID(),
					companyId: ctx.companyId,
					accountId: account.id,
					transactionDate: new Date().toISOString().split("T")[0],
					description: "Transferencia cliente",
					reference: "F001-5678", // Partial match (without leading zeros)
					type: "CREDIT",
					amount: "2360.00",
					isReconciled: false,
					importedFrom: "TEST",
					createdAt: new Date(),
				})
				.returning();

			ctx.addTransaction(transaction.id);

			const result = await reconciliationService.autoReconcile(
				ctx.companyId,
				account.id,
			);

			expect(result.reconciledCount).toBeGreaterThanOrEqual(1);

			const [reconciledTx] = await db
				.select()
				.from(bankTransactions)
				.where(eq(bankTransactions.id, transaction.id));

			expect(reconciledTx.isReconciled).toBe(true);
			expect(reconciledTx.invoiceId).toBe(invoice.id);
		});
	});

	describe("Amount + Date Reconciliation", () => {
		it("reconciles transaction by matching amount within date window", async () => {
			const ctx = getCtx();
			await createTestCompany(ctx.companyId);

			const customerId = await createTestCustomer(ctx.companyId);
			const account = await createTestAccount(ctx);

			const issueDate = new Date("2026-01-15");
			const invoice = await createTestInvoice(ctx.companyId, customerId, {
				invoiceNumber: "F001-00009999",
				totalAmount: "5900.00",
				issueDate,
			});

			// Transaction 2 days after invoice (within 3-day window)
			const transactionDate = new Date("2026-01-17");
			const [transaction] = await db
				.insert(bankTransactions)
				.values({
					id: randomUUID(),
					companyId: ctx.companyId,
					accountId: account.id,
					transactionDate: transactionDate.toISOString().split("T")[0],
					description: "Pago cliente sin referencia",
					reference: null, // NO reference
					type: "CREDIT",
					amount: "5900.00", // EXACT amount match
					isReconciled: false,
					importedFrom: "TEST",
					createdAt: new Date(),
				})
				.returning();

			ctx.addTransaction(transaction.id);

			const result = await reconciliationService.autoReconcile(
				ctx.companyId,
				account.id,
			);

			expect(result.reconciledCount).toBeGreaterThanOrEqual(1);

			const [reconciledTx] = await db
				.select()
				.from(bankTransactions)
				.where(eq(bankTransactions.id, transaction.id));

			expect(reconciledTx.isReconciled).toBe(true);
			expect(reconciledTx.invoiceId).toBe(invoice.id);
		});

		it("does NOT reconcile when date is outside window", async () => {
			const ctx = getCtx();
			await createTestCompany(ctx.companyId);

			const customerId = await createTestCustomer(ctx.companyId);
			const account = await createTestAccount(ctx);

			const issueDate = new Date("2026-01-10");
			await createTestInvoice(ctx.companyId, customerId, {
				invoiceNumber: "F001-00008888",
				totalAmount: "3540.00",
				issueDate,
			});

			// Transaction 10 days after invoice (outside 3-day window)
			const transactionDate = new Date("2026-01-20");
			const [transaction] = await db
				.insert(bankTransactions)
				.values({
					id: randomUUID(),
					companyId: ctx.companyId,
					accountId: account.id,
					transactionDate: transactionDate.toISOString().split("T")[0],
					description: "Pago tardío",
					reference: null,
					type: "CREDIT",
					amount: "3540.00",
					isReconciled: false,
					importedFrom: "TEST",
					createdAt: new Date(),
				})
				.returning();

			ctx.addTransaction(transaction.id);

			await reconciliationService.autoReconcile(ctx.companyId, account.id);

			// Should NOT reconcile due to date mismatch
			const [unreconciledTx] = await db
				.select()
				.from(bankTransactions)
				.where(eq(bankTransactions.id, transaction.id));

			expect(unreconciledTx.isReconciled).toBe(false);
			expect(unreconciledTx.invoiceId).toBeNull();
		});
	});

	describe("No Match Scenarios", () => {
		it("does not reconcile when no matching invoice exists", async () => {
			const ctx = getCtx();
			await createTestCompany(ctx.companyId);
			const account = await createTestAccount(ctx);

			const [transaction] = await db
				.insert(bankTransactions)
				.values({
					id: randomUUID(),
					companyId: ctx.companyId,
					accountId: account.id,
					transactionDate: new Date().toISOString().split("T")[0],
					description: "Pago sin factura",
					reference: "NONEXISTENT-9999",
					type: "CREDIT",
					amount: "9999.00",
					isReconciled: false,
					importedFrom: "TEST",
					createdAt: new Date(),
				})
				.returning();

			ctx.addTransaction(transaction.id);

			const result = await reconciliationService.autoReconcile(
				ctx.companyId,
				account.id,
			);

			expect(result.reconciledCount).toBe(0);

			const [unreconciledTx] = await db
				.select()
				.from(bankTransactions)
				.where(eq(bankTransactions.id, transaction.id));

			expect(unreconciledTx.isReconciled).toBe(false);
			expect(unreconciledTx.invoiceId).toBeNull();
		});

		it("does not reconcile already reconciled transactions", async () => {
			const ctx = getCtx();
			await createTestCompany(ctx.companyId);

			const customerId = await createTestCustomer(ctx.companyId);
			const account = await createTestAccount(ctx);

			const invoice = await createTestInvoice(ctx.companyId, customerId, {
				invoiceNumber: "F001-00007777",
				totalAmount: "4720.00",
			});

			// Transaction already reconciled
			const [transaction] = await db
				.insert(bankTransactions)
				.values({
					id: randomUUID(),
					companyId: ctx.companyId,
					accountId: account.id,
					transactionDate: new Date().toISOString().split("T")[0],
					description: "Ya reconciliado",
					reference: "F001-00007777",
					type: "CREDIT",
					amount: "4720.00",
					isReconciled: true, // ALREADY RECONCILED
					invoiceId: invoice.id,
					reconciledAt: new Date(),
					reconciledBy: randomUUID(),
					importedFrom: "TEST",
					createdAt: new Date(),
				})
				.returning();

			ctx.addTransaction(transaction.id);

			const result = await reconciliationService.autoReconcile(
				ctx.companyId,
				account.id,
			);

			// Should return 0 because transaction is already reconciled
			expect(result.reconciledCount).toBe(0);
		});
	});

	describe("Multiple Transactions", () => {
		it("reconciles multiple transactions in single run", async () => {
			const ctx = getCtx();
			await createTestCompany(ctx.companyId);

			const customerId = await createTestCustomer(ctx.companyId);
			const account = await createTestAccount(ctx);

			// Create 3 invoices
			const inv1 = await createTestInvoice(ctx.companyId, customerId, {
				invoiceNumber: "F001-00001111",
				totalAmount: "1000.00",
			});
			const inv2 = await createTestInvoice(ctx.companyId, customerId, {
				invoiceNumber: "F001-00002222",
				totalAmount: "2000.00",
			});
			const inv3 = await createTestInvoice(ctx.companyId, customerId, {
				invoiceNumber: "F001-00003333",
				totalAmount: "3000.00",
			});

			// Create 3 matching transactions
			const [tx1] = await db
				.insert(bankTransactions)
				.values({
					id: randomUUID(),
					companyId: ctx.companyId,
					accountId: account.id,
					transactionDate: new Date().toISOString().split("T")[0],
					description: "Pago 1",
					reference: "F001-00001111",
					type: "CREDIT",
					amount: "1000.00",
					isReconciled: false,
					importedFrom: "TEST",
					createdAt: new Date(),
				})
				.returning();

			const [tx2] = await db
				.insert(bankTransactions)
				.values({
					id: randomUUID(),
					companyId: ctx.companyId,
					accountId: account.id,
					transactionDate: new Date().toISOString().split("T")[0],
					description: "Pago 2",
					reference: "F001-00002222",
					type: "CREDIT",
					amount: "2000.00",
					isReconciled: false,
					importedFrom: "TEST",
					createdAt: new Date(),
				})
				.returning();

			const [tx3] = await db
				.insert(bankTransactions)
				.values({
					id: randomUUID(),
					companyId: ctx.companyId,
					accountId: account.id,
					transactionDate: new Date().toISOString().split("T")[0],
					description: "Pago 3",
					reference: "F001-00003333",
					type: "CREDIT",
					amount: "3000.00",
					isReconciled: false,
					importedFrom: "TEST",
					createdAt: new Date(),
				})
				.returning();

			ctx.addTransaction(tx1.id);
			ctx.addTransaction(tx2.id);
			ctx.addTransaction(tx3.id);

			// Run auto-reconcile
			const result = await reconciliationService.autoReconcile(
				ctx.companyId,
				account.id,
			);

			// All 3 should be reconciled
			expect(result.reconciledCount).toBe(3);

			// Verify each transaction
			const [reconciledTx1] = await db
				.select()
				.from(bankTransactions)
				.where(eq(bankTransactions.id, tx1.id));
			expect(reconciledTx1.isReconciled).toBe(true);
			expect(reconciledTx1.invoiceId).toBe(inv1.id);

			const [reconciledTx2] = await db
				.select()
				.from(bankTransactions)
				.where(eq(bankTransactions.id, tx2.id));
			expect(reconciledTx2.isReconciled).toBe(true);
			expect(reconciledTx2.invoiceId).toBe(inv2.id);

			const [reconciledTx3] = await db
				.select()
				.from(bankTransactions)
				.where(eq(bankTransactions.id, tx3.id));
			expect(reconciledTx3.isReconciled).toBe(true);
			expect(reconciledTx3.invoiceId).toBe(inv3.id);
		});
	});
});
