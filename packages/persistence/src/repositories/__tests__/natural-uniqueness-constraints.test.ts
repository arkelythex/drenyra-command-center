/**
 * W2-04B — Natural Uniqueness Constraint Tests
 *
 * Verifies that each new UNIQUE constraint rejects duplicates
 * while allowing independent records across companies.
 *
 * Requires DATABASE_URL_TEST and migration 0020 applied.
 */

import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { TestDatabase } from "@drenyra/test-utils/database";

const runIfDb = describe;

const C_A = "00000000-0000-0000-0000-0000000000a1";
const C_B = "00000000-0000-0000-0000-0000000000b1";
const PERIOD = "2026-07";

async function withTx<T>(
	fn: (tx: PostgresJsDatabase) => Promise<T>,
): Promise<T> {
	const testDb = new TestDatabase();
	await testDb.setup();
	try {
		const tx =
			(await testDb.beginTransaction()) as unknown as PostgresJsDatabase;
		try {
			return await fn(tx);
		} finally {
			await testDb.rollbackTransaction();
		}
	} finally {
		await testDb.teardown();
	}
}

// ══════════════════════════════════════════════════════════════════════════════
// sire_submissions
// ══════════════════════════════════════════════════════════════════════════════

runIfDb("sire_submissions UNIQUE (company_id, period, ledger_type)", () => {
	it("rejects duplicate (same company, period, ledger)", async () => {
		await withTx(async (tx) => {
			await tx.execute(sql`
				INSERT INTO sire_submissions (company_id, period, ledger_type, payload_format, idempotency_key, provider)
				VALUES (${C_A}, ${PERIOD}, 'ventas', 'txt', 'key-1', 'simulation')
			`);

			await expect(
				tx.execute(sql`
					INSERT INTO sire_submissions (company_id, period, ledger_type, payload_format, idempotency_key, provider)
					VALUES (${C_A}, ${PERIOD}, 'ventas', 'txt', 'key-2', 'simulation')
				`),
			).rejects.toThrow(
				/duplicate key|unique constraint|uq_sire_submissions_period_ledger/,
			);
		});
	});

	it("allows same key across different companies", async () => {
		await withTx(async (tx) => {
			await tx.execute(sql`
				INSERT INTO sire_submissions (company_id, period, ledger_type, payload_format, idempotency_key, provider)
				VALUES (${C_A}, ${PERIOD}, 'ventas', 'txt', 'key-a', 'simulation')
			`);

			await expect(
				tx.execute(sql`
					INSERT INTO sire_submissions (company_id, period, ledger_type, payload_format, idempotency_key, provider)
					VALUES (${C_B}, ${PERIOD}, 'ventas', 'txt', 'key-b', 'simulation')
				`),
			).resolves.toBeDefined();
		});
	});

	it("allows same company, different ledger_type", async () => {
		await withTx(async (tx) => {
			await tx.execute(sql`
				INSERT INTO sire_submissions (company_id, period, ledger_type, payload_format, idempotency_key, provider)
				VALUES (${C_A}, ${PERIOD}, 'ventas', 'txt', 'key-1', 'simulation')
			`);

			await expect(
				tx.execute(sql`
					INSERT INTO sire_submissions (company_id, period, ledger_type, payload_format, idempotency_key, provider)
					VALUES (${C_A}, ${PERIOD}, 'compras', 'txt', 'key-2', 'simulation')
				`),
			).resolves.toBeDefined();
		});
	});
});

// ══════════════════════════════════════════════════════════════════════════════
// journal_entries
// ══════════════════════════════════════════════════════════════════════════════

runIfDb("journal_entries UNIQUE (company_id, period_key, entry_number)", () => {
	it("rejects duplicate (same company, period, entry_number)", async () => {
		await withTx(async (tx) => {
			await tx.execute(sql`
				INSERT INTO journal_entries (id, company_id, entry_number, period_key, date, gloss, status)
				VALUES ('a0000000-0000-0000-0000-000000000001', ${C_A}, 'E-001', ${PERIOD}, NOW(), 'test', 'borrador')
			`);

			await expect(
				tx.execute(sql`
					INSERT INTO journal_entries (id, company_id, entry_number, period_key, date, gloss, status)
					VALUES ('a0000000-0000-0000-0000-000000000002', ${C_A}, 'E-001', ${PERIOD}, NOW(), 'duplicate', 'borrador')
				`),
			).rejects.toThrow(
				/duplicate key|unique constraint|uq_journal_entries_scope_number/,
			);
		});
	});

	it("allows same entry_number in different periods", async () => {
		await withTx(async (tx) => {
			await tx.execute(sql`
				INSERT INTO journal_entries (id, company_id, entry_number, period_key, date, gloss, status)
				VALUES ('b0000000-0000-0000-0000-000000000001', ${C_A}, 'E-001', '2026-06', NOW(), 'test', 'borrador')
			`);

			await expect(
				tx.execute(sql`
					INSERT INTO journal_entries (id, company_id, entry_number, period_key, date, gloss, status)
					VALUES ('b0000000-0000-0000-0000-000000000002', ${C_A}, 'E-001', '2026-07', NOW(), 'different period', 'borrador')
				`),
			).resolves.toBeDefined();
		});
	});
});

