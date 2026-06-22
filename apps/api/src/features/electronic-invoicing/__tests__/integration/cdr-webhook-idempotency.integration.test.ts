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

describeDb("electronic invoicing CDR webhook idempotency (integration)", () => {
	const app = new Elysia().use(electronicInvoicingModule);
	const fixtures: CdrWebhookFixture[] = [];

	afterEach(async () => {
		await cleanupCdrWebhookFixtures(fixtures);
	});

	it("deduplicates retries with the same providerReference", async () => {
		const fixture = await createCdrWebhookFixture();
		fixtures.push(fixture);

		const firstCdrUrl = "https://ose.example.test/cdr/first.zip";
		const secondCdrUrl = "https://ose.example.test/cdr/second.zip";
		const providerReference = "ose-cdr-idempotent-1";

		const firstResponse = await app.handle(
			new Request("http://localhost/api/electronic-invoicing/webhooks/cdr", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					invoiceNumber: fixture.invoiceNumber,
					cdrStatus: "ACEPTADO",
					sunatCode: "0",
					sunatDescription: "CDR inicial",
					cdrContent: firstCdrUrl,
					providerReference,
				}),
			}),
		);

		expect(firstResponse.status).toBe(200);

		const retryResponse = await app.handle(
			new Request("http://localhost/api/electronic-invoicing/webhooks/cdr", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					invoiceNumber: fixture.invoiceNumber,
					cdrStatus: "ACEPTADO",
					sunatCode: "0",
					sunatDescription: "CDR reintentado",
					cdrContent: secondCdrUrl,
					providerReference,
				}),
			}),
		);

		expect(retryResponse.status).toBe(200);
		const retryPayload = await retryResponse.json();
		expect(retryPayload).toMatchObject({
			success: true,
			data: {
				success: true,
				transactionId: fixture.transactionId,
				invoiceNumber: fixture.invoiceNumber,
				status: "ACCEPTED",
				message: "CDR ya procesado anteriormente (idempotencia)",
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
		const cdrEvents = trail.filter((event) => event.stage === "CDR_WEBHOOK");
		expect(cdrEvents).toHaveLength(1);
		expect(cdrEvents[0]).toMatchObject({
			status: "ACCEPTED",
			providerReference,
		});

		const persistedInvoice = await db.query.invoices.findFirst({
			where: eq(invoices.id, fixture.invoiceId),
			columns: {
				sunatStatus: true,
				cdrUrl: true,
			},
		});
		expect(persistedInvoice).toMatchObject({
			sunatStatus: "ACCEPTED",
			cdrUrl: firstCdrUrl,
		});
	});
});
