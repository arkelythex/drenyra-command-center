import { Invoice, type InvoiceStatus } from "@drenyra/domain/entities/Invoice";
import { DocumentSeries } from "@drenyra/domain/value-objects/DocumentSeries";
import { Money } from "@drenyra/domain/value-objects/Money";
import { RUC } from "@drenyra/domain/value-objects/RUC";

// Valid UUIDs for testing
export const TEST_IDS = {
	INVOICE_1: "550e8400-e29b-41d4-a716-446655440000",
	INVOICE_2: "550e8400-e29b-41d4-a716-446655440001",
	INVOICE_3: "550e8400-e29b-41d4-a716-446655440002",
	NON_EXISTENT: "550e8400-e29b-41d4-a716-446655449999",
	ITEM_1: "660e8400-e29b-41d4-a716-446655440000",
	ITEM_2: "660e8400-e29b-41d4-a716-446655440001",
} as const;

// Valid RUCs for testing (real SUNAT-valid RUCs)
export const TEST_RUCS = {
	SUNAT: "20131312955",
	BCP: "20100047218",
	COMPANY_1: "20100070970",
} as const;

export function createTestInvoice(
	overrides: Partial<{
		id: string;
		series: string;
		number: number;
		status: InvoiceStatus;
		clientName: string;
		clientRUC: string;
		baseAmount: number;
	}> = {},
): Invoice {
	const baseAmount = overrides.baseAmount ?? 1000;
	const igvAmount = Math.round(baseAmount * 0.18);
	const totalAmount = baseAmount + igvAmount;

	return Invoice.create({
		id: overrides.id ?? TEST_IDS.INVOICE_1,
		series: DocumentSeries.create(overrides.series ?? "F001"),
		number: overrides.number ?? 1,
		issueDate: new Date("2024-01-01"),
		clientName: overrides.clientName ?? "Test Client",
		clientRUC: overrides.clientRUC
			? RUC.create(overrides.clientRUC)
			: RUC.create(TEST_RUCS.COMPANY_1),
		baseAmount: Money.fromAmount(baseAmount, "PEN"),
		igvAmount: Money.fromAmount(igvAmount, "PEN"),
		totalAmount: Money.fromAmount(totalAmount, "PEN"),
		status: overrides.status ?? "DRAFT",
		items: [
			{
				id: TEST_IDS.ITEM_1,
				description: "Product 1",
				quantity: 1,
				unitPrice: Money.fromAmount(baseAmount, "PEN"),
				subtotal: Money.fromAmount(baseAmount, "PEN"),
				igv: Money.fromAmount(igvAmount, "PEN"),
				total: Money.fromAmount(totalAmount, "PEN"),
			},
		],
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
	});
}
