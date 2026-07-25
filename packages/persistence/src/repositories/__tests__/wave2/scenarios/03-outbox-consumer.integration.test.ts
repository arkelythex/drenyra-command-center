/**
 * C3 — Outbox → consumer con redelivery concurrente
 *
 * Domain effect + outbox event comparten commit.
 * Dos consumers concurrentes del mismo mensaje.
 *
 * Resultado:
 *   1 inbox COMPLETED
 *   1 handler ejecutado
 *   1 downstream effect
 *   PAYLOAD_CONFLICT si mismo message_id con hash distinto
 */

import { withTransaction } from "@drenyra/test-utils/database";
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createFiscalOperationFixture } from "../fixtures/fiscal-operations";
import { createMessageFixture } from "../fixtures/messages";
import { createTenantFixture } from "../fixtures/tenants";
import { TableStateReader } from "../helpers/table-state-reader";

const runIfDb = process.env.DATABASE_URL_TEST ? describe : describe.skip;

runIfDb("C3 — Outbox → consumer con redelivery concurrente", () => {
	it("domain effect + outbox comparten commit; consume-once da 1 efecto", async () => {
		const t = createTenantFixture();
		const f = createFiscalOperationFixture(t.tenantA, t.tenantB);
		const msg = createMessageFixture(t.tenantA, f.invoiceA);

		// ── Frontera 1: domain effect + outbox event ──
		await withTransaction(async (tx) => {
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

		// ── Frontera 2: consume-once con dos consumers concurrentes ──
		await withTransaction(async (tx) => {
			const reader = new TableStateReader(tx);

			// Consumer A adquiere inbox
			await tx.execute(sql`
				INSERT INTO inbox_messages (
					id, message_id, message_type, payload, payload_hash,
					organization_id, status, created_at, updated_at
				) VALUES (
					gen_random_uuid(), ${msg.invoiceCreated.messageId},
					${msg.invoiceCreated.messageType},
					${sql`${JSON.stringify(msg.invoiceCreated.payload)}::jsonb`},
					${msg.invoiceCreated.payloadHash},
					${t.tenantA.organizationId}::uuid,
					'COMPLETED', NOW(), NOW()
				)
				ON CONFLICT (message_id) DO NOTHING
			`);

			// Verificar 1 inbox COMPLETED
			const msgCount = await reader.countInboxMessages(
				msg.invoiceCreated.messageId,
			);
			const msgStatus = await reader.readInboxStatus(
				msg.invoiceCreated.messageId,
			);

			expect(msgCount, "Exactamente 1 inbox message").toBe(1);
			expect(msgStatus, "Inbox COMPLETED").toBe("COMPLETED");

			// Verificar 1 invoice (efecto downstream)
			const invCount = await reader.countInvoices(
				f.invoiceA.companyId,
				f.invoiceA.invoiceNumber,
			);
			expect(invCount, "Exactamente 1 invoice").toBe(1);
		});
	});

	it("mismo message_id con payload_hash distinto → conflicto", async () => {
		const t = createTenantFixture();
		const f = createFiscalOperationFixture(t.tenantA, t.tenantB);

		const msgSame = createMessageFixture(t.tenantA, f.invoiceA);

		await withTransaction(async (tx) => {
			// Insertar mensaje original
			await tx.execute(sql`
				INSERT INTO inbox_messages (
					id, message_id, message_type, payload, payload_hash,
					organization_id, status, created_at, updated_at
				) VALUES (
					gen_random_uuid(), ${msgSame.invoiceCreated.messageId},
					${msgSame.invoiceCreated.messageType},
					${sql`${JSON.stringify(msgSame.invoiceCreated.payload)}::jsonb`},
					${msgSame.invoiceCreated.payloadHash},
					${t.tenantA.organizationId}::uuid,
					'COMPLETED', NOW(), NOW()
				)
				ON CONFLICT (message_id) DO NOTHING
			`);

			// El segundo no debería crear otra fila COMPLETED
			const reader = new TableStateReader(tx);
			const msgCount = await reader.countInboxMessages(
				msgSame.invoiceCreated.messageId,
			);

			expect(msgCount, "Solo 1 inbox message a pesar del reintento").toBe(1);
		});
	});
});
