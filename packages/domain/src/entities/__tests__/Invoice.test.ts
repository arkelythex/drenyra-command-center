/**
 * Unit Tests for Invoice Entity
 */

import { describe, expect, it } from "vitest";
import { InvoiceBuilder } from "../../../../test-utils/src/builders/invoice.builder";
import { DNI } from "../../value-objects/DNI";
import { DocumentSeries } from "../../value-objects/DocumentSeries";
import { Money } from "../../value-objects/Money";
import { RUC } from "../../value-objects/RUC";
import { Invoice, type InvoiceProps } from "../Invoice";

describe("Invoice Entity", () => {
	const createValidInvoiceProps = (): InvoiceProps => {
		const base = Money.fromAmount(1000, "PEN");
		const igv = base.multiply(0.18);
		const total = base.add(igv);

		return {
			id: crypto.randomUUID(),
			series: DocumentSeries.create("F001"),
			number: 1,
			issueDate: new Date("2025-01-15"),
			clientName: "ACME Corp",
			clientRUC: RUC.create("20100070970"),
			baseAmount: base,
			igvAmount: igv,
			totalAmount: total,
			status: "DRAFT",
			items: [
				{
					id: "1",
					description: "Product A",
					quantity: 1,
					unitPrice: base,
					subtotal: base,
					igv: igv,
					total: total,
				},
			],
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	};

	describe("Creation", () => {
		it("should create valid invoice", () => {
			const props = createValidInvoiceProps();
			const invoice = Invoice.create(props);

			expect(invoice.id).toBe(props.id);
			expect(invoice.series.toString()).toBe("F001");
			expect(invoice.number).toBe(1);
		});

		it("should enforce Factura requires RUC rule", () => {
			const props = createValidInvoiceProps();
			delete props.clientRUC;

			expect(() => Invoice.create(props)).toThrow(/Las facturas requieren RUC/);
		});

		it("should allow Boleta without RUC", () => {
			const props = createValidInvoiceProps();
			props.series = DocumentSeries.create("B001");
			delete props.clientRUC;
			props.clientDNI = DNI.create("12345678");

			expect(() => Invoice.create(props)).not.toThrow();
		});

		it("should enforce total = base + IGV rule", () => {
			const props = createValidInvoiceProps();
			props.totalAmount = Money.fromAmount(999, "PEN"); // Wrong total

			expect(() => Invoice.create(props)).toThrow(
				/El total .* debe ser igual a base \+ IGV/,
			);
		});

		it("should enforce items total matches invoice total", () => {
			const props = createValidInvoiceProps();
			props.items[0]!.total = Money.fromAmount(999, "PEN"); // Mismatched item total

			expect(() => Invoice.create(props)).toThrow(
				/La suma de items .* no coincide con el total/,
			);
		});

		it("should reject future issue dates", () => {
			const props = createValidInvoiceProps();
			props.issueDate = new Date("2099-12-31");

			expect(() => Invoice.create(props)).toThrow(
				/La fecha de emisión no puede ser futura/,
			);
		});

		it("should reject due date before issue date", () => {
			const props = createValidInvoiceProps();
			props.issueDate = new Date("2025-01-15");
			props.dueDate = new Date("2025-01-14"); // Before issue date

			expect(() => Invoice.create(props)).toThrow(
				/La fecha de vencimiento debe ser posterior/,
			);
		});

		it("should reject zero or negative invoice numbers", () => {
			const props = createValidInvoiceProps();
			props.number = 0;

			expect(() => Invoice.create(props)).toThrow(
				/El número de factura debe ser positivo/,
			);
		});

		it("should reject invoices without items", () => {
			const props = createValidInvoiceProps();
			props.items = [];

			expect(() => Invoice.create(props)).toThrow(
				/La factura debe tener al menos un item/,
			);
		});
	});

	describe("Full Number Formatting", () => {
		it("should format full invoice number correctly", () => {
			const props = createValidInvoiceProps();
			props.number = 1234;
			const invoice = Invoice.create(props);

			expect(invoice.getFullNumber()).toBe("F001-00001234");
		});

		it("should pad number with leading zeros", () => {
			const props = createValidInvoiceProps();
			props.number = 1;
			const invoice = Invoice.create(props);

			expect(invoice.getFullNumber()).toBe("F001-00000001");
		});
	});

	describe("Status Transitions", () => {
		it("should support PENDING to SENT to ACCEPTED lifecycle using test builder", () => {
			const invoice = new InvoiceBuilder().withStatus("PENDING").build();

			const sentInvoice = invoice.markAsSent("CDR-0");
			const acceptedInvoice = sentInvoice.markAsAccepted();

			expect(invoice.status).toBe("PENDING");
			expect(sentInvoice.status).toBe("SENT");
			expect(acceptedInvoice.status).toBe("ACCEPTED");
		});

		it("should support PENDING to SENT to REJECTED lifecycle using test builder", () => {
			const invoice = new InvoiceBuilder().withStatus("PENDING").build();

			const sentInvoice = invoice.markAsSent("CDR-2000");
			const rejectedInvoice = sentInvoice.markAsRejected("SUNAT rejected CPE");

			expect(rejectedInvoice.status).toBe("REJECTED");
			expect(rejectedInvoice.notes).toBe("SUNAT rejected CPE");
		});

		it("should reject direct DRAFT to ACCEPTED lifecycle transitions", () => {
			const invoice = new InvoiceBuilder().withStatus("DRAFT").build();

			expect(() => invoice.markAsAccepted()).toThrow(
				/Solo se pueden aceptar facturas en estado SENT/,
			);
		});

		it("should cancel invoices that have not been sent to SUNAT", () => {
			const invoice = new InvoiceBuilder().withStatus("PENDING").build();

			const cancelledInvoice = invoice.cancel();

			expect(cancelledInvoice.status).toBe("CANCELLED");
		});

		it("should reject cancellation after SUNAT acceptance", () => {
			const invoice = new InvoiceBuilder().withStatus("SENT").build().markAsAccepted();

			expect(() => invoice.cancel()).toThrow(
				/No se pueden cancelar facturas enviadas a SUNAT/,
			);
		});

		it("should mark invoice as sent to SUNAT", () => {
			const props = createValidInvoiceProps();
			props.status = "PENDING";
			const invoice = Invoice.create(props);

			const sentInvoice = invoice.markAsSent("CDR-12345");

			expect(sentInvoice.status).toBe("SENT");
			expect(sentInvoice.sentToSunatAt).toBeDefined();
		});

		it("should only allow sending PENDING invoices", () => {
			const props = createValidInvoiceProps();
			props.status = "DRAFT";
			const invoice = Invoice.create(props);

			expect(() => invoice.markAsSent("CDR-12345")).toThrow(
				/Solo se pueden enviar facturas en estado PENDING/,
			);
		});

		it("should mark invoice as accepted", () => {
			const props = createValidInvoiceProps();
			props.status = "SENT";
			const invoice = Invoice.create(props);

			const acceptedInvoice = invoice.markAsAccepted();

			expect(acceptedInvoice.status).toBe("ACCEPTED");
		});

		it("should only allow accepting SENT invoices", () => {
			const props = createValidInvoiceProps();
			props.status = "PENDING";
			const invoice = Invoice.create(props);

			expect(() => invoice.markAsAccepted()).toThrow(
				/Solo se pueden aceptar facturas en estado SENT/,
			);
		});

		it("should mark invoice as rejected with reason", () => {
			const props = createValidInvoiceProps();
			props.status = "SENT";
			const invoice = Invoice.create(props);

			const rejectedInvoice = invoice.markAsRejected("Invalid RUC");

			expect(rejectedInvoice.status).toBe("REJECTED");
			expect(rejectedInvoice.notes).toBe("Invalid RUC");
		});

		it("should cancel draft invoices", () => {
			const props = createValidInvoiceProps();
			props.status = "DRAFT";
			const invoice = Invoice.create(props);

			const cancelledInvoice = invoice.cancel();

			expect(cancelledInvoice.status).toBe("CANCELLED");
		});

		it("should not allow cancelling sent/accepted invoices", () => {
			const props = createValidInvoiceProps();
			props.status = "SENT";
			const invoice = Invoice.create(props);

			expect(() => invoice.cancel()).toThrow(
				/No se pueden cancelar facturas enviadas a SUNAT/,
			);
		});
	});

	describe("Modification Rules", () => {
		it("should allow modifying DRAFT invoices", () => {
			const props = createValidInvoiceProps();
			props.status = "DRAFT";
			const invoice = Invoice.create(props);

			expect(invoice.canBeModified()).toBe(true);
		});

		it("should allow modifying PENDING invoices", () => {
			const props = createValidInvoiceProps();
			props.status = "PENDING";
			const invoice = Invoice.create(props);

			expect(invoice.canBeModified()).toBe(true);
		});

		it("should not allow modifying SENT invoices", () => {
			const props = createValidInvoiceProps();
			props.status = "SENT";
			const invoice = Invoice.create(props);

			expect(invoice.canBeModified()).toBe(false);
		});

		it("should not allow modifying ACCEPTED invoices", () => {
			const props = createValidInvoiceProps();
			props.status = "ACCEPTED";
			const invoice = Invoice.create(props);

			expect(invoice.canBeModified()).toBe(false);
		});
	});

	describe("Overdue Detection", () => {
		it("should detect overdue invoices", () => {
			const props = createValidInvoiceProps();
			props.issueDate = new Date("2019-01-01"); // Issue date in the past
			props.dueDate = new Date("2020-01-01"); // Due date in the past (but after issue date)
			props.status = "SENT";
			const invoice = Invoice.create(props);

			expect(invoice.isOverdue()).toBe(true);
		});

		it("should not mark cancelled invoices as overdue", () => {
			const props = createValidInvoiceProps();
			props.issueDate = new Date("2019-01-01");
			props.dueDate = new Date("2020-01-01");
			props.status = "CANCELLED";
			const invoice = Invoice.create(props);

			expect(invoice.isOverdue()).toBe(false);
		});

		it("should not mark invoices without due date as overdue", () => {
			const props = createValidInvoiceProps();
			delete props.dueDate;
			const invoice = Invoice.create(props);

			expect(invoice.isOverdue()).toBe(false);
		});
	});

	describe("Equality", () => {
		it("should be equal by ID", () => {
			const props = createValidInvoiceProps();
			const invoice1 = Invoice.create(props);
			const invoice2 = Invoice.create(props);

			expect(invoice1.equals(invoice2)).toBe(true);
		});

		it("should not be equal with different IDs", () => {
			const props1 = createValidInvoiceProps();
			const props2 = createValidInvoiceProps();
			props2.id = crypto.randomUUID();

			const invoice1 = Invoice.create(props1);
			const invoice2 = Invoice.create(props2);

			expect(invoice1.equals(invoice2)).toBe(false);
		});

		it("should handle null/undefined comparison", () => {
			const props = createValidInvoiceProps();
			const invoice = Invoice.create(props);

			expect(invoice.equals(null)).toBe(false);
			expect(invoice.equals(undefined)).toBe(false);
		});
	});

	describe("Serialization", () => {
		it("should rehydrate invoice from primitive persistence data", () => {
			const invoice = Invoice.fromPrimitives({
				id: "inv_persisted_001",
				series: "F001",
				number: "42",
				issueDate: "2025-01-15T00:00:00.000Z",
				dueDate: "2025-02-15T00:00:00.000Z",
				clientName: "ACME Corp",
				clientRUC: "20100070970",
				clientAddress: "Av. Fiscal 123",
				baseAmount: 100_000,
				igvAmount: 18_000,
				totalAmount: 118_000,
				currency: "PEN",
				status: "SENT",
				items: [
					{
						id: "item_1",
						description: "Servicio gravado",
						quantity: "1",
						unitPrice: 100_000,
						subtotal: 100_000,
						igv: 18_000,
						total: 118_000,
					},
				],
				notes: "Persisted note",
				sunatResponseCode: "CDR-0",
				sentToSunatAt: "2025-01-15T01:00:00.000Z",
				createdAt: "2025-01-15T00:00:00.000Z",
				updatedAt: "2025-01-15T01:00:00.000Z",
			});

			expect(invoice.id).toBe("inv_persisted_001");
			expect(invoice.getFullNumber()).toBe("F001-00000042");
			expect(invoice.clientRUC?.toString()).toBe("20100070970");
			expect(invoice.baseAmount.getAmount()).toBe(1000);
			expect(invoice.igvAmount.getAmount()).toBe(180);
			expect(invoice.totalAmount.getAmount()).toBe(1180);
			expect(invoice.status).toBe("SENT");
			expect(invoice.sentToSunatAt?.toISOString()).toBe(
				"2025-01-15T01:00:00.000Z",
			);
		});

		it("should rehydrate boleta primitives with DNI and default timestamps", () => {
			const invoice = Invoice.fromPrimitives({
				id: "bol_persisted_001",
				series: "B001",
				number: 7,
				issueDate: "2025-01-15T00:00:00.000Z",
				clientName: "Cliente Final",
				clientDNI: "12345678",
				baseAmount: 10_000,
				igvAmount: 1_800,
				totalAmount: 11_800,
				currency: "PEN",
				status: "DRAFT",
				items: [
					{
						id: "item_1",
						description: "Venta gravada",
						quantity: 1,
						unitPrice: 10_000,
						subtotal: 10_000,
						igv: 1_800,
						total: 11_800,
					},
				],
			});

			expect(invoice.clientDNI?.toString()).toBe("12345678");
			expect(invoice.createdAt).toBeInstanceOf(Date);
			expect(invoice.updatedAt).toBeInstanceOf(Date);
		});

		it("should serialize to JSON", () => {
			const props = createValidInvoiceProps();
			const invoice = Invoice.create(props);

			const json = invoice.toJSON();

			expect(json).toHaveProperty("id");
			expect(json).toHaveProperty("series");
			expect(json).toHaveProperty("number");
			expect(json).toHaveProperty("clientName");
			expect(json).toHaveProperty("baseAmount");
			expect(json).toHaveProperty("igvAmount");
			expect(json).toHaveProperty("totalAmount");
		});

		it("should serialize dates as ISO strings", () => {
			const props = createValidInvoiceProps();
			const invoice = Invoice.create(props);

			const json = invoice.toJSON();

			expect(typeof json.issueDate).toBe("string");
			expect(typeof json.createdAt).toBe("string");
		});
	});

	describe("Immutability", () => {
		it("should be immutable", () => {
			const props = createValidInvoiceProps();
			const invoice = Invoice.create(props);

			expect(() => {
				// @ts-expect-error - trying to mutate
				invoice.status = "CANCELLED";
			}).toThrow();
		});

		it("should return new instance on status change", () => {
			const props = createValidInvoiceProps();
			props.status = "PENDING";
			const invoice = Invoice.create(props);

			const sentInvoice = invoice.markAsSent("CDR-123");

			expect(sentInvoice).not.toBe(invoice);
			expect(invoice.status).toBe("PENDING"); // Original unchanged
			expect(sentInvoice.status).toBe("SENT"); // New instance
		});
	});
});
