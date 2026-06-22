import { Money } from "@arkelythex/domain/value-objects/Money";
import type { EventBusPort } from "@arkelythex/infrastructure/events/event.port";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	Retencion,
	type RetentionStatus,
} from "../../domain/entities/retencion.entity";

const mockRepo = vi.hoisted(() => ({
	retencionRepository: {
		findByBillId: vi.fn(),
		findById: vi.fn(),
		findByStatus: vi.fn(),
		findByDeclarationPeriod: vi.fn(),
		save: vi.fn(),
		update: vi.fn(),
	},
}));

vi.mock("../../infrastructure/retencion.repository", () => mockRepo);

import {
	applyRetention,
	RetentionApplyError,
} from "../../application/commands/apply-retention.command";
import { cancelRetention } from "../../application/commands/cancel-retention.command";
import { declareRetention } from "../../application/commands/declare-retention.command";
import { markRetentionPaid } from "../../application/commands/mark-retention-paid.command";
import { getPendingRetentions } from "../../application/queries/get-pending-retentions.query";
import { getRetentionSummary } from "../../application/queries/get-retention-summary.query";

const createEventBus = () =>
	({
		publish: vi.fn().mockResolvedValue(undefined),
	}) as unknown as EventBusPort;

describe("retention handlers and queries", () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	it("applies a retention, persists it and publishes taxation.retention.applied", async () => {
		mockRepo.retencionRepository.findByBillId.mockResolvedValue(null);
		mockRepo.retencionRepository.save.mockResolvedValue();

		const eventBus = createEventBus();

		const result = await applyRetention(
			{
				companyId: "cmp-1",
				billId: "bill-1",
				supplierRuc: "20100070970",
				baseAmountCents: 100000,
			},
			{ eventBus },
		);

		expect(mockRepo.retencionRepository.save).toHaveBeenCalledTimes(1);
		expect(eventBus.publish).toHaveBeenCalledWith(
			"taxation.retention.applied",
			expect.objectContaining({
				companyId: "cmp-1",
				billId: "bill-1",
				supplierRuc: "20100070970",
				baseAmountCents: 100000,
				retentionAmountCents: 3000,
			}),
		);
		expect(result).toMatchObject({
			retentionAmountCents: 3000,
			netToSupplierCents: 97000,
			declarationPeriod: expect.stringMatching(/^\d{4}-\d{2}$/),
		});
	});

	it("rejects duplicate active retention for the same bill", async () => {
		mockRepo.retencionRepository.findByBillId.mockResolvedValue({
			id: "existing-ret-1",
			status: "PENDING",
		} as import("../../domain/entities/retencion.entity").Retencion);

		await expect(
			applyRetention(
				{
					companyId: "cmp-1",
					billId: "bill-1",
					supplierRuc: "20100070970",
					baseAmountCents: 100000,
				},
				{ eventBus: createEventBus() },
			),
		).rejects.toThrow(RetentionApplyError);
		expect(mockRepo.retencionRepository.save).not.toHaveBeenCalled();
	});

	it("marks a retention paid", async () => {
		const appliedAt = new Date("2026-03-15T10:00:00.000Z");
		const [retencion] = Retencion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			supplierRuc: "20100070970",
			baseAmount: Money.fromCents(100000, "PEN"),
			appliedAt,
		});
		const [declared] = retencion.declare("PDT626-2026-03-001");
		mockRepo.retencionRepository.findById.mockResolvedValue(declared);
		mockRepo.retencionRepository.update.mockResolvedValue();

		const eventBus = createEventBus();

		await markRetentionPaid(
			{ retentionId: declared.id, bankTransactionId: "txn-1" },
			{ eventBus },
		);

		expect(mockRepo.retencionRepository.update).toHaveBeenCalledTimes(1);
		expect(eventBus.publish).toHaveBeenCalledWith(
			"taxation.retention.paid",
			expect.objectContaining({
				retentionId: declared.id,
				bankTransactionId: "txn-1",
			}),
		);
	});

	it("rejects pay on already-paid retention", async () => {
		const [retencion] = Retencion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			supplierRuc: "20100070970",
			baseAmount: Money.fromCents(100000, "PEN"),
		});
		const [declared] = retencion.declare("PDT626-2026-03-001");
		const [paid] = declared.markPaid("txn-1");
		mockRepo.retencionRepository.findById.mockResolvedValue(paid);

		await expect(
			markRetentionPaid(
				{ retentionId: paid.id, bankTransactionId: "txn-2" },
				{ eventBus: createEventBus() },
			),
		).rejects.toThrow();
		expect(mockRepo.retencionRepository.update).not.toHaveBeenCalled();
	});

	it("declares a retention in PDT 626", async () => {
		const appliedAt = new Date("2026-03-10T12:00:00.000Z");
		const [retencion] = Retencion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			supplierRuc: "20100070970",
			baseAmount: Money.fromCents(100000, "PEN"),
			appliedAt,
		});
		mockRepo.retencionRepository.findById.mockResolvedValue(retencion);

		const eventBus = createEventBus();

		await declareRetention(
			{ retentionId: retencion.id, pdtReference: "PDT626-2026-03-001" },
			{ eventBus },
		);

		expect(mockRepo.retencionRepository.update).toHaveBeenCalledTimes(1);
		expect(eventBus.publish).toHaveBeenCalledWith(
			"taxation.retention.declared",
			expect.objectContaining({
				retentionId: retencion.id,
				pdtReference: "PDT626-2026-03-001",
			}),
		);
	});

	it("cancels a pending retention", async () => {
		const [retencion] = Retencion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			supplierRuc: "20100070970",
			baseAmount: Money.fromCents(100000, "PEN"),
		});
		mockRepo.retencionRepository.findById.mockResolvedValue(retencion);

		const eventBus = createEventBus();

		await cancelRetention(
			{ retentionId: retencion.id, reason: "Factura anulada por proveedor" },
			{ eventBus },
		);

		expect(mockRepo.retencionRepository.update).toHaveBeenCalledTimes(1);
		expect(eventBus.publish).toHaveBeenCalledWith(
			"taxation.retention.cancelled",
			expect.objectContaining({
				retentionId: retencion.id,
				reason: "Factura anulada por proveedor",
			}),
		);
	});

	it("rejects cancel on already-paid retention", async () => {
		const [retencion] = Retencion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			supplierRuc: "20100070970",
			baseAmount: Money.fromCents(100000, "PEN"),
		});
		const [declared] = retencion.declare("PDT626-2026-03-001");
		const [paid] = declared.markPaid("txn-1");
		mockRepo.retencionRepository.findById.mockResolvedValue(paid);

		await expect(
			cancelRetention(
				{ retentionId: paid.id, reason: "Factura anulada" },
				{ eventBus: createEventBus() },
			),
		).rejects.toThrow();
		expect(mockRepo.retencionRepository.update).not.toHaveBeenCalled();
	});

	it("returns pending retentions with overdue detection", async () => {
		const today = new Date("2026-04-28T12:00:00.000Z");
		vi.useFakeTimers().setSystemTime(today);

		const [pending] = Retencion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			supplierRuc: "20100070970",
			baseAmount: Money.fromCents(200000, "PEN"),
			appliedAt: new Date("2026-03-20T10:00:00.000Z"),
		});

		const declared = (() => {
			const [d] = pending.declare("PDT626-2026-03-001");
			return d;
		})();

		const pendingWithStatus = Object.assign(pending, {
			status: "PENDING" as RetentionStatus,
		});
		const declaredWithStatus = Object.assign(declared, {
			status: "DECLARED" as RetentionStatus,
		});

		mockRepo.retencionRepository.findByStatus.mockImplementation(
			(_companyId: string, status: string) => {
				if (status === "PENDING") return Promise.resolve([pendingWithStatus]);
				if (status === "DECLARED") return Promise.resolve([declaredWithStatus]);
				return Promise.resolve([]);
			},
		);

		const result = await getPendingRetentions({
			companyId: "cmp-1",
		});

		expect(result.count).toBe(2);
		expect(result.hasOverdue).toBe(true);
		expect(result.totalRetentionAmount).toBe(120);
	});

	it("returns retention summary grouped by status", async () => {
		const [pending] = Retencion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			supplierRuc: "20100070970",
			baseAmount: Money.fromCents(100000, "PEN"),
		});
		const [declared] = pending.declare("PDT626-2026-03-001");

		const pendingWithStatus = Object.assign(pending, {
			status: "PENDING" as RetentionStatus,
		});
		const declaredWithStatus = Object.assign(declared, {
			status: "DECLARED" as RetentionStatus,
		});

		mockRepo.retencionRepository.findByDeclarationPeriod.mockResolvedValue([
			pendingWithStatus,
			declaredWithStatus,
		]);

		const result = await getRetentionSummary({
			companyId: "cmp-1",
			declarationPeriod: "2026-03",
		});

		expect(result).toMatchObject({
			declarationPeriod: "2026-03",
			retentionCount: 2,
			totalRetentionAmount: 60,
			byStatus: {
				PENDING: 1,
				DECLARED: 1,
				PAID: 0,
				CANCELLED: 0,
			},
		});
	});
});
