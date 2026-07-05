import { Money } from "@drenyra/domain/value-objects/Money";
import type { EventBusPort } from "@drenyra/infrastructure/events/event.port";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	Percepcion,
	type PercepcionStatus,
} from "../../domain/entities/percepcion.entity";

const mockRepo = vi.hoisted(() => ({
	percepcionRepository: {
		findByBillId: vi.fn(),
		findById: vi.fn(),
		findByStatus: vi.fn(),
		findByDeclarationPeriod: vi.fn(),
		save: vi.fn(),
		update: vi.fn(),
	},
}));

vi.mock("../../infrastructure/percepcion.repository", () => mockRepo);

import {
	applyPercepcion,
	PercepcionApplyError,
} from "../../application/commands/apply-percepcion.command";
import { cancelPercepcion } from "../../application/commands/cancel-percepcion.command";
import { declarePercepcion } from "../../application/commands/declare-percepcion.command";
import { markPercepcionPaid } from "../../application/commands/mark-percepcion-paid.command";
import { getPendingPercepciones } from "../../application/queries/get-pending-percepciones.query";
import { getPercepcionSummary } from "../../application/queries/get-percepcion-summary.query";

const createEventBus = () =>
	({
		publish: vi.fn().mockResolvedValue(undefined),
	}) as unknown as EventBusPort;

