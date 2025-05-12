/**
 * Fiscal operations fixtures — deterministas, inmutables.
 *
 * Proporciona pares preparados para:
 *   - misma clave natural (company_id, customer_id, invoice_number)
 *   - misma clave natural entre compañías (no colisiona)
 *   - invoices con distintos invoice_numbers, vendors, montos
 *   - idempotency keys para escenarios de duplicación y conflicto
 */

import type { TenantScope } from "./tenants";

export interface FiscalOperationFixture {
	companyId: string;
	customerId: string;
	invoiceNumber: string;
	amount: number;
	taxId: string;
	currency: string;
	description: string;
}

export interface IdempotencyPair {
	key: string;
	purpose: "same-intent" | "different-intent" | "same-fiscal-different-key";
}

export interface FiscalOperationsFixture {
	/** Invoice que produce una clave natural única */
	invoiceA: FiscalOperationFixture;
	/** Invoice dentro del mismo tenant A, misma clave natural (colisión) */
	invoiceACollision: FiscalOperationFixture;
	/** Invoice dentro del tenant B, misma clave natural (no colisión por tenant) */
	invoiceBSameNaturalKey: FiscalOperationFixture;
	/** Invoice con datos completamente independientes */
	invoiceC: FiscalOperationFixture;
	/** Pares idempotentes */
	idempotency: {
		keyA: IdempotencyPair;
		keyADuplicate: IdempotencyPair;
		keyB: IdempotencyPair;
		keyBSameFiscal: IdempotencyPair;
	};
}

export function createFiscalOperationFixture(
	tenantA: TenantScope,
	tenantB: TenantScope,
	overrides?: Partial<FiscalOperationsFixture>,
): FiscalOperationsFixture {
	const base: FiscalOperationsFixture = {
		invoiceA: {
			companyId: tenantA.companyId,
			customerId: "00000000-0000-4000-a000-000000000100",
			invoiceNumber: "F001-00001234",
			amount: 1180.0,
			taxId: "20100000001",
			currency: "PEN",
			description: "Test invoice A",
		},
		invoiceACollision: {
			companyId: tenantA.companyId,
			customerId: "00000000-0000-4000-a000-000000000100",
			invoiceNumber: "F001-00001234",
			amount: 1180.0,
			taxId: "20100000001",
			currency: "PEN",
			description: "Duplicate of invoice A for collision testing",
		},
		invoiceBSameNaturalKey: {
			companyId: tenantB.companyId,
			customerId: "00000000-0000-4000-a000-000000000100",
			invoiceNumber: "F001-00001234",
			amount: 1180.0,
			taxId: "20100000001",
			currency: "PEN",
			description: "Invoice with same natural key but different tenant",
		},
		invoiceC: {
			companyId: tenantA.companyId,
			customerId: "00000000-0000-4000-a000-000000000200",
			invoiceNumber: "B001-00005678",
			amount: 590.0,
			taxId: "20300000003",
			currency: "PEN",
			description: "Independent test invoice C",
		},
		idempotency: {
			keyA: { key: "idem-inv-A-001", purpose: "same-intent" },
			keyADuplicate: { key: "idem-inv-A-001", purpose: "same-intent" },
			keyB: { key: "idem-inv-B-001", purpose: "different-intent" },
			keyBSameFiscal: {
				key: "idem-inv-B-002",
				purpose: "same-fiscal-different-key",
			},
		},
	};
	return { ...base, ...overrides };
}
