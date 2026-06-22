/**
 * Domain Events Tests
 * Comprehensive tests for all domain events (0% → 100% coverage)
 */

import { beforeEach, describe, expect, it } from "vitest";
import { DomainEvent } from "../DomainEvent";
import { InvoiceCreated } from "../InvoiceCreated";
import { InvoiceSentToSunat } from "../InvoiceSentToSunat";
import { TransactionPosted } from "../TransactionPosted";

// ===== DOMAIN EVENT BASE CLASS =====

describe("DomainEvent", () => {
	// Concrete implementation for testing abstract class
	class TestEvent extends DomainEvent {
		constructor(public readonly testData: string) {
			super();
		}

		get eventName(): string {
			return "test.event";
		}

		protected getPayload(): Record<string, unknown> {
			return { testData: this.testData };
		}
	}

	describe("constructor", () => {
		it("should generate unique eventId", () => {
			const event1 = new TestEvent("data1");
			const event2 = new TestEvent("data2");

			expect(event1.eventId).toBeDefined();
			expect(event2.eventId).toBeDefined();
			expect(event1.eventId).not.toBe(event2.eventId);
		});

		it("should set occurredOn to current date", () => {
			const before = new Date();
			const event = new TestEvent("data");
			const after = new Date();

			expect(event.occurredOn).toBeInstanceOf(Date);
			expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(
				before.getTime(),
			);
			expect(event.occurredOn.getTime()).toBeLessThanOrEqual(after.getTime());
		});

		it("should generate UUID v4 format for eventId", () => {
			const event = new TestEvent("data");
			const uuidRegex =
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

			expect(event.eventId).toMatch(uuidRegex);
		});
	});

	describe("toJSON", () => {
		it("should serialize event to JSON with all properties", () => {
			const event = new TestEvent("test-data");
			const json = event.toJSON();

			expect(json).toHaveProperty("eventId", event.eventId);
			expect(json).toHaveProperty("eventName", "test.event");
			expect(json).toHaveProperty("occurredOn");
			expect(json).toHaveProperty("testData", "test-data");
		});

		it("should serialize occurredOn as ISO string", () => {
			const event = new TestEvent("data");
			const json = event.toJSON();

			expect(typeof json.occurredOn).toBe("string");
			expect(json.occurredOn).toBe(event.occurredOn.toISOString());
		});

		it("should include payload from getPayload", () => {
			const event = new TestEvent("payload-data");
			const json = event.toJSON();

			expect(json.testData).toBe("payload-data");
		});
	});

	describe("abstract methods", () => {
		it("should require eventName implementation", () => {
			const event = new TestEvent("data");
			expect(event.eventName).toBe("test.event");
		});

		it("should require getPayload implementation", () => {
			const event = new TestEvent("data");
			// @ts-expect-error - accessing protected method for testing
			const payload = event.getPayload();

			expect(payload).toEqual({ testData: "data" });
		});
	});
});

// ===== INVOICE CREATED EVENT =====

describe("InvoiceCreated", () => {
	let invoiceCreatedEvent: InvoiceCreated;

	beforeEach(() => {
		invoiceCreatedEvent = new InvoiceCreated(
			"inv-123",
			"F001",
			456,
			"Acme Corp",
			100000, // S/ 1,000.00 in cents
			"PEN",
		);
	});

	describe("constructor", () => {
		it("should initialize with all properties", () => {
			expect(invoiceCreatedEvent.invoiceId).toBe("inv-123");
			expect(invoiceCreatedEvent.series).toBe("F001");
			expect(invoiceCreatedEvent.number).toBe(456);
			expect(invoiceCreatedEvent.clientName).toBe("Acme Corp");
			expect(invoiceCreatedEvent.totalAmount).toBe(100000);
			expect(invoiceCreatedEvent.currency).toBe("PEN");
		});

		it("should inherit from DomainEvent", () => {
			expect(invoiceCreatedEvent).toBeInstanceOf(DomainEvent);
			expect(invoiceCreatedEvent.eventId).toBeDefined();
			expect(invoiceCreatedEvent.occurredOn).toBeInstanceOf(Date);
		});

		it("should accept USD currency", () => {
			const usdEvent = new InvoiceCreated(
				"inv-456",
				"F002",
				789,
				"Global Inc",
				50000,
				"USD",
			);

			expect(usdEvent.currency).toBe("USD");
		});

		it("should accept boleta series", () => {
			const boletaEvent = new InvoiceCreated(
				"inv-789",
				"B001",
				123,
				"Juan Perez",
				25000,
				"PEN",
			);

			expect(boletaEvent.series).toBe("B001");
		});
	});

	describe("eventName", () => {
		it("should return correct event name", () => {
			expect(invoiceCreatedEvent.eventName).toBe("invoice.created");
		});
	});

	describe("getPayload", () => {
		it("should return complete payload", () => {
			// @ts-expect-error - accessing protected method for testing
			const payload = invoiceCreatedEvent.getPayload();

			expect(payload).toEqual({
				invoiceId: "inv-123",
				series: "F001",
				number: 456,
				clientName: "Acme Corp",
				totalAmount: 100000,
				currency: "PEN",
			});
		});
	});

	describe("toJSON", () => {
		it("should serialize complete invoice event", () => {
			const json = invoiceCreatedEvent.toJSON();

			expect(json.eventName).toBe("invoice.created");
			expect(json.invoiceId).toBe("inv-123");
			expect(json.series).toBe("F001");
			expect(json.number).toBe(456);
			expect(json.clientName).toBe("Acme Corp");
			expect(json.totalAmount).toBe(100000);
			expect(json.currency).toBe("PEN");
			expect(json.eventId).toBeDefined();
			expect(json.occurredOn).toBeDefined();
		});

		it("should be JSON serializable", () => {
			const json = invoiceCreatedEvent.toJSON();
			const jsonString = JSON.stringify(json);

			expect(() => JSON.parse(jsonString)).not.toThrow();
		});
	});
});

