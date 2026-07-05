import { randomUUID } from "node:crypto";
import {
	businessPartners,
	companies,
	db,
	eq,
	invoices,
	transactions,
	users,
} from "@drenyra/infrastructure";

export type CdrWebhookFixture = {
	userId: string;
	companyId: string;
	customerId: string;
	invoiceId: string;
	transactionId: string;
	invoiceNumber: string;
};

export async function createCdrWebhookFixture(options?: {
	invoiceNumber?: string;
}): Promise<CdrWebhookFixture> {
	const userId = randomUUID();
	const companyId = randomUUID();
	const customerId = randomUUID();
	const invoiceId = randomUUID();
	const transactionId = randomUUID();
	const unique = randomUUID().replace(/-/g, "").slice(0, 9);
	const invoiceIdentity = resolveInvoiceIdentity(options?.invoiceNumber);
	const issueDate = new Date("2026-02-20T10:00:00.000Z");

	await db.insert(users).values({
		id: userId,
		email: `integration-cdr-${userId}@arkalythix.local`,
		password: "integration-password",
		name: "CDR Integration Owner",
		role: "ADMIN",
		isActive: true,
	});

	await db.insert(companies).values({
		id: companyId,
		ownerId: userId,
		ruc: `20${unique}`,
		businessName: `CDR Integration ${companyId.slice(0, 8)}`,
		tradeName: "CDR Integration",
		isActive: true,
	});

	await db.insert(businessPartners).values({
		id: customerId,
		companyId,
		taxId: "20123456789",
		legalName: "CDR Customer SAC",
	});

	await db.insert(invoices).values({
		id: invoiceId,
		companyId,
		customerId,
		invoiceNumber: invoiceIdentity.invoiceNumber,
		series: invoiceIdentity.series,
		correlative: invoiceIdentity.correlative,
		issueDate,
		dueDate: new Date("2026-03-20T10:00:00.000Z"),
		currency: "PEN",
		exchangeRate: "1.0000",
		subtotal: "100.00",
		igvAmount: "18.00",
		totalAmount: "118.00",
		status: "SENT",
		sunatStatus: "SUBMITTED",
		balanceDue: "118.00",
		paidAmount: "0.00",
	});

	await db.insert(transactions).values({
		id: transactionId,
		companyId,
		type: "INCOME",
		documentType: "FACTURA",
		series: invoiceIdentity.series,
		number: String(invoiceIdentity.correlative),
		issueDate,
		currency: "PEN",
		exchangeRate: "1.000",
		subtotal: "100.00",
		igvAmount: "18.00",
		totalAmount: "118.00",
		status: "SUBMITTED",
	});

	return {
		userId,
		companyId,
		customerId,
		invoiceId,
		transactionId,
		invoiceNumber: invoiceIdentity.invoiceNumber,
	};
}

export async function cleanupCdrWebhookFixtures(
	fixtures: CdrWebhookFixture[],
): Promise<void> {
	for (const fixture of fixtures.splice(0)) {
		await db.delete(invoices).where(eq(invoices.id, fixture.invoiceId));
		await db
			.delete(transactions)
			.where(eq(transactions.id, fixture.transactionId));
		await db
			.delete(businessPartners)
			.where(eq(businessPartners.id, fixture.customerId));
		await db.delete(companies).where(eq(companies.id, fixture.companyId));
		await db.delete(users).where(eq(users.id, fixture.userId));
	}
}

export function readElectronicInvoicingTrail(
	tags: unknown,
): Array<{ stage: string; status: string; providerReference?: string }> {
	if (!tags || typeof tags !== "object" || Array.isArray(tags)) return [];

	const record = tags as Record<string, unknown>;
	const trail = record.electronicInvoicingTrail;
	if (!Array.isArray(trail)) return [];

	return trail
		.filter((item) => item && typeof item === "object" && !Array.isArray(item))
		.map((item) => {
			const event = item as Record<string, unknown>;
			const metadata =
				event.metadata && typeof event.metadata === "object"
					? (event.metadata as Record<string, unknown>)
					: {};

			return {
				stage: typeof event.stage === "string" ? event.stage : "",
				status: typeof event.status === "string" ? event.status : "",
				providerReference:
					typeof metadata.providerReference === "string"
						? metadata.providerReference
						: undefined,
			};
		});
}

function resolveInvoiceIdentity(input?: string): {
	invoiceNumber: string;
	series: string;
	correlative: number;
} {
	if (input) {
		const normalized = input.trim().toUpperCase();
		const [series, paddedCorrelative] = normalized.split("-");
		const correlative = Number.parseInt(paddedCorrelative ?? "", 10);

		if (series && Number.isFinite(correlative) && correlative > 0) {
			return {
				invoiceNumber: normalized,
				series,
				correlative,
			};
		}
	}

	const correlativeSeed =
		Number.parseInt(randomUUID().replace(/-/g, "").slice(0, 8), 16) % 100000000;
	const correlative = Math.max(correlativeSeed, 1);
	const paddedCorrelative = String(correlative).padStart(8, "0");

	return {
		invoiceNumber: `F001-${paddedCorrelative}`,
		series: "F001",
		correlative,
	};
}
