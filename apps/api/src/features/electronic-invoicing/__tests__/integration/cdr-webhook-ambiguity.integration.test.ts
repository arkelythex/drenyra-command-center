import { db, eq, transactions } from "@drenyra/infrastructure";
import { Elysia } from "elysia";
import { afterEach, describe, expect, it } from "vitest";
import { electronicInvoicingModule } from "../../index";
import {
	type CdrWebhookFixture,
	cleanupCdrWebhookFixtures,
	createCdrWebhookFixture,
	readElectronicInvoicingTrail,
} from "./support/cdr-webhook-fixtures";

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

describeDb("electronic invoicing CDR webhook ambiguity (integration)", () => {
	const app = new Elysia().use(electronicInvoicingModule);
	const fixtures: CdrWebhookFixture[] = [];

	afterEach(async () => {
		await cleanupCdrWebhookFixtures(fixtures);
	});

	it("returns 404 and leaves state untouched when invoiceNumber is ambiguous across tenants", async () => {
		const sharedInvoiceNumber = "F001-00999999";
		const fixtureA = await createCdrWebhookFixture({
			invoiceNumber: sharedInvoiceNumber,
		});
		const fixtureB = await createCdrWebhookFixture({
			invoiceNumber: sharedInvoiceNumber,
		});
		fixtures.push(fixtureA, fixtureB);

		const response = await app.handle(
			new Request("http://localhost/api/electronic-invoicing/webhooks/cdr", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					invoiceNumber: sharedInvoiceNumber,
					cdrStatus: "ACEPTADO",
					providerReference: "ose-cdr-ambiguous-1",
				}),
			}),
		);

		expect(response.status).toBe(404);
		const payload = await response.json();
		expect(payload).toEqual({
			success: false,
			error: "No se encontró transacción para el CDR recibido",
			code: "TRANSACTION_NOT_FOUND",
		});

		const persistedA = await db.query.transactions.findFirst({
			where: eq(transactions.id, fixtureA.transactionId),
			columns: { status: true, tags: true },
		});
		const persistedB = await db.query.transactions.findFirst({
			where: eq(transactions.id, fixtureB.transactionId),
			columns: { status: true, tags: true },
		});

		expect(persistedA?.status).toBe("SUBMITTED");
		expect(persistedB?.status).toBe("SUBMITTED");
		expect(
			readElectronicInvoicingTrail(persistedA?.tags).some(
				(event) => event.stage === "CDR_WEBHOOK",
			),
		).toBe(false);
		expect(
			readElectronicInvoicingTrail(persistedB?.tags).some(
				(event) => event.stage === "CDR_WEBHOOK",
			),
		).toBe(false);
	});

	it("uses x-company-id to disambiguate webhook callbacks across tenants", async () => {
		const sharedInvoiceNumber = "F001-00999998";
		const fixtureA = await createCdrWebhookFixture({
			invoiceNumber: sharedInvoiceNumber,
		});
		const fixtureB = await createCdrWebhookFixture({
			invoiceNumber: sharedInvoiceNumber,
		});
		fixtures.push(fixtureA, fixtureB);

		const response = await app.handle(
			new Request("http://localhost/api/electronic-invoicing/webhooks/cdr", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-company-id": fixtureA.companyId,
				},
				body: JSON.stringify({
					invoiceNumber: sharedInvoiceNumber,
					cdrStatus: "ACEPTADO",
					providerReference: "ose-cdr-ambiguous-2",
				}),
			}),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				success: true,
				transactionId: fixtureA.transactionId,
				status: "ACCEPTED",
			},
		});

		const persistedA = await db.query.transactions.findFirst({
			where: eq(transactions.id, fixtureA.transactionId),
			columns: { status: true, tags: true },
		});
		const persistedB = await db.query.transactions.findFirst({
			where: eq(transactions.id, fixtureB.transactionId),
			columns: { status: true, tags: true },
		});

		expect(persistedA?.status).toBe("ACCEPTED");
		expect(persistedB?.status).toBe("SUBMITTED");
		expect(
			readElectronicInvoicingTrail(persistedA?.tags).some(
				(event) =>
					event.stage === "CDR_WEBHOOK" &&
					event.providerReference === "ose-cdr-ambiguous-2",
			),
		).toBe(true);
		expect(
			readElectronicInvoicingTrail(persistedB?.tags).some(
				(event) => event.stage === "CDR_WEBHOOK",
			),
		).toBe(false);
	});
});