// ===== INVOICE SENT TO SUNAT EVENT =====

describe("InvoiceSentToSunat", () => {
	let sunatEvent: InvoiceSentToSunat;

	beforeEach(() => {
		sunatEvent = new InvoiceSentToSunat("inv-123", "0 - Aceptado");
	});

	describe("constructor", () => {
		it("should initialize with invoice ID and response code", () => {
			expect(sunatEvent.invoiceId).toBe("inv-123");
			expect(sunatEvent.sunatResponseCode).toBe("0 - Aceptado");
		});

		it("should inherit from DomainEvent", () => {
			expect(sunatEvent).toBeInstanceOf(DomainEvent);
			expect(sunatEvent.eventId).toBeDefined();
			expect(sunatEvent.occurredOn).toBeInstanceOf(Date);
		});

		it("should accept rejection response codes", () => {
			const rejectedEvent = new InvoiceSentToSunat(
				"inv-456",
				"2000 - Rechazado",
			);
			expect(rejectedEvent.sunatResponseCode).toBe("2000 - Rechazado");
		});

		it("should accept observation response codes", () => {
			const observedEvent = new InvoiceSentToSunat(
				"inv-789",
				"1000 - Observado",
			);
			expect(observedEvent.sunatResponseCode).toBe("1000 - Observado");
		});
	});

	describe("eventName", () => {
		it("should return correct event name", () => {
			expect(sunatEvent.eventName).toBe("invoice.sent_to_sunat");
		});
	});

	describe("getPayload", () => {
		it("should return payload with invoice and response", () => {
			// @ts-expect-error - accessing protected method for testing
			const payload = sunatEvent.getPayload();

			expect(payload).toEqual({
				invoiceId: "inv-123",
				sunatResponseCode: "0 - Aceptado",
			});
		});
	});

	describe("toJSON", () => {
		it("should serialize SUNAT event correctly", () => {
			const json = sunatEvent.toJSON();

			expect(json.eventName).toBe("invoice.sent_to_sunat");
			expect(json.invoiceId).toBe("inv-123");
			expect(json.sunatResponseCode).toBe("0 - Aceptado");
			expect(json.eventId).toBeDefined();
			expect(json.occurredOn).toBeDefined();
		});

		it("should handle empty response codes", () => {
			const emptyEvent = new InvoiceSentToSunat("inv-999", "");
			const json = emptyEvent.toJSON();

			expect(json.sunatResponseCode).toBe("");
		});
	});
});

// ===== TRANSACTION POSTED EVENT =====

