import { Invoice } from "@drenyra/domain/entities/Invoice";
import { DocumentSeries } from "@drenyra/domain/value-objects/DocumentSeries";
import { Money } from "@drenyra/domain/value-objects/Money";
import { RUC } from "@drenyra/domain/value-objects/RUC";
import { describe, expect, it } from "vitest";
import { PostgresInvoiceRepository } from "./postgres-invoice.repository";

type PostgresInvoiceRepositoryTestDouble = PostgresInvoiceRepository & {
	findModularById: (id: string) => Promise<Record<string, never> | null>;
	mapModularToDomain: (record: Record<string, never>) => Invoice;
	findAllModular: () => Promise<Invoice[]>;
};

const createInvoice = (
	id: string,
	createdAt: string,
	overrides?: Partial<{
		status:
			| "DRAFT"
			| "PENDING"
			| "SENT"
			| "ACCEPTED"
			| "REJECTED"
			| "CANCELLED";
		clientName: string;
		number: number;
	}>,
) =>
	Invoice.create({
		id,
		series: DocumentSeries.create("F001"),
		number: overrides?.number ?? 1,
		issueDate: new Date(createdAt),
		dueDate: new Date(createdAt),
		clientName: overrides?.clientName ?? `Client ${id}`,
		clientRUC: RUC.create("20100070970"),
		baseAmount: Money.fromAmount(100, "PEN"),
		igvAmount: Money.fromAmount(18, "PEN"),
		totalAmount: Money.fromAmount(118, "PEN"),
		status: overrides?.status ?? "DRAFT",
		items: [
			{
				id: `${id}-item`,
				description: "Servicio",
				quantity: 1,
				unitPrice: Money.fromAmount(118, "PEN"),
				subtotal: Money.fromAmount(100, "PEN"),
				igv: Money.fromAmount(18, "PEN"),
				total: Money.fromAmount(118, "PEN"),
			},
		],
		createdAt: new Date(createdAt),
		updatedAt: new Date(createdAt),
	});

describe("PostgresInvoiceRepository", () => {
	it("fails fast on save without tenant context", async () => {
		const repo = new PostgresInvoiceRepository();

		await expect(
			repo.save(createInvoice("legacy-save", "2026-01-01T00:00:00.000Z")),
		).rejects.toThrow("save requires tenant context");
	});

	it("fails fast on update without tenant context", async () => {
		const repo = new PostgresInvoiceRepository();

		await expect(
			repo.update(createInvoice("legacy-update", "2026-01-01T00:00:00.000Z")),
		).rejects.toThrow("update requires tenant context");
	});

	it("returns modular read result in findById", async () => {
		const repo =
			new PostgresInvoiceRepository() as PostgresInvoiceRepositoryTestDouble;
		const modularInvoice = createInvoice(
			"shared-id",
			"2026-01-02T00:00:00.000Z",
		);

		repo.findModularById = async () => ({});
		repo.mapModularToDomain = () => modularInvoice;

		const result = await repo.findById("shared-id");

		expect(result).toBe(modularInvoice);
	});

	it("returns null when modular read misses", async () => {
		const repo =
			new PostgresInvoiceRepository() as PostgresInvoiceRepositoryTestDouble;
		repo.findModularById = async () => null;

		const result = await repo.findById("missing-id");

		expect(result).toBeNull();
	});

	it("counts over modular results only", async () => {
		const repo =
			new PostgresInvoiceRepository() as PostgresInvoiceRepositoryTestDouble;
		const first = createInvoice("one", "2026-01-01T00:00:00.000Z");
		const second = createInvoice("two", "2026-01-02T00:00:00.000Z");

		repo.findAllModular = async () => [first, second];

		const total = await repo.count();

		expect(total).toBe(2);
	});
});
