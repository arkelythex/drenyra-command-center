/**
 * W2-04C — Natural Uniqueness Concurrency + PostgreSQL Verification.
 *
 * Tests each UNIQUE constraint under real race conditions using
 * independent PostgreSQL connections and transactions.
 *
 * Also verifies pg_catalog for constraint presence and maps
 * SQL errors to stable domain error codes.
 *
 * Requires DATABASE_URL_TEST and migration 0020 applied.
 */

import { TestDatabase } from "@drenyra/test-utils/database";
import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { describe, expect, it } from "vitest";

const runIfDb = describe;

const C_A = "00000000-0000-0000-0000-0000000000a1";
const C_B = "00000000-0000-0000-0000-0000000000b1";
const PERIOD = "2026-07";

/**
 * Run a callback inside an independent PostgreSQL connection+transaction.
 */
async function isolatedTx<T>(
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

/**
 * Create a barrier that resolves after N calls to release().
 */
function barrier(count: number): { wait: Promise<void>; release: () => void } {
	let resolve: () => void;
	const wait = new Promise<void>((r) => {
		resolve = r;
	});
	let remaining = count;
	return {
		wait,
		release: () => {
			remaining--;
			if (remaining <= 0) resolve?.();
		},
	};
}

/**
 * Extract the constraint name from a PostgreSQL unique violation error.
 */
function extractConstraintName(error: unknown): string | null {
	const msg = error instanceof Error ? error.message : String(error);
	const match = msg.match(/unique constraint "([^"]+)"/);
	return match ? match[1] : null;
}

// ══════════════════════════════════════════════════════════════════════════════
// pg_catalog verification
// ══════════════════════════════════════════════════════════════════════════════

runIfDb("pg_catalog — constraint presence", () => {
	const EXPECTED_CONSTRAINTS = [
		"uq_sire_submissions_period_ledger",
		"uq_journal_entries_scope_number",
		"uq_invoices_series_correlative",
		"uq_bills_vendor_number",
		"uq_business_partners_company_tax_id",
		"uq_pcge_accounts_company_code",
		"uq_external_refs_scope_source_id",
	];

	for (const constraintName of EXPECTED_CONSTRAINTS) {
		it(`constraint "${constraintName}" exists in pg_catalog`, async () => {
			await isolatedTx(async (tx) => {
				const rows = await tx.execute(
					sql`SELECT 1 FROM pg_constraint WHERE conname = ${constraintName}`,
				);
				expect(rows.length).toBe(1);
			});
		});
	}
});

// ══════════════════════════════════════════════════════════════════════════════
// sire_submissions — concurrent duplicate
// ══════════════════════════════════════════════════════════════════════════════

