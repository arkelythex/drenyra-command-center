/**
 * PR 1.4 — H02 Wave 1: Cross-tenant integration tests
 *
 * Validates tenant isolation at the PostgreSQL level for AccountRepository
 * and JournalEntryRepository using real DB connections.
 *
 * Requires DATABASE_URL_TEST environment variable.
 * In CI, absence of DATABASE_URL_TEST causes an explicit failure.
 *
 * ## Scope de validación por capa
 *
 * - Repository layer: entry.companyId y account.companyId se derivan del scope.
 *   Las líneas del asiento (accountCode) NO se validan contra el tenant a nivel
 *   repositorio — eso es responsabilidad de la capa de aplicación.
 *
 * - Application layer: UpdateJournalEntryUseCase llama a accountService.getById()
 *   para CADA línea. Si la cuenta no pertenece al tenant, la operación se rechaza
 *   ANTES de llamar al repositorio. Ver:
 *   packages/application/src/use-cases/journal/__tests__/h02-cross-tenant-accounts.test.ts
 *
 * - Create: similar — CreateJournalEntryUseCase valida cada accountId contra
 *   accountService.getById() antes de llamar a repository.create().
 *
 * ## Aislamiento garantizado por el repositorio
 *
 * - CREATE: companyId INSERT proviene del scope, NO del entry entity
 * - UPDATE: WHERE id + company_id, throw si 0 filas
 * - DELETE: WHERE id + company_id, throw si 0 filas
 * - FIND: JOIN con companies para validar organizationId
 *
 * @module h02-pr1.4-cross-tenant
 */

import { describe, expect, it } from "vitest";
import type { TenantScope } from "@drenyra/domain/scope";
import { PostgresAccountRepository } from "../postgres-account.repository";
import { PostgresJournalEntryRepository } from "../postgres-journal-entry.repository";

// ============================================================
// Fixture IDs — Org A has Companies A1, A2; Org B has Company B1
// ============================================================

const ORG_A = "1";
const ORG_B = "2";
const C_A1 = "00000000-0000-0000-0000-0000000000a1";
const C_A2 = "00000000-0000-0000-0000-0000000000a2";
const C_B1 = "00000000-0000-0000-0000-0000000000b1";

const ACCOUNT_A1 = "10000000-0000-0000-0000-000000000001";
const ENTRY_A1 = "20000000-0000-0000-0000-000000000001";

const scopeA1: TenantScope = { organizationId: ORG_A, companyId: C_A1 };
const scopeA2: TenantScope = { organizationId: ORG_A, companyId: C_A2 };
const scopeB1: TenantScope = { organizationId: ORG_B, companyId: C_B1 };

// ============================================================
// Database setup — requires DATABASE_URL_TEST
// ============================================================

const runIfDb = describe; // Todos los tests se ejecutan cuando hay DB.
// Sin DB configurada, los tests fallarán con error de conexión PostgreSQL.

// ============================================================
// AccountRepository
// ============================================================