describe("TransactionPosted", () => {
	let transactionEvent: TransactionPosted;

	beforeEach(() => {
		transactionEvent = new TransactionPosted(
			"txn-123",
			"EXPENSE",
			50000, // S/ 500.00 in cents
			"PEN",
			"user-789",
		);
	});

	describe("constructor", () => {
		it("should initialize with all transaction properties", () => {
			expect(transactionEvent.transactionId).toBe("txn-123");
			expect(transactionEvent.type).toBe("EXPENSE");
			expect(transactionEvent.amount).toBe(50000);
			expect(transactionEvent.currency).toBe("PEN");
			expect(transactionEvent.postedBy).toBe("user-789");
		});

		it("should inherit from DomainEvent", () => {
			expect(transactionEvent).toBeInstanceOf(DomainEvent);
			expect(transactionEvent.eventId).toBeDefined();
			expect(transactionEvent.occurredOn).toBeInstanceOf(Date);
		});

		it("should accept INCOME transaction type", () => {
			const incomeEvent = new TransactionPosted(
				"txn-456",
				"INCOME",
				100000,
				"PEN",
				"user-123",
			);

			expect(incomeEvent.type).toBe("INCOME");
		});

		it("should accept USD currency", () => {
			const usdEvent = new TransactionPosted(
				"txn-789",
				"EXPENSE",
				25000,
				"USD",
				"user-456",
			);

			expect(usdEvent.currency).toBe("USD");
		});

		it("should accept TRANSFER transaction type", () => {
			const transferEvent = new TransactionPosted(
				"txn-999",
				"TRANSFER",
				75000,
				"PEN",
				"user-999",
			);

			expect(transferEvent.type).toBe("TRANSFER");
		});
	});

	describe("eventName", () => {
		it("should return correct event name", () => {
			expect(transactionEvent.eventName).toBe("transaction.posted");
		});
	});

	describe("getPayload", () => {
		it("should return complete transaction payload", () => {
			// @ts-expect-error - accessing protected method for testing
			const payload = transactionEvent.getPayload();

			expect(payload).toEqual({
				transactionId: "txn-123",
				type: "EXPENSE",
				amount: 50000,
				currency: "PEN",
				postedBy: "user-789",
			});
		});
	});

	describe("toJSON", () => {
		it("should serialize complete transaction event", () => {
			const json = transactionEvent.toJSON();

			expect(json.eventName).toBe("transaction.posted");
			expect(json.transactionId).toBe("txn-123");
			expect(json.type).toBe("EXPENSE");
			expect(json.amount).toBe(50000);
			expect(json.currency).toBe("PEN");
			expect(json.postedBy).toBe("user-789");
			expect(json.eventId).toBeDefined();
			expect(json.occurredOn).toBeDefined();
		});

		it("should serialize with negative amounts (refunds)", () => {
			const refundEvent = new TransactionPosted(
				"txn-refund",
				"REFUND",
				-30000,
				"PEN",
				"user-123",
			);
			const json = refundEvent.toJSON();

			expect(json.amount).toBe(-30000);
		});

		it("should be JSON serializable", () => {
			const json = transactionEvent.toJSON();
			const jsonString = JSON.stringify(json);

			expect(() => JSON.parse(jsonString)).not.toThrow();
			const parsed = JSON.parse(jsonString);
			expect(parsed.transactionId).toBe("txn-123");
		});
	});
});

// ===== INTEGRATION TESTS =====

describe("Domain Events Integration", () => {
	it("should create multiple events with unique IDs", () => {
		const event1 = new InvoiceCreated(
			"inv-1",
			"F001",
			1,
			"Client A",
			100,
			"PEN",
		);
		const event2 = new InvoiceSentToSunat("inv-1", "0 - Aceptado");
		const event3 = new TransactionPosted(
			"txn-1",
			"INCOME",
			100,
			"PEN",
			"user-1",
		);

		const eventIds = [event1.eventId, event2.eventId, event3.eventId];
		const uniqueIds = new Set(eventIds);

		expect(uniqueIds.size).toBe(3);
	});

	it("should create events in chronological order", async () => {
		const event1 = new InvoiceCreated("inv-1", "F001", 1, "Client", 100, "PEN");

		// Small delay to ensure different timestamps
		await new Promise((resolve) => setTimeout(resolve, 5));

		const event2 = new InvoiceSentToSunat("inv-1", "0 - Aceptado");

		expect(event2.occurredOn.getTime()).toBeGreaterThanOrEqual(
			event1.occurredOn.getTime(),
		);
	});

	it("should serialize all event types consistently", () => {
		const events = [
			new InvoiceCreated("inv-1", "F001", 1, "Client", 100, "PEN"),
			new InvoiceSentToSunat("inv-1", "0 - Aceptado"),
			new TransactionPosted("txn-1", "INCOME", 100, "PEN", "user-1"),
		];

		events.forEach((event) => {
			const json = event.toJSON();

			expect(json).toHaveProperty("eventId");
			expect(json).toHaveProperty("eventName");
			expect(json).toHaveProperty("occurredOn");
			expect(typeof json.eventId).toBe("string");
			expect(typeof json.eventName).toBe("string");
			expect(typeof json.occurredOn).toBe("string");
		});
	});
});
