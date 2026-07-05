import { randomUUID } from "node:crypto";
import { Money } from "@drenyra/domain/value-objects/Money";
import {
	bills,
	businessPartners,
	companies,
	db,
	eq,
	percepciones,
	users,
} from "@drenyra/infrastructure";
import { afterEach, describe, expect, it } from "vitest";
import { getPendingPercepciones } from "../../application/queries/get-pending-percepciones.query";
import { getPercepcionSummary } from "../../application/queries/get-percepcion-summary.query";
import { Percepcion } from "../../domain/entities/percepcion.entity";
import { PercepcionRepository } from "../../infrastructure/percepcion.repository";

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

type Fixture = {
	userId: string;
	companyId: string;
	vendorId: string;
	billId: string;
};

describeDb("Percepciones (integration)", () => {
	const fixtures: Fixture[] = [];
	const repository = new PercepcionRepository();

	afterEach(async () => {
		for (const fixture of fixtures.splice(0)) {
			await db
				.delete(percepciones)
				.where(eq(percepciones.companyId, fixture.companyId));
			await db.delete(bills).where(eq(bills.id, fixture.billId));
			await db
				.delete(businessPartners)
				.where(eq(businessPartners.id, fixture.vendorId));
			await db.delete(companies).where(eq(companies.id, fixture.companyId));
			await db.delete(users).where(eq(users.id, fixture.userId));
		}
	});

	it("persists and reloads a pending percepcion from a bill", async () => {
		const fixture = await createFixture(fixtures);
		const [percepcion] = Percepcion.createFromBill({
			companyId: fixture.companyId,
			billId: fixture.billId,
			agentRuc: "20123456789",
			percepcionType: "VENTA_INTERNA",
			totalAmount: Money.fromAmount(1000, "PEN"),
			appliedAt: new Date("2026-03-20T12:00:00.000Z"),
		});

		await repository.save(percepcion);

		const loaded = await repository.findByBillId(fixture.billId);

		expect(loaded).not.toBeNull();
		expect(loaded?.status).toBe("PENDING");
		expect(loaded?.percepcionAmount.toString()).toBe("20.00");
		expect(loaded?.percepcionType).toBe("VENTA_INTERNA");
		expect(loaded?.agentRuc).toBe("20123456789");
		expect(loaded?.declarationPeriod).toBe("2026-03");
	});

	it("feeds pending and summary queries after declaration", async () => {
		const fixture = await createFixture(fixtures);
		const [percepcion] = Percepcion.createFromBill({
			companyId: fixture.companyId,
			billId: fixture.billId,
			agentRuc: "20123456789",
			percepcionType: "IMPORTACION",
			totalAmount: Money.fromAmount(2000, "PEN"),
			appliedAt: new Date("2026-03-25T12:00:00.000Z"),
		});
		const [declared] = percepcion.declare(
			"PDT-621-2026-03-001",
			new Date("2026-04-10T09:00:00.000Z"),
		);

		await repository.save(percepcion);
		await repository.update(declared);

		const pendingResult = await getPendingPercepciones({
			companyId: fixture.companyId,
			declarationPeriod: "2026-03",
		});
		const summaryResult = await getPercepcionSummary({
			companyId: fixture.companyId,
			declarationPeriod: "2026-03",
		});

		expect(pendingResult.count).toBe(1);
		expect(pendingResult.items[0]).toMatchObject({
			status: "DECLARED",
			percepcionAmount: 70,
			declarationPeriod: "2026-03",
		});

		expect(summaryResult).toMatchObject({
			declarationPeriod: "2026-03",
			totalPercepcionAmount: 70,
			percepcionCount: 1,
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
		email: `percepciones-${userId}@arkalythix.local`,
		password: "integration-password",
		name: "Percepcion Integration Owner",
		role: "ADMIN",
		isActive: true,
	});

	await db.insert(companies).values({
		id: companyId,
		ownerId: userId,
		ruc: `20${unique}`,
		businessName: `Percepcion Integration ${companyId.slice(0, 8)}`,
		tradeName: "Percepcion Integration",
		isActive: true,
	});

	await db.insert(businessPartners).values({
		id: vendorId,
		companyId,
		taxId: "20123456789",
		partnerDocumentType: "RUC",
		legalName: "Agente Percepcion SAC",
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