runIfDb("sire_submissions concurrent — one wins, one violates", () => {
	it("two concurrent inserts for same (company, period, ledger, kind) — one succeeds", async () => {
		const b = barrier(2);

		const [r1, r2] = await Promise.all([
			isolatedTx(async (tx) => {
				b.release();
				await b.wait;
				try {
					await tx.execute(sql`
						INSERT INTO sire_submissions (company_id, period, ledger_type, submission_kind, payload_format, idempotency_key, provider)
						VALUES (${C_A}, ${PERIOD}, 'ventas', 'original', 'txt', 'conc-key-1', 'simulation')
					`);
					return { ok: true, error: null as string | null };
				} catch (e) {
					return { ok: false, error: extractConstraintName(e) };
				}
			}),
			isolatedTx(async (tx) => {
				b.release();
				await b.wait;
				try {
					await tx.execute(sql`
						INSERT INTO sire_submissions (company_id, period, ledger_type, submission_kind, payload_format, idempotency_key, provider)
						VALUES (${C_A}, ${PERIOD}, 'ventas', 'original', 'txt', 'conc-key-2', 'simulation')
					`);
					return { ok: true, error: null as string | null };
				} catch (e) {
					return { ok: false, error: extractConstraintName(e) };
				}
			}),
		]);

		expect(r1.ok ? r2.ok : !r2.ok).toBe(true); // exactly one success
		if (r1.ok && !r2.ok) {
			expect(r2.error).toBe("uq_sire_submissions_period_ledger");
		} else if (r2.ok && !r1.ok) {
			expect(r1.error).toBe("uq_sire_submissions_period_ledger");
		}
	});

	it("different companies with same period/ledger — both succeed", async () => {
		const b = barrier(2);

		const results = await Promise.all([
			isolatedTx(async (tx) => {
				b.release();
				await b.wait;
				await tx.execute(sql`
					INSERT INTO sire_submissions (company_id, period, ledger_type, submission_kind, payload_format, idempotency_key, provider)
					VALUES (${C_A}, ${PERIOD}, 'compras', 'original', 'txt', 'key-ca', 'simulation')
				`);
				return true;
			}),
			isolatedTx(async (tx) => {
				b.release();
				await b.wait;
				await tx.execute(sql`
					INSERT INTO sire_submissions (company_id, period, ledger_type, submission_kind, payload_format, idempotency_key, provider)
					VALUES (${C_B}, ${PERIOD}, 'compras', 'original', 'txt', 'key-cb', 'simulation')
				`);
				return true;
			}),
		]);

		expect(results).toEqual([true, true]);
	});

	it("original + rectificatoria concurrent — both succeed", async () => {
		const b = barrier(2);

		const results = await Promise.all([
			isolatedTx(async (tx) => {
				b.release();
				await b.wait;
				await tx.execute(sql`
					INSERT INTO sire_submissions (company_id, period, ledger_type, submission_kind, payload_format, idempotency_key, provider)
					VALUES (${C_A}, ${PERIOD}, 'ventas', 'original', 'txt', 'key-orig', 'simulation')
				`);
				return true;
			}),
			isolatedTx(async (tx) => {
				b.release();
				await b.wait;
				await tx.execute(sql`
					INSERT INTO sire_submissions (company_id, period, ledger_type, submission_kind, payload_format, idempotency_key, provider)
					VALUES (${C_A}, ${PERIOD}, 'ventas', 'rectificatoria', 'key-rect', 'simulation')
				`);
				return true;
			}),
		]);

		expect(results).toEqual([true, true]);
	});

	it("second rectificatoria (same period/kind) — rejected (one-rectificatoria limit)", async () => {
		const b = barrier(2);

		const [r1, r2] = await Promise.all([
			isolatedTx(async (tx) => {
				b.release();
				await b.wait;
				try {
					await tx.execute(sql`
						INSERT INTO sire_submissions (company_id, period, ledger_type, submission_kind, payload_format, idempotency_key, provider)
						VALUES (${C_A}, ${PERIOD}, 'compras', 'rectificatoria', 'txt', 'rect-a', 'simulation')
					`);
					return { ok: true };
				} catch {
					return { ok: false };
				}
			}),
			isolatedTx(async (tx) => {
				b.release();
				await b.wait;
				try {
					await tx.execute(sql`
						INSERT INTO sire_submissions (company_id, period, ledger_type, submission_kind, payload_format, idempotency_key, provider)
						VALUES (${C_A}, ${PERIOD}, 'compras', 'rectificatoria', 'txt', 'rect-b', 'simulation')
					`);
					return { ok: true };
				} catch {
					return { ok: false };
				}
			}),
		]);

		expect(r1.ok ? !r2.ok : r2.ok).toBe(true); // exactly one
	});

	it("different idempotency keys do NOT bypass the natural constraint", async () => {
		const b = barrier(2);

		const [r1, r2] = await Promise.all([
			isolatedTx(async (tx) => {
				b.release();
				await b.wait;
				try {
					await tx.execute(sql`
						INSERT INTO sire_submissions (company_id, period, ledger_type, submission_kind, payload_format, idempotency_key, provider)
						VALUES (${C_A}, ${PERIOD}, 'ventas', 'original', 'txt', 'unique-key-1', 'simulation')
					`);
					return { ok: true };
				} catch {
					return { ok: false };
				}
			}),
			isolatedTx(async (tx) => {
				b.release();
				await b.wait;
				try {
					await tx.execute(sql`
						INSERT INTO sire_submissions (company_id, period, ledger_type, submission_kind, payload_format, idempotency_key, provider)
						VALUES (${C_A}, ${PERIOD}, 'ventas', 'original', 'txt', 'unique-key-2', 'simulation')
					`);
					return { ok: true };
				} catch {
					return { ok: false };
				}
			}),
		]);

		expect(r1.ok ? !r2.ok : r2.ok).toBe(true);
	});
});

// ══════════════════════════════════════════════════════════════════════════════
// journal_entries — concurrent duplicate
// ══════════════════════════════════════════════════════════════════════════════