// ══════════════════════════════════════════════════════════════════════════════
// invoices
// ══════════════════════════════════════════════════════════════════════════════

runIfDb("invoices UNIQUE (company_id, series, correlative)", () => {
	it("rejects duplicate (same company, series, correlative)", async () => {
		await withTx(async (tx) => {
			await tx.execute(sql`
				INSERT INTO invoices (id, company_id, customer_id, invoice_number, series, correlative, issue_date, due_date, currency, subtotal, igv_amount, total_amount, balance_due)
				VALUES ('c0000000-0000-0000-0000-000000000001', ${C_A}, '00000000-0000-0000-0000-0000000000c1', 'F001-001', 'F001', 1, NOW(), NOW(), 'PEN', 100, 18, 118, 118)
			`);

			await expect(
				tx.execute(sql`
					INSERT INTO invoices (id, company_id, customer_id, invoice_number, series, correlative, issue_date, due_date, currency, subtotal, igv_amount, total_amount, balance_due)
					VALUES ('c0000000-0000-0000-0000-000000000002', ${C_A}, '00000000-0000-0000-0000-0000000000c1', 'F001-001', 'F001', 1, NOW(), NOW(), 'PEN', 100, 18, 118, 118)
				`),
			).rejects.toThrow(
				/duplicate key|unique constraint|uq_invoices_series_correlative/,
			);
		});
	});

	it("allows same series+correlative across companies", async () => {
		await withTx(async (tx) => {
			await tx.execute(sql`
				INSERT INTO invoices (id, company_id, customer_id, invoice_number, series, correlative, issue_date, due_date, currency, subtotal, igv_amount, total_amount, balance_due)
				VALUES ('d0000000-0000-0000-0000-000000000001', ${C_A}, '00000000-0000-0000-0000-0000000000c1', 'F001-001', 'F001', 1, NOW(), NOW(), 'PEN', 100, 18, 118, 118)
			`);

			await expect(
				tx.execute(sql`
					INSERT INTO invoices (id, company_id, customer_id, invoice_number, series, correlative, issue_date, due_date, currency, subtotal, igv_amount, total_amount, balance_due)
					VALUES ('d0000000-0000-0000-0000-000000000002', ${C_B}, '00000000-0000-0000-0000-0000000000c1', 'F001-001', 'F001', 1, NOW(), NOW(), 'PEN', 100, 18, 118, 118)
				`),
			).resolves.toBeDefined();
		});
	});
});

// ══════════════════════════════════════════════════════════════════════════════
// pcge_accounts
// ══════════════════════════════════════════════════════════════════════════════

runIfDb("pcge_accounts UNIQUE (company_id, code)", () => {
	it("rejects duplicate code in same company", async () => {
		await withTx(async (tx) => {
			await tx.execute(sql`
				INSERT INTO pcge_accounts (id, company_id, code, name, level, type)
				VALUES ('e0000000-0000-0000-0000-000000000001', ${C_A}, '101', 'Caja', '1', 'Activo')
			`);

			await expect(
				tx.execute(sql`
					INSERT INTO pcge_accounts (id, company_id, code, name, level, type)
					VALUES ('e0000000-0000-0000-0000-000000000002', ${C_A}, '101', 'Caja duplicada', '1', 'Activo')
				`),
			).rejects.toThrow(
				/duplicate key|unique constraint|uq_pcge_accounts_company_code/,
			);
		});
	});

	it("allows same code across different companies", async () => {
		await withTx(async (tx) => {
			await tx.execute(sql`
				INSERT INTO pcge_accounts (id, company_id, code, name, level, type)
				VALUES ('f0000000-0000-0000-0000-000000000001', ${C_A}, '201', 'Proveedores', '1', 'Pasivo')
			`);

			await expect(
				tx.execute(sql`
					INSERT INTO pcge_accounts (id, company_id, code, name, level, type)
					VALUES ('f0000000-0000-0000-0000-000000000002', ${C_B}, '201', 'Proveedores B', '1', 'Pasivo')
				`),
			).resolves.toBeDefined();
		});
	});
});

// ══════════════════════════════════════════════════════════════════════════════
// bills
// ══════════════════════════════════════════════════════════════════════════════

