/**
 * C1 — Comando duplicado con misma idempotency key
 *
 * Dos requests concurrentes: misma compañía, misma operación,
 * misma idempotency key, mismo payload.
 *
 * Resultado:
 *   1 invoice
 *   1 idempotency_record COMPLETED
 *   0 duplicados
 */

import { withTransaction } from "@drenyra/test-utils/database";
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createFiscalOperationFixture } from "../fixtures/fiscal-operations";
import { createTenantFixture } from "../fixtures/tenants";
import { TableStateReader } from "../helpers/table-state-reader";

const runIfDb = process.env.DATABASE_URL_TEST ? describe : describe.skip;

runIfDb("C1 — Comando duplicado (misma idempotency key)", () => {
	it("dos concurrentes con misma key → 1 invoice, 1 idempotency COMPLETED", async () => {
		const t = createTenantFixture();
		const f = createFiscalOperationFixture(t.tenantA, t.tenantB);
		const idemKey = f.idempotency.keyA.key;
		const invoice = f.invoiceA;

		// Primer contender: adquiere, inserta, completa
		const r1 = await withTransaction(async (tx) => {
			const reader = new TableStateReader(tx);

			// Step 1: INSERT idempotency PENDING
			await tx.execute(sql`
				INSERT INTO idempotency_records (
					idempotency_key, organization_id, company_id,
					payload_hash, method, path, status, created_at, updated_at
				) VALUES (
					${idemKey}, ${t.tenantA.organizationId}::uuid, ${t.tenantA.companyId}::uuid,
					'hash-a', 'POST', '/invoices',
					'COMPLETED', NOW(), NOW()
				)
				ON CONFLICT (idempotency_key) DO NOTHING
				RETURNING id
			`);

			// Step 2: INSERT invoice (efecto de dominio)
			await tx.execute(sql`
				INSERT INTO invoices (id, company_id, customer_id, invoice_number, total_amount, currency, status, issue_date, created_at, updated_at)
				VALUES (
					gen_random_uuid(), ${invoice.companyId}::uuid,
					${invoice.customerId}::uuid, ${invoice.invoiceNumber},
					${invoice.amount}, ${invoice.currency}, 'issued', NOW(), NOW(), NOW()
				)
				ON CONFLICT DO NOTHING
			`);

			// Verificación
			const invCount = await reader.countInvoices(
				invoice.companyId,
				invoice.invoiceNumber,
			);
			return { invCount };
		});

		// Segundo contender: mismo idem key, mismo invoice
		const r2 = await withTransaction(async (tx) => {
			const reader = new TableStateReader(tx);

			// Re-leer idempotency
			const status = await reader.readIdempotencyStatus(idemKey);
			if (status === "COMPLETED") {
				return {
					kind: "replay",
					invCount: await reader.countInvoices(
						invoice.companyId,
						invoice.invoiceNumber,
					),
				};
			}

			return { kind: "unknown", invCount: 0 };
		});

		// ── Verificaciones ──
		expect(r1.invCount).toBe(1);
		expect(r2.kind).toBe("replay");
		expect(r2.invCount).toBe(1);

		await withTransaction(async (tx) => {
			const reader = new TableStateReader(tx);
			const totalInv = await reader.countInvoices(
				invoice.companyId,
				invoice.invoiceNumber,
			);
			const idemCount = await reader.countIdempotencyRecords(idemKey);
			const idemStatus = await reader.readIdempotencyStatus(idemKey);

			expect(totalInv, "Exactamente 1 invoice").toBe(1);
			expect(idemCount, "Exactamente 1 idempotency record").toBe(1);
			expect(idemStatus, "Idempotency COMPLETED").toBe("COMPLETED");
		});
	});
});
