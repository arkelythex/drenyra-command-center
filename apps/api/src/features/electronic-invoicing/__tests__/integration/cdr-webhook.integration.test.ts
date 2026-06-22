import { db, eq, invoices, transactions } from "@arkelythex/infrastructure";
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

describeDb("electronic invoicing CDR webhook (integration)", () => {
	const app = new Elysia().use(electronicInvoicingModule);
	const fixtures: CdrWebhookFixture[] = [];

	afterEach(async () => {
		await cleanupCdrWebhookFixtures(fixtures);
	});

	it("resolves webhook by invoice number and syncs invoice + transaction state", async () => {
		const fixture = await createCdrWebhookFixture();
		fixtures.push(fixture);

		const cdrUrl = "https://ose.example.test/cdr/F001-00000001.zip";

		const response = await app.handle(
			new Request("http://localhost/api/electronic-invoicing/webhooks/cdr", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					invoiceNumber: fixture.invoiceNumber,
					cdrStatus: "ACEPTADO",
					sunatCode: "0",
					sunatDescription: "CDR ACEPTADO",
					cdrContent: cdrUrl,
					providerReference: "ose-cdr-accept-1",
					occurredAt: "2026-02-27T22:10:00.000Z",
				}),
			}),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				success: true,
				transactionId: fixture.transactionId,
				invoiceNumber: fixture.invoiceNumber,
				status: "ACCEPTED",
			},
		});

		const persistedTransaction = await db.query.transactions.findFirst({
			where: eq(transactions.id, fixture.transactionId),
			columns: {
				status: true,
				tags: true,
			},
		});
		expect(persistedTransaction?.status).toBe("ACCEPTED");

		const trail = readElectronicInvoicingTrail(persistedTransaction?.tags);
		expect(
			trail.some(
				(event) =>
					event.stage === "CDR_WEBHOOK" &&
					event.status === "ACCEPTED" &&
					event.providerReference === "ose-cdr-accept-1",
			),
		).toBe(true);

		const persistedInvoice = await db.query.invoices.findFirst({
			where: eq(invoices.id, fixture.invoiceId),
			columns: {
				status: true,
				sunatStatus: true,
				cdrUrl: true,
			},
		});
		expect(persistedInvoice).toMatchObject({
			status: "SENT",
			sunatStatus: "ACCEPTED",
			cdrUrl,
		});
	});
});