runIfDb("bills UNIQUE (company_id, vendor_id, bill_number)", () => {
	it("rejects duplicate (same company, vendor, bill_number)", async () => {
		await withTx(async (tx) => {
			await tx.execute(sql`
				INSERT INTO bills (id, company_id, vendor_id, bill_number, issue_date, due_date, currency, subtotal_amount, igv_amount, total_amount)
				VALUES (
					'g0000000-0000-0000-0000-000000000001', ${C_A},
					'00000000-0000-0000-0000-0000000000v1',
					'B001-00123', NOW(), NOW(), 'PEN', 500, 90, 590
				)
			`);

			await expect(
				tx.execute(sql`
					INSERT INTO bills (id, company_id, vendor_id, bill_number, issue_date, due_date, currency, subtotal_amount, igv_amount, total_amount)
					VALUES (
						'g0000000-0000-0000-0000-000000000002', ${C_A},
						'00000000-0000-0000-0000-0000000000v1',
						'B001-00123', NOW(), NOW(), 'PEN', 500, 90, 590
					)
				`),
			).rejects.toThrow(
				/duplicate key|unique constraint|uq_bills_vendor_number/,
			);
		});
	});

	it("allows same bill_number across companies", async () => {
		await withTx(async (tx) => {
			await tx.execute(sql`
				INSERT INTO bills (id, company_id, vendor_id, bill_number, issue_date, due_date, currency, subtotal_amount, igv_amount, total_amount)
				VALUES (
					'h0000000-0000-0000-0000-000000000001', ${C_A},
					'00000000-0000-0000-0000-0000000000v1',
					'B001-00123', NOW(), NOW(), 'PEN', 500, 90, 590
				)
			`);

			await expect(
				tx.execute(sql`
					INSERT INTO bills (id, company_id, vendor_id, bill_number, issue_date, due_date, currency, subtotal_amount, igv_amount, total_amount)
					VALUES (
						'h0000000-0000-0000-0000-000000000002', ${C_B},
						'00000000-0000-0000-0000-0000000000v1',
						'B001-00123', NOW(), NOW(), 'PEN', 500, 90, 590
					)
				`),
			).resolves.toBeDefined();
		});
	});
});

// ══════════════════════════════════════════════════════════════════════════════
// sire_submissions — rectificatoria coexistence
// ══════════════════════════════════════════════════════════════════════════════

runIfDb(
	"sire_submissions rectificatoria — same period different kind allowed",
	() => {
		it("allows original + rectificatoria for same period/ledger", async () => {
			await withTx(async (tx) => {
				await tx.execute(sql`
				INSERT INTO sire_submissions (company_id, period, ledger_type, submission_kind, payload_format, idempotency_key, provider)
				VALUES (${C_A}, ${PERIOD}, 'ventas', 'original', 'key-original', 'simulation')
			`);

				await expect(
					tx.execute(sql`
					INSERT INTO sire_submissions (company_id, period, ledger_type, submission_kind, payload_format, idempotency_key, provider)
					VALUES (${C_A}, ${PERIOD}, 'ventas', 'rectificatoria', 'key-rect', 'simulation')
				`),
				).resolves.toBeDefined();
			});
		});
	},
);

// ══════════════════════════════════════════════════════════════════════════════
// external_references
// ══════════════════════════════════════════════════════════════════════════════

runIfDb("external_references UNIQUE (company_id, source, external_id)", () => {
	it("rejects duplicate (same company, source, external_id)", async () => {
		await withTx(async (tx) => {
			await tx.execute(sql`
				INSERT INTO external_references (company_id, source, external_id, entity_type, entity_id)
				VALUES (${C_A}, 'sunat_cdr', 'CDR-001', 'invoice', 'i0000000-0000-0000-0000-000000000001')
			`);

			await expect(
				tx.execute(sql`
					INSERT INTO external_references (company_id, source, external_id, entity_type, entity_id)
					VALUES (${C_A}, 'sunat_cdr', 'CDR-001', 'invoice', 'i0000000-0000-0000-0000-000000000002')
				`),
			).rejects.toThrow(
				/duplicate key|unique constraint|uq_external_refs_scope_source_id/,
			);
		});
	});

	it("allows same external_id across companies", async () => {
		await withTx(async (tx) => {
			await tx.execute(sql`
				INSERT INTO external_references (company_id, source, external_id, entity_type, entity_id)
				VALUES (${C_A}, 'sunat_cdr', 'CDR-002', 'invoice', 'j0000000-0000-0000-0000-000000000001')
			`);

			await expect(
				tx.execute(sql`
					INSERT INTO external_references (company_id, source, external_id, entity_type, entity_id)
					VALUES (${C_B}, 'sunat_cdr', 'CDR-002', 'invoice', 'j0000000-0000-0000-0000-000000000002')
				`),
			).resolves.toBeDefined();
		});
	});
});
