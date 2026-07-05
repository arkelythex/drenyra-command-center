import { Money } from "@drenyra/domain";
import { describe, expect, it } from "vitest";
import { serializeInvoice } from "../../api/handlers/invoice-response";
import { Invoice, type InvoiceItem } from "../../domain/invoice.entity";

function createSampleItem(): InvoiceItem {
	return {
		id: "item-1",
		description: "Servicio contable mensual",
		quantity: 1,
		unitPrice: Money.fromAmount(100, "PEN"),
		taxType: "GRAVADO",
		igvRate: 18,
		subtotal: Money.fromAmount(84.75, "PEN"),
		igvAmount: Money.fromAmount(15.25, "PEN"),
		totalAmount: Money.fromAmount(100, "PEN"),
	};
}

describe("serializeInvoice", () => {
	it("includes persisted SUNAT artifacts", () => {
		const invoice = new Invoice(
			"inv-1",
			"company-1",
			"customer-1",
			"F001",
			1,
			"F001-00000001",
			new Date("2026-03-01T00:00:00.000Z"),
			new Date("2026-03-15T00:00:00.000Z"),
			"PEN",
			1,
			[createSampleItem()],
			Money.fromAmount(84.75, "PEN"),
			Money.fromAmount(15.25, "PEN"),
			Money.fromAmount(100, "PEN"),
			Money.fromAmount(100, "PEN"),
			"SENT",
			undefined,
			new Date("2026-03-01T00:00:00.000Z"),
			new Date("2026-03-01T00:00:00.000Z"),
			"https://ose.example.test/cdr/F001-00000001.zip",
			"TKT-2026-000001",
			"ACCEPTED",
		);

		const payload = serializeInvoice(invoice);
		const enrichedPayload = serializeInvoice(invoice, {
			transactionId: "tx-1",
			transactionStatus: "ACCEPTED",
			sunatStatus: "ACCEPTED",
			sunatCode: "0",
			sunatMessage: "CDR aceptado",
		});

		expect(payload).toMatchObject({
			id: "inv-1",
			sunatCdr: "https://ose.example.test/cdr/F001-00000001.zip",
			sunatTicket: "TKT-2026-000001",
			sunatStatus: "ACCEPTED",
		});
		expect(enrichedPayload).toMatchObject({
			transactionId: "tx-1",
			transactionStatus: "ACCEPTED",
			sunatCode: "0",
			sunatMessage: "CDR aceptado",
		});
	});
});
