import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeclaracionAgent } from "../phase-agents/declaracion.agent";

const ple = {
	cantidadComprobantes: 12,
	totalVentas: 1000,
	totalCompras: 400,
	igvVentas: 180,
	igvCompras: 72,
};
const base = {
	ruc: "20123456789",
	periodo: "2026-06",
	tipoDeclaracion: "SIRE" as const,
};

const service = (reply: Record<string, unknown>) => {
	const submitPeriodDeclaration = vi.fn(async () => reply);
	return { svc: { submitPeriodDeclaration } as never, submitPeriodDeclaration };
};

describe("DeclaracionAgent (characterization)", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-07-01T10:00:00.000Z"));
	});
	afterEach(() => vi.useRealTimers());

	it.each([
		["mock: complete", { ...base, resumenPLE: ple }],
		["mock: without PLE", { ...base }],
		[
			"mock: without PLE and detracciones missing constancia",
			{
				...base,
				detracciones: [
					{ tipo: "x", monto: 1 },
					{ tipo: "y", monto: 2, constancia: "c" },
				],
			},
		],
		[
			"mock: complete with detracciones",
			{ ...base, resumenPLE: ple, detracciones: [{ tipo: "x", monto: 1 }] },
		],
	])("pins the report: %s", async (_n, input) => {
		expect(await new DeclaracionAgent().execute(input)).toMatchSnapshot();
	});

	it.each([
		[
			"accepted with ticket",
			{
				success: true,
				ticketNumber: "T-1",
				cdrId: "CDR-9",
				cdrStatus: "ACEPTADO",
				acceptedAt: "2026-06-30T00:00:00.000Z",
			},
		],
		[
			"observed, no ticket, no acceptedAt",
			{ success: true, cdrId: "CDR-8", cdrStatus: "OBSERVADO" },
		],
		[
			"rejected with error",
			{ success: false, cdrStatus: "RECHAZADO", error: "boom" },
		],
		["failure without error text", { success: false }],
	])("pins the report with the real service: %s", async (_n, reply) => {
		const { svc } = service(reply);
		expect(
			await new DeclaracionAgent(svc).execute({ ...base, resumenPLE: ple }),
		).toMatchSnapshot();
	});

	it("maps the PLE summary and xml to the service request (totalIgv = sales + purchases)", async () => {
		const { svc, submitPeriodDeclaration } = service({ success: true });
		await new DeclaracionAgent(svc).execute({
			...base,
			resumenPLE: ple,
			xmlContent: "<x/>",
		});
		expect(submitPeriodDeclaration).toHaveBeenCalledWith({
			ruc: base.ruc,
			periodo: base.periodo,
			tipoDeclaracion: "SIRE",
			xmlContent: "<x/>",
			summary: {
				totalInvoiceCount: 12,
				totalSalesAmount: 1000,
				totalPurchaseAmount: 400,
				totalIgv: 252,
			},
		});
	});

	it("without PLE the service summary is all zeros", async () => {
		const { svc, submitPeriodDeclaration } = service({ success: true });
		await new DeclaracionAgent(svc).execute({ ...base });
		const call = (submitPeriodDeclaration.mock.calls[0] as unknown[])[0] as {
			summary: unknown;
		};
		expect(call.summary).toEqual({
			totalInvoiceCount: 0,
			totalSalesAmount: 0,
			totalPurchaseAmount: 0,
			totalIgv: 0,
		});
	});
});