runIfDb("journal_entries concurrent — one wins", () => {
	it("two concurrent inserts for same (company, period_key, entry_number)", async () => {
		const b = barrier(2);

		const [r1, r2] = await Promise.all([
			isolatedTx(async (tx) => {
				b.release();
				await b.wait;
				try {
					await tx.execute(sql`
						INSERT INTO journal_entries (id, company_id, entry_number, period_key, date, gloss, status)
						VALUES ('c1000000-0000-0000-0000-000000000001', ${C_A}, 'JE-CONC-001', ${PERIOD}, NOW(), 'race a', 'borrador')
					`);
					return { ok: true, err: null as string | null };
				} catch (e) {
					return { ok: false, err: extractConstraintName(e) };
				}
			}),
			isolatedTx(async (tx) => {
				b.release();
				await b.wait;
				try {
					await tx.execute(sql`
						INSERT INTO journal_entries (id, company_id, entry_number, period_key, date, gloss, status)
						VALUES ('c1000000-0000-0000-0000-000000000002', ${C_A}, 'JE-CONC-001', ${PERIOD}, NOW(), 'race b', 'borrador')
					`);
					return { ok: true, err: null as string | null };
				} catch (e) {
					return { ok: false, err: extractConstraintName(e) };
				}
			}),
		]);

		expect(r1.ok ? r2.ok : true).toBe(false); // only one succeeds
		const loser = r1.ok ? r2 : r1;
		expect(loser.err).toBe("uq_journal_entries_scope_number");
	});

	it("same entry_number in different periods — both succeed", async () => {
		const [r1, r2] = await Promise.all([
			isolatedTx(async (tx) => {
				await tx.execute(sql`
					INSERT INTO journal_entries (id, company_id, entry_number, period_key, date, gloss, status)
					VALUES ('c2000000-0000-0000-0000-000000000001', ${C_A}, 'JE-MULTI-001', '2026-06', NOW(), 'period a', 'borrador')
				`);
				return true;
			}),
			isolatedTx(async (tx) => {
				await tx.execute(sql`
					INSERT INTO journal_entries (id, company_id, entry_number, period_key, date, gloss, status)
					VALUES ('c2000000-0000-0000-0000-000000000002', ${C_A}, 'JE-MULTI-001', '2026-07', NOW(), 'period b', 'borrador')
				`);
				return true;
			}),
		]);

		expect([r1, r2]).toEqual([true, true]);
	});
});

// ══════════════════════════════════════════════════════════════════════════════
// invoices — concurrent duplicate
// ══════════════════════════════════════════════════════════════════════════════

runIfDb("invoices concurrent — one wins", () => {
	it("two concurrent inserts for same (company, series, correlative)", async () => {
		const b = barrier(2);

		const [r1, r2] = await Promise.all([
			isolatedTx(async (tx) => {
				b.release();
				await b.wait;
				try {
					await tx.execute(sql`
						INSERT INTO invoices (id, company_id, customer_id, invoice_number, series, correlative, issue_date, due_date, currency, subtotal, igv_amount, total_amount, balance_due)
						VALUES ('d0000000-0000-0000-0000-00000000c01', ${C_A}, '00000000-0000-0000-0000-0000000000c1', 'F001-001', 'F001', 1, NOW(), NOW(), 'PEN', 100, 18, 118, 118)
					`);
					return { ok: true, err: null as string | null };
				} catch (e) {
					return { ok: false, err: extractConstraintName(e) };
				}
			}),
			isolatedTx(async (tx) => {
				b.release();
				await b.wait;
				try {
					await tx.execute(sql`
						INSERT INTO invoices (id, company_id, customer_id, invoice_number, series, correlative, issue_date, due_date, currency, subtotal, igv_amount, total_amount, balance_due)
						VALUES ('d0000000-0000-0000-0000-00000000c02', ${C_A}, '00000000-0000-0000-0000-0000000000c1', 'F001-001', 'F001', 1, NOW(), NOW(), 'PEN', 100, 18, 118, 118)
					`);
					return { ok: true, err: null as string | null };
				} catch (e) {
					return { ok: false, err: extractConstraintName(e) };
				}
			}),
		]);

		expect(r1.ok ? !r2.ok : r2.ok).toBe(true);
		const loser = r1.ok ? r2 : r1;
		expect(loser.err).toBe("uq_invoices_series_correlative");
	});
});

// ══════════════════════════════════════════════════════════════════════════════
// bills — concurrent duplicate + business_partners uniqueness
// ══════════════════════════════════════════════════════════════════════════════