describe("percepcion handlers and queries", () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	it("applies a percepcion, persists it and publishes taxation.percepcion.applied", async () => {
		mockRepo.percepcionRepository.findByBillId.mockResolvedValue(null);
		mockRepo.percepcionRepository.save.mockResolvedValue();

		const eventBus = createEventBus();

		const result = await applyPercepcion(
			{
				companyId: "cmp-1",
				billId: "bill-1",
				agentRuc: "20100070970",
				percepcionType: "VENTA_INTERNA",
				totalAmountCents: 100000,
			},
			{ eventBus },
		);

		expect(mockRepo.percepcionRepository.save).toHaveBeenCalledTimes(1);
		expect(eventBus.publish).toHaveBeenCalledWith(
			"taxation.percepcion.applied",
			expect.objectContaining({
				companyId: "cmp-1",
				billId: "bill-1",
				agentRuc: "20100070970",
				totalAmountCents: 100000,
				percepcionAmountCents: 2000,
			}),
		);
		expect(result).toMatchObject({
			percepcionAmountCents: 2000,
			declarationPeriod: expect.stringMatching(/^\d{4}-\d{2}$/),
		});
	});

	it("rejects duplicate active percepcion for the same bill", async () => {
		mockRepo.percepcionRepository.findByBillId.mockResolvedValue({
			id: "existing-per-1",
			status: "PENDING",
		} as import("../../domain/entities/percepcion.entity").Percepcion);

		await expect(
			applyPercepcion(
				{
					companyId: "cmp-1",
					billId: "bill-1",
					agentRuc: "20100070970",
					percepcionType: "VENTA_INTERNA",
					totalAmountCents: 100000,
				},
				{ eventBus: createEventBus() },
			),
		).rejects.toThrow(PercepcionApplyError);
		expect(mockRepo.percepcionRepository.save).not.toHaveBeenCalled();
	});

	it("marks a percepcion paid", async () => {
		const appliedAt = new Date("2026-03-15T10:00:00.000Z");
		const [percepcion] = Percepcion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			agentRuc: "20100070970",
			percepcionType: "VENTA_INTERNA",
			totalAmount: Money.fromCents(100000, "PEN"),
			appliedAt,
		});
		const [declared] = percepcion.declare("PDT-621-2026-03-001");
		mockRepo.percepcionRepository.findById.mockResolvedValue(declared);
		mockRepo.percepcionRepository.update.mockResolvedValue();

		const eventBus = createEventBus();

		await markPercepcionPaid(
			{ percepcionId: declared.id, bankTransactionId: "txn-1" },
			{ eventBus },
		);

		expect(mockRepo.percepcionRepository.update).toHaveBeenCalledTimes(1);
		expect(eventBus.publish).toHaveBeenCalledWith(
			"taxation.percepcion.paid",
			expect.objectContaining({
				percepcionId: declared.id,
				bankTransactionId: "txn-1",
			}),
		);
	});

	it("rejects pay on already-paid percepcion", async () => {
		const [percepcion] = Percepcion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			agentRuc: "20100070970",
			percepcionType: "VENTA_INTERNA",
			totalAmount: Money.fromCents(100000, "PEN"),
		});
		const [declared] = percepcion.declare("PDT-621-2026-03-001");
		const [paid] = declared.markPaid("txn-1");
		mockRepo.percepcionRepository.findById.mockResolvedValue(paid);

		await expect(
			markPercepcionPaid(
				{ percepcionId: paid.id, bankTransactionId: "txn-2" },
				{ eventBus: createEventBus() },
			),
		).rejects.toThrow();
		expect(mockRepo.percepcionRepository.update).not.toHaveBeenCalled();
	});

	it("declares a percepcion in PDT", async () => {
		const appliedAt = new Date("2026-03-10T12:00:00.000Z");
		const [percepcion] = Percepcion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			agentRuc: "20100070970",
			percepcionType: "VENTA_INTERNA",
			totalAmount: Money.fromCents(100000, "PEN"),
			appliedAt,
		});
		mockRepo.percepcionRepository.findById.mockResolvedValue(percepcion);

		const eventBus = createEventBus();

		await declarePercepcion(
			{ percepcionId: percepcion.id, pdtReference: "PDT-621-2026-03-001" },
			{ eventBus },
		);

		expect(mockRepo.percepcionRepository.update).toHaveBeenCalledTimes(1);
		expect(eventBus.publish).toHaveBeenCalledWith(
			"taxation.percepcion.declared",
			expect.objectContaining({
				percepcionId: percepcion.id,
				pdtReference: "PDT-621-2026-03-001",
			}),
		);
	});

	it("cancels a pending percepcion", async () => {
		const [percepcion] = Percepcion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			agentRuc: "20100070970",
			percepcionType: "VENTA_INTERNA",
			totalAmount: Money.fromCents(100000, "PEN"),
		});
		mockRepo.percepcionRepository.findById.mockResolvedValue(percepcion);

		const eventBus = createEventBus();

		await cancelPercepcion(
			{ percepcionId: percepcion.id, reason: "Factura anulada por proveedor" },
			{ eventBus },
		);

		expect(mockRepo.percepcionRepository.update).toHaveBeenCalledTimes(1);
		expect(eventBus.publish).toHaveBeenCalledWith(
			"taxation.percepcion.cancelled",
			expect.objectContaining({
				percepcionId: percepcion.id,
				reason: "Factura anulada por proveedor",
			}),
		);
	});

	it("rejects cancel on already-paid percepcion", async () => {
		const [percepcion] = Percepcion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			agentRuc: "20100070970",
			percepcionType: "VENTA_INTERNA",
			totalAmount: Money.fromCents(100000, "PEN"),
		});
		const [declared] = percepcion.declare("PDT-621-2026-03-001");
		const [paid] = declared.markPaid("txn-1");
		mockRepo.percepcionRepository.findById.mockResolvedValue(paid);

		await expect(
			cancelPercepcion(
				{ percepcionId: paid.id, reason: "Factura anulada" },
				{ eventBus: createEventBus() },
			),
		).rejects.toThrow();
		expect(mockRepo.percepcionRepository.update).not.toHaveBeenCalled();
	});

	it("returns pending percepciones with overdue detection", async () => {
		const today = new Date("2026-04-28T12:00:00.000Z");
		vi.useFakeTimers().setSystemTime(today);

		const [pending] = Percepcion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			agentRuc: "20100070970",
			percepcionType: "VENTA_INTERNA",
			totalAmount: Money.fromCents(200000, "PEN"),
			appliedAt: new Date("2026-03-20T10:00:00.000Z"),
		});

		const declared = (() => {
			const [d] = pending.declare("PDT-621-2026-03-001");
			return d;
		})();

		const pendingWithStatus = Object.assign(pending, {
			status: "PENDING" as PercepcionStatus,
		});
		const declaredWithStatus = Object.assign(declared, {
			status: "DECLARED" as PercepcionStatus,
		});

		mockRepo.percepcionRepository.findByStatus.mockImplementation(
			(_companyId: string, status: string) => {
				if (status === "PENDING") return Promise.resolve([pendingWithStatus]);
				if (status === "DECLARED") return Promise.resolve([declaredWithStatus]);
				return Promise.resolve([]);
			},
		);

		const result = await getPendingPercepciones({
			companyId: "cmp-1",
		});

		expect(result.count).toBe(2);
		expect(result.hasOverdue).toBe(true);
		expect(result.totalPercepcionAmount).toBe(80);
	});

	it("returns percepcion summary grouped by status", async () => {
		const [pending] = Percepcion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			agentRuc: "20100070970",
			percepcionType: "VENTA_INTERNA",
			totalAmount: Money.fromCents(100000, "PEN"),
		});
		const [declared] = pending.declare("PDT-621-2026-03-001");

		const pendingWithStatus = Object.assign(pending, {
			status: "PENDING" as PercepcionStatus,
		});
		const declaredWithStatus = Object.assign(declared, {
			status: "DECLARED" as PercepcionStatus,
		});

		mockRepo.percepcionRepository.findByDeclarationPeriod.mockResolvedValue([
			pendingWithStatus,
			declaredWithStatus,
		]);

		const result = await getPercepcionSummary({
			companyId: "cmp-1",
			declarationPeriod: "2026-03",
		});

		expect(result).toMatchObject({
			declarationPeriod: "2026-03",
			percepcionCount: 2,
			totalPercepcionAmount: 40,
			byStatus: {
				PENDING: 1,
				DECLARED: 1,
				PAID: 0,
				CANCELLED: 0,
			},
		});
	});
});