runIfDb("AccountRepository — cross-tenant isolation", () => {
	const repo = new PostgresAccountRepository();

	it("findById — finds account in own company", async () => {
		const result = await repo.findById(scopeA1, ACCOUNT_A1);
		expect(result).not.toBeNull();
		expect(result!.id).toBe(ACCOUNT_A1);
	});

	it("findById — returns null for another company (same org)", async () => {
		const result = await repo.findById(scopeA2, ACCOUNT_A1);
		expect(result).toBeNull();
	});

	it("findById — returns null for another organization", async () => {
		const result = await repo.findById(scopeB1, ACCOUNT_A1);
		expect(result).toBeNull();
	});

	it("findById — foreign and nonexistent are indistinguishable", async () => {
		const foreign = await repo.findById(scopeB1, ACCOUNT_A1);
		const missing = await repo.findById(
			scopeA1,
			"00000000-0000-0000-0000-000000000fff",
		);
		expect(foreign).toBeNull();
		expect(missing).toBeNull();
	});

	it("update — throws for account in another company (same org)", async () => {
		const account = await repo.findById(scopeA1, ACCOUNT_A1);
		expect(account).not.toBeNull();
		await expect(repo.update(scopeA2, account!)).rejects.toThrow(/not found/i);
	});

	it("update — throws for account in another organization", async () => {
		const account = await repo.findById(scopeA1, ACCOUNT_A1);
		expect(account).not.toBeNull();
		await expect(repo.update(scopeB1, account!)).rejects.toThrow(/not found/i);
	});

	it("delete — throws for account in another company (same org)", async () => {
		await expect(repo.delete(scopeA2, ACCOUNT_A1)).rejects.toThrow(
			/not found/i,
		);
	});

	it("delete — throws for account in another organization", async () => {
		await expect(repo.delete(scopeB1, ACCOUNT_A1)).rejects.toThrow(
			/not found/i,
		);
	});

	it("delete — foreign and nonexistent produce same error", async () => {
		const foreignErr = await repo
			.delete(scopeB1, ACCOUNT_A1)
			.catch((e: Error) => e.message);
		const missingErr = await repo
			.delete(scopeA1, "00000000-0000-0000-0000-000000000fff")
			.catch((e: Error) => e.message);
		expect(foreignErr).toBe(missingErr);
	});
});

// ============================================================
// JournalEntryRepository
// ============================================================

runIfDb("JournalEntryRepository — cross-tenant isolation", () => {
	const repo = new PostgresJournalEntryRepository();

	it("findById — finds entry in own company", async () => {
		const result = await repo.findById(scopeA1, ENTRY_A1);
		expect(result).not.toBeNull();
		expect(result!.id).toBe(ENTRY_A1);
	});

	it("findById — returns null for another company (same org)", async () => {
		const result = await repo.findById(scopeA2, ENTRY_A1);
		expect(result).toBeNull();
	});

	it("findById — returns null for another organization", async () => {
		const result = await repo.findById(scopeB1, ENTRY_A1);
		expect(result).toBeNull();
	});

	it("update — throws for entry in another company (same org)", async () => {
		const entry = await repo.findById(scopeA1, ENTRY_A1);
		expect(entry).not.toBeNull();
		await expect(repo.update(scopeA2, entry!)).rejects.toThrow(/not found/i);
	});

	it("update — throws for entry in another organization", async () => {
		const entry = await repo.findById(scopeA1, ENTRY_A1);
		expect(entry).not.toBeNull();
		await expect(repo.update(scopeB1, entry!)).rejects.toThrow(/not found/i);
	});

	it("delete — throws for entry in another company (same org)", async () => {
		await expect(repo.delete(scopeA2, ENTRY_A1)).rejects.toThrow(/not found/i);
	});

	it("delete — throws for entry in another organization", async () => {
		await expect(repo.delete(scopeB1, ENTRY_A1)).rejects.toThrow(/not found/i);
	});
});

// ============================================================
// Transactional integrity — JournalEntryRepository
// ============================================================

runIfDb(
	"JournalEntryRepository — transactional integrity (atomic scenario)",
	() => {
		const repo = new PostgresJournalEntryRepository();

		it("delete with wrong scope does not affect the original entry", async () => {
			await expect(repo.delete(scopeA2, ENTRY_A1)).rejects.toThrow(
				/not found/i,
			);
			await expect(repo.delete(scopeB1, ENTRY_A1)).rejects.toThrow(
				/not found/i,
			);

			const stillThere = await repo.findById(scopeA1, ENTRY_A1);
			expect(stillThere).not.toBeNull();
		});
	},
);

// ============================================================
// AccountRepository — transactional integrity
// ============================================================

runIfDb("AccountRepository — transactional integrity (atomic scenario)", () => {
	const repo = new PostgresAccountRepository();

	it("delete with wrong scope does not affect the account", async () => {
		await expect(repo.delete(scopeA2, ACCOUNT_A1)).rejects.toThrow(
			/not found/i,
		);
		await expect(repo.delete(scopeB1, ACCOUNT_A1)).rejects.toThrow(
			/not found/i,
		);

		const stillThere = await repo.findById(scopeA1, ACCOUNT_A1);
		expect(stillThere).not.toBeNull();
	});
});