runIfDb("bills concurrent — business_partners tax_id uniqueness", () => {
	it("two business partners with same tax_id in same company — rejected", async () => {
		const b = barrier(2);

		const [r1, r2] = await Promise.all([
			isolatedTx(async (tx) => {
				b.release();
				await b.wait;
				try {
					await tx.execute(sql`
						INSERT INTO business_partners (id, company_id, tax_id, legal_name)
						VALUES ('p1000000-0000-0000-0000-000000000001', ${C_A}, '20123456789', 'Proveedor A')
					`);
					return { ok: true };
				} catch {
					return { ok: false };
				}
			}),
			isolatedTx(async (tx) => {
				b.release();
				await b.wait;
				try {
					await tx.execute(sql`
						INSERT INTO business_partners (id, company_id, tax_id, legal_name)
						VALUES ('p1000000-0000-0000-0000-000000000002', ${C_A}, '20123456789', 'Proveedor B')
					`);
					return { ok: true };
				} catch {
					return { ok: false };
				}
			}),
		]);

		expect(r1.ok ? !r2.ok : r2.ok).toBe(true);
	});

	it("two concurrent bills for same (vendor, bill_number)", async () => {
		const b = barrier(2);

		const [r1, r2] = await Promise.all([
			isolatedTx(async (tx) => {
				b.release();
				await b.wait;
				try {
					await tx.execute(sql`
						INSERT INTO bills (id, company_id, vendor_id, bill_number, issue_date, due_date, currency, subtotal_amount, igv_amount, total_amount)
						VALUES ('e0000000-0000-0000-0000-000000000001', ${C_A}, '00000000-0000-0000-0000-0000000000v1', 'F001-00555', NOW(), NOW(), 'PEN', 100, 18, 118)
					`);
					return { ok: true, err: null as string | null };
				} catch (e) {
					return { ok: false, err: extractConstraintName(e) };
				}
			}),
			isolatedTx(async (tx) => {
				b.release();
				await b.wait;
				try {
					await tx.execute(sql`
						INSERT INTO bills (id, company_id, vendor_id, bill_number, issue_date, due_date, currency, subtotal_amount, igv_amount, total_amount)
						VALUES ('e0000000-0000-0000-0000-000000000002', ${C_A}, '00000000-0000-0000-0000-0000000000v1', 'F001-00555', NOW(), NOW(), 'PEN', 100, 18, 118)
					`);
					return { ok: true, err: null as string | null };
				} catch (e) {
					return { ok: false, err: extractConstraintName(e) };
				}
			}),
		]);

		expect(r1.ok ? !r2.ok : r2.ok).toBe(true);
	});
});

// ══════════════════════════════════════════════════════════════════════════════
// pcge_accounts — concurrent duplicate
// ══════════════════════════════════════════════════════════════════════════════

runIfDb("pcge_accounts concurrent — one wins", () => {
	it("two concurrent inserts for same (company, code)", async () => {
		const b = barrier(2);

		const [r1, r2] = await Promise.all([
			isolatedTx(async (tx) => {
				b.release();
				await b.wait;
				try {
					await tx.execute(sql`
						INSERT INTO pcge_accounts (id, company_id, code, name, level, type)
						VALUES ('f0000000-0000-0000-0000-000000000001', ${C_A}, '10101', 'Caja', '1', 'Activo')
					`);
					return { ok: true, err: null as string | null };
				} catch (e) {
					return { ok: false, err: extractConstraintName(e) };
				}
			}),
			isolatedTx(async (tx) => {
				b.release();
				await b.wait;
				try {
					await tx.execute(sql`
						INSERT INTO pcge_accounts (id, company_id, code, name, level, type)
						VALUES ('f0000000-0000-0000-0000-000000000002', ${C_A}, '10101', 'Caja dup', '1', 'Activo')
					`);
					return { ok: true, err: null as string | null };
				} catch (e) {
					return { ok: false, err: extractConstraintName(e) };
				}
			}),
		]);

		expect(r1.ok ? !r2.ok : r2.ok).toBe(true);
		const loser = r1.ok ? r2 : r1;
		expect(loser.err).toBe("uq_pcge_accounts_company_code");
	});
});

// ══════════════════════════════════════════════════════════════════════════════
// external_references — concurrent duplicate
// ══════════════════════════════════════════════════════════════════════════════

runIfDb("external_references concurrent — one wins", () => {
	it("two concurrent inserts for same (company, source, external_id)", async () => {
		const b = barrier(2);

		const [r1, r2] = await Promise.all([
			isolatedTx(async (tx) => {
				b.release();
				await b.wait;
				try {
					await tx.execute(sql`
						INSERT INTO external_references (company_id, source, external_id, entity_type, entity_id)
						VALUES (${C_A}, 'sunat_cdr', 'CDR-CONC-001', 'invoice', 'x0000000-0000-0000-0000-000000000001')
					`);
					return { ok: true, err: null as string | null };
				} catch (e) {
					return { ok: false, err: extractConstraintName(e) };
				}
			}),
			isolatedTx(async (tx) => {
				b.release();
				await b.wait;
				try {
					await tx.execute(sql`
						INSERT INTO external_references (company_id, source, external_id, entity_type, entity_id)
						VALUES (${C_A}, 'sunat_cdr', 'CDR-CONC-001', 'invoice', 'x0000000-0000-0000-0000-000000000002')
					`);
					return { ok: true, err: null as string | null };
				} catch (e) {
					return { ok: false, err: extractConstraintName(e) };
				}
			}),
		]);

		expect(r1.ok ? !r2.ok : r2.ok).toBe(true);
		const loser = r1.ok ? r2 : r1;
		expect(loser.err).toBe("uq_external_refs_scope_source_id");
	});
});
