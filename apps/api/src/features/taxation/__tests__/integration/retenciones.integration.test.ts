import { randomUUID } from "node:crypto";
import { Money } from "@arkelythex/domain/value-objects/Money";
import {
	bills,
	businessPartners,
	companies,
	db,
	eq,
	retenciones,
	users,
} from "@arkelythex/infrastructure";
import { afterEach, describe, expect, it } from "vitest";
import { getPendingRetentions } from "../../application/queries/get-pending-retentions.query";
import { getRetentionSummary } from "../../application/queries/get-retention-summary.query";
import { Retencion } from "../../domain/entities/retencion.entity";
import { RetencionRepository } from "../../infrastructure/retencion.repository";

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

type Fixture = {
	userId: string;
	companyId: string;
	vendorId: string;
	billId: string;
};

describeDb("Retenciones (integration)", () => {
	const fixtures: Fixture[] = [];
	const repository = new RetencionRepository();

	afterEach(async () => {
		for (const fixture of fixtures.splice(0)) {
			await db
				.delete(retenciones)
				.where(eq(retenciones.companyId, fixture.companyId));
			await db.delete(bills).where(eq(bills.id, fixture.billId));
			await db
				.delete(businessPartners)
				.where(eq(businessPartners.id, fixture.vendorId));
			await db.delete(companies).where(eq(companies.id, fixture.companyId));
			await db.delete(users).where(eq(users.id, fixture.userId));
		}
	});

	it("persists and reloads a pending retention from a bill", async () => {
		const fixture = await createFixture(fixtures);
		const [retencion] = Retencion.createFromBill({
			companyId: fixture.companyId,
			billId: fixture.billId,
			supplierRuc: "20123456789",
			baseAmount: Money.fromAmount(1000, "PEN"),
			appliedAt: new Date("2026-03-20T12:00:00.000Z"),
		});

		await repository.save(retencion);

		const loaded = await repository.findByBillId(fixture.billId);

		expect(loaded).not.toBeNull();
		expect(loaded?.status).toBe("PENDING");
		expect(loaded?.retentionAmount.toString()).toBe("30.00");
		expect(loaded?.netToSupplier.toString()).toBe("970.00");
		expect(loaded?.declarationPeriod).toBe("2026-03");
	});

	it("feeds pending and summary queries after declaration", async () => {
		const fixture = await createFixture(fixtures);
		const [retencion] = Retencion.createFromBill({
			companyId: fixture.companyId,
			billId: fixture.billId,
			supplierRuc: "20123456789",
			baseAmount: Money.fromAmount(2000, "PEN"),
			appliedAt: new Date("2026-03-25T12:00:00.000Z"),
		});
		const [declared] = retencion.declare(
			"PDT626-2026-03-001",
			new Date("2026-04-10T09:00:00.000Z"),
		);

		await repository.save(retencion);
		await repository.update(declared);

		const pendingResult = await getPendingRetentions({
			companyId: fixture.companyId,
			declarationPeriod: "2026-03",
		});
		const summaryResult = await getRetentionSummary({
			companyId: fixture.companyId,
			declarationPeriod: "2026-03",
		});

		expect(pendingResult.count).toBe(1);
		expect(pendingResult.items[0]).toMatchObject({
			status: "DECLARED",
			retentionAmount: 60,
			netToSupplier: 1940,
			declarationPeriod: "2026-03",
		});

		expect(summaryResult).toMatchObject({
			declarationPeriod: "2026-03",
			sunatDueDate: "2026-04-15",
			totalRetentionAmount: 60,
			retentionCount: 1,
			byStatus: {
				PENDING: 0,
				DECLARED: 1,
				PAID: 0,
				CANCELLED: 0,
			},
		});
	});
});

async function createFixture(fixtures: Fixture[]): Promise<Fixture> {
	const userId = randomUUID();
	const companyId = randomUUID();
	const vendorId = randomUUID();
	const billId = randomUUID();
	const unique = randomUUID().replace(/-/g, "").slice(0, 9);

	await db.insert(users).values({
		id: userId,
		email: `retenciones-${userId}@arkalythix.local`,
		password: "integration-password",
		name: "Retention Integration Owner",
		role: "ADMIN",
		isActive: true,
	});

	await db.insert(companies).values({
		id: companyId,
		ownerId: userId,
		ruc: `20${unique}`,
		businessName: `Retention Integration ${companyId.slice(0, 8)}`,
		tradeName: "Retention Integration",
		isActive: true,
	});

	await db.insert(businessPartners).values({
		id: vendorId,
		companyId,
		taxId: "20123456789",
		partnerDocumentType: "RUC",
		legalName: "Proveedor Retenciones SAC",
	});

	await db.insert(bills).values({
		id: billId,
		companyId,
		vendorId,
		billNumber: `B001-${unique.slice(0, 4)}`,
		issueDate: new Date("2026-03-20T12:00:00.000Z"),
		dueDate: new Date("2026-03-30T12:00:00.000Z"),
		currency: "PEN",
		exchangeRate: "1.0000",
		subtotalAmount: "847.46",
		igvAmount: "152.54",
		totalAmount: "1000.00",
		status: "SENT",
	});

	const fixture = { userId, companyId, vendorId, billId };
	fixtures.push(fixture);
	return fixture;
}
