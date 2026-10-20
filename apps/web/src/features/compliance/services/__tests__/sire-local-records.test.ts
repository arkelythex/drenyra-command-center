import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SireRecord } from "../../types/sire.types";

const { localRecordsGet, routeFor } = vi.hoisted(() => {
	const localRecordsGet = vi.fn();
	return {
		localRecordsGet,
		routeFor: vi.fn(() => ({ "local-records": { get: localRecordsGet } })),
	};
});

vi.mock("@/lib/api-client", () => ({
	api: { api: { sire: { comparison: routeFor } } },
}));

import { ACTIVE_COMPANY_STORAGE_KEY } from "@/lib/company-context";
import { loadLocalSireRecords, sirePeriodOf } from "../sire-local-records";

const sunat = (overrides: Partial<SireRecord> = {}): SireRecord => ({
	periodo: "202501",
	caratula: "RCE",
	rucEmisor: "20100000001",
	razonSocial: "PROVEEDOR A S.A.C.",
	tipoComprobante: "01",
	serie: "F001",
	numero: "1",
	fechaEmision: "2025-01-10",
	moneda: "PEN",
	baseImponible: 1000,
	igv: 180,
	total: 1180,
	estado: "ACTIVO",
	origen: "SUNAT",
	...overrides,
});

function activate(companyId: string) {
	localStorage.setItem(
		ACTIVE_COMPANY_STORAGE_KEY,
		JSON.stringify({
			active: {
				companyId,
				companyName: "Empresa SAC",
				ruc: "20100000099",
				countryCode: "PE",
			},
			available: [],
		}),
	);
}

describe("sirePeriodOf", () => {
	it("takes the register and period from the SUNAT file", () => {
		expect(sirePeriodOf([sunat(), sunat({ numero: "2" })])).toEqual({
			period: "2025-01",
			kind: "RCE",
		});
	});

	it("returns null for an empty file", () => {
		expect(sirePeriodOf([])).toBeNull();
	});

	it("refuses a file that mixes periods or registers", () => {
		expect(() => sirePeriodOf([sunat(), sunat({ periodo: "202502" })])).toThrow(
			/un solo periodo/,
		);
		expect(() => sirePeriodOf([sunat(), sunat({ caratula: "RVIE" })])).toThrow(
			/un solo registro/,
		);
	});
});

describe("loadLocalSireRecords", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
	});

	it("loads the active company's books for the file's period and register", async () => {
		activate("cmp-7");
		// The API sends integer cents; the web SireRecord holds soles.
		const fromApi = {
			...sunat(),
			origen: "ARKELYTHEX",
			baseImponible: 100005,
			igv: 18001,
			total: 118006,
		};
		localRecordsGet.mockResolvedValue({
			data: { success: true, data: [fromApi] },
			error: null,
		});

		await expect(loadLocalSireRecords([sunat()])).resolves.toEqual([
			{
				...fromApi,
				baseImponible: 1000.05,
				igv: 180.01,
				total: 1180.06,
			},
		]);
		expect(routeFor).toHaveBeenCalledWith({ period: "2025-01" });
		expect(localRecordsGet).toHaveBeenCalledWith({
			query: { companyId: "cmp-7", kind: "RCE" },
		});
	});

	it("does not call the API for an empty file", async () => {
		activate("cmp-7");
		await expect(loadLocalSireRecords([])).resolves.toEqual([]);
		expect(localRecordsGet).not.toHaveBeenCalled();
	});

	it("fails instead of reconciling against empty books without a company", async () => {
		await expect(loadLocalSireRecords([sunat()])).rejects.toThrow(
			/empresa activa/,
		);
		expect(localRecordsGet).not.toHaveBeenCalled();
	});

	it("keeps fechaEmision as a string when the client hands back a Date", async () => {
		activate("cmp-7");
		localRecordsGet.mockResolvedValue({
			data: {
				success: true,
				data: [
					{ ...sunat(), total: 118000, fechaEmision: new Date("2025-01-10") },
				],
			},
			error: null,
		});

		const [record] = await loadLocalSireRecords([sunat()]);
		expect(record?.fechaEmision).toBe("2025-01-10");
	});

	it("rejects amounts that are not integer cents", async () => {
		activate("cmp-7");
		localRecordsGet.mockResolvedValue({
			data: { success: true, data: [{ ...sunat(), total: 1180.5 }] },
			error: null,
		});

		await expect(loadLocalSireRecords([sunat()])).rejects.toThrow(/centavos/);
	});

	it("surfaces API failures instead of treating the books as empty", async () => {
		activate("cmp-7");
		localRecordsGet.mockResolvedValue({
			data: null,
			error: { status: 403, value: { error: "Company scope mismatch" } },
		});

		await expect(loadLocalSireRecords([sunat()])).rejects.toThrow(
			"Company scope mismatch",
		);
	});
});
