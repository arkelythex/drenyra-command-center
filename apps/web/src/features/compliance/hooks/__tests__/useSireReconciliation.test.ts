import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { parseSireFileMock, loadLocalSireRecordsMock } = vi.hoisted(() => ({
	parseSireFileMock: vi.fn(),
	loadLocalSireRecordsMock: vi.fn(),
}));

vi.mock("../../services/sire-local-records", () => ({
	loadLocalSireRecords: loadLocalSireRecordsMock,
}));

vi.mock("../../services/sire-parser", () => ({
	parseSireFile: parseSireFileMock,
}));

import { useSireReconciliation } from "../useSireReconciliation";

describe("useSireReconciliation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		loadLocalSireRecordsMock.mockResolvedValue([]);
	});

	it("starts with no local records and an empty SUNAT file state", () => {
		const { result } = renderHook(() => useSireReconciliation());

		expect(result.current.localRecords).toEqual([]);
		expect(result.current.sunatRecords).toEqual([]);
		expect(result.current.discrepancies).toEqual([]);
		expect(result.current.stats).toBeNull();
	});

	it("reconciles the SUNAT file against the company's books from the API", async () => {
		const sunatRecord = {
			periodo: "202501",
			caratula: "RCE",
			rucEmisor: "20100000001",
			razonSocial: "PROVEEDOR A S.A.C.",
			tipoComprobante: "01",
			serie: "F001",
			numero: "00001234",
			fechaEmision: "2025-01-10",
			moneda: "PEN",
			baseImponible: 1000,
			igv: 180,
			total: 1180,
			estado: "ACTIVO",
			origen: "SUNAT",
		};
		const localRecord = {
			...sunatRecord,
			origen: "ARKELYTHEX",
			numero: "1234",
		};
		parseSireFileMock.mockResolvedValue([sunatRecord]);
		loadLocalSireRecordsMock.mockResolvedValue([localRecord]);

		const { result } = renderHook(() => useSireReconciliation());
		await act(async () => {
			await result.current.processFile(new File(["x"], "rce.txt"));
		});
		await waitFor(() => {
			expect(result.current.stats).not.toBeNull();
		});

		expect(loadLocalSireRecordsMock).toHaveBeenCalledWith([sunatRecord]);
		expect(result.current.localRecords).toEqual([localRecord]);
		expect(result.current.discrepancies).toEqual([]);
		expect(result.current.stats).toMatchObject({ matchCount: 1 });
	});

	it("shows the error when the company's books cannot be loaded", async () => {
		parseSireFileMock.mockResolvedValue([]);
		loadLocalSireRecordsMock.mockRejectedValue(
			new Error("No hay una empresa activa"),
		);

		const { result } = renderHook(() => useSireReconciliation());
		await act(async () => {
			await result.current.processFile(new File(["x"], "rce.txt"));
		});

		await waitFor(() => {
			expect(result.current.error).toBe("No hay una empresa activa");
		});
		expect(result.current.stats).toBeNull();
	});

	it("flags every SUNAT record as missing in Drenyra when the books are empty", async () => {
		parseSireFileMock.mockResolvedValue([
			{
				periodo: "202501",
				caratula: "RVIE",
				rucEmisor: "20100000001",
				razonSocial: "PROVEEDOR A S.A.C.",
				tipoComprobante: "01",
				serie: "F001",
				numero: "00001234",
				fechaEmision: "2025-01-10",
				moneda: "PEN",
				baseImponible: 1000,
				igv: 180,
				total: 1180,
				estado: "ACTIVO",
				origen: "SUNAT",
			},
			{
				periodo: "202501",
				caratula: "RVIE",
				rucEmisor: "20300000003",
				razonSocial: "PROVEEDOR C S.A.",
				tipoComprobante: "01",
				serie: "F001",
				numero: "00000999",
				fechaEmision: "2025-01-20",
				moneda: "PEN",
				baseImponible: 300,
				igv: 54,
				total: 354,
				estado: "ACTIVO",
				origen: "SUNAT",
			},
			{
				periodo: "202501",
				caratula: "RVIE",
				rucEmisor: "20200000002",
				razonSocial: "PROVEEDOR B E.I.R.L.",
				tipoComprobante: "01",
				serie: "F001",
				numero: "00000567",
				fechaEmision: "2025-01-15",
				moneda: "USD",
				baseImponible: 500,
				igv: 90,
				total: 590,
				estado: "ACTIVO",
				origen: "SUNAT",
			},
		]);

		const { result } = renderHook(() => useSireReconciliation());
		const file = new File(["mock"], "sire.txt", { type: "text/plain" });

		await act(async () => {
			await result.current.processFile(file);
		});

		await waitFor(() => {
			expect(result.current.isProcessing).toBe(false);
		});

		expect(result.current.sunatRecords).toHaveLength(3);
		// Nothing registered locally yet: every SUNAT record is missing in Drenyra.
		expect(result.current.discrepancies).toHaveLength(3);
		expect(result.current.discrepancies).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					type: "MISSING_IN_ARKELYTHEX",
					severity: "HIGH",
				}),
			]),
		);
		expect(
			result.current.discrepancies.every(
				(d) => d.type === "MISSING_IN_ARKELYTHEX",
			),
		).toBe(true);
		expect(result.current.stats).toMatchObject({
			// Totals count PEN only; the USD record is excluded.
			totalSunat: 1534,
			totalLocal: 0,
			discrepancyCount: 3,
			igvGap: 234,
		});
	});

	it("handles parser errors and resets processing state", async () => {
		parseSireFileMock.mockRejectedValue(new Error("parse failed"));

		const { result } = renderHook(() => useSireReconciliation());
		const file = new File(["bad"], "invalid.txt", { type: "text/plain" });

		await act(async () => {
			await result.current.processFile(file);
		});

		expect(result.current.error).toBe("parse failed");
		expect(result.current.sunatRecords).toEqual([]);
		expect(result.current.isProcessing).toBe(false);
	});
});
