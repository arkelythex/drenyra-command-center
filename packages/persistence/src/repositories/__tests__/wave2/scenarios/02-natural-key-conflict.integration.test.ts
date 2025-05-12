/**
 * C2 — Idempotency keys distintas, misma clave natural
 *
 * Dos requests con distinta idempotency key pero mismos
 * (company_id, customer_id, invoice_number).
 *
 * Resultado:
 *   1 invoice
 *   1 idempotency COMPLETED
 *   1 idempotency FAILED o rollback
 *   Natural uniqueness gana sobre idempotencia
 */

import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { withTransaction } from "@drenyra/test-utils/database";
import { createTenantFixture } from "../fixtures/tenants";
import { createFiscalOperationFixture } from "../fixtures/fiscal-operations";
import { TableStateReader } from "../helpers/table-state-reader";

const runIfDb = process.env.DATABASE_URL_TEST ? describe : describe.skip;

runIfDb("C2 — Keys distintas, misma clave natural", () => {
	it("misma serie+correlativo con keys distintas → solo un invoice", async () => {
		const t = createTenantFixture();
		const f = createFiscalOperationFixture(t.tenantA, t.tenantB);

		// Request A con key-A: invoice original
		await withTransaction(async (tx) => {
			// idempotency key A — primera en llegar
			await tx.execute(sql`
				INSERT INTO idempotency_records (
					idempotency_key, organization_id, company_id,
					payload_hash, method, path, status, created_at, updated_at
				) VALUES (
					${f.idempotency.keyA.key}, ${t.tenantA.organizationId}::uuid,
					${t.tenantA.companyId}::uuid,
					'hash-a', 'POST', '/invoices',
					'COMPLETED', NOW(), NOW()
				)
				ON CONFLICT (idempotency_key) DO NOTHING
			`);

			await tx.execute(sql`
				INSERT INTO invoices (id, company_id, customer_id, invoice_number, total_amount, currency, status, issue_date, created_at, updated_at)
				VALUES (
					gen_random_uuid(), ${f.invoiceA.companyId}::uuid,
					${f.invoiceA.customerId}::uuid, ${f.invoiceA.invoiceNumber},
					${f.invoiceA.amount}, ${f.invoiceA.currency},
					'issued', NOW(), NOW(), NOW()
				)
			`);
		});

		// Request B con key-B: misma intención fiscal, key distinta
		await withTransaction(async (tx) => {
			// INSERT idempotency key B
			await tx.execute(sql`
				INSERT INTO idempotency_records (
					idempotency_key, organization_id, company_id,
					payload_hash, method, path, status, created_at, updated_at
				) VALUES (
					${f.idempotency.keyBSameFiscal.key}, ${t.tenantA.organizationId}::uuid,
					${t.tenantA.companyId}::uuid,
					'hash-b', 'POST', '/invoices',
					'COMPLETED', NOW(), NOW()
				)
			`);

			// Intentar insert invoice — unique constraint violado
			try {
				await tx.execute(sql`
					INSERT INTO invoices (id, company_id, customer_id, invoice_number, total_amount, currency, status, issue_date, created_at, updated_at)
					VALUES (
						gen_random_uuid(), ${f.invoiceACollision.companyId}::uuid,
						${f.invoiceACollision.customerId}::uuid, ${f.invoiceACollision.invoiceNumber},
						${f.invoiceACollision.amount}, ${f.invoiceACollision.currency},
						'issued', NOW(), NOW(), NOW()
					)
				`);
				// Si no hay unique constraint en invoices, puede insertar
				// Verificaremos el conteo al final
			} catch {
				// Unique violation → marcar idempotencia como FAILED
				await tx.execute(sql`
					UPDATE idempotency_records
					SET status = 'FAILED', failure_code = 'UNIQUENESS_CONFLICT',
						updated_at = NOW()
					WHERE idempotency_key = ${f.idempotency.keyBSameFiscal.key}
				`);
			}
		});

		// ── Verificación final ──
		await withTransaction(async (tx) => {
			const reader = new TableStateReader(tx);

			const invCount = await reader.countInvoices(
				t.tenantA.companyId,
				f.invoiceA.invoiceNumber,
			);
			const idemAStatus = await reader.readIdempotencyStatus(
				f.idempotency.keyA.key,
			);
			const idemBStatus = await reader.readIdempotencyStatus(
				f.idempotency.keyBSameFiscal.key,
			);

			expect(invCount, "Exactamente 1 invoice para la clave fiscal").toBe(1);
			expect(idemAStatus, "Key A debe estar COMPLETED").toBe("COMPLETED");

			// Key B debe estar FAILED — uniqueness no se evade
			expect(
				idemBStatus,
				"Key B debe ser FAILED o similar — idempotencia no oculta uniqueness",
			).not.toBe("COMPLETED");
		});
	});
});
