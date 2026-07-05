import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({
	triggerMock: vi.fn(),
}));

const { triggerSireDemoExportMock } = vi.hoisted(() => ({
	triggerSireDemoExportMock: vi.fn(),
}));

const { toastSuccessMock } = vi.hoisted(() => ({
	toastSuccessMock: vi.fn(),
}));

const { useSireDemoSummaryMock } = vi.hoisted(() => ({
	useSireDemoSummaryMock: vi.fn(),
}));

vi.mock("@/hooks/useHaptics", () => ({
	useHaptics: () => ({
		trigger: triggerMock,
	}),
}));

vi.mock("sonner", () => ({
	toast: {
		success: toastSuccessMock,
	},
}));

vi.mock("@/lib/use-active-company-context", () => ({
	useActiveCompanyContext: () => ({
		companyContext: {
			companyId: "00000000-0000-0000-0000-000000000001",
			companyName: "NEBULA OPERACIONES LOGISTICAS S.A.C.",
			ruc: "20608451231",
			isDemoFallback: true,
		},
		availableCompanies: [],
		setActiveCompanyById: vi.fn(),
	}),
}));

vi.mock("@/features/compliance/lib/sire-demo-export", () => ({
	SIRE_DEMO_EXPORT_PERIOD: "2026-03",
	SIRE_DEMO_EXPORT_PERIOD_LABEL: "Marzo 2026",
	triggerSireDemoExport: triggerSireDemoExportMock,
}));

vi.mock("@/features/compliance/hooks/useSireDemoSummary", () => ({
	useSireDemoSummary: () => useSireDemoSummaryMock(),
}));

import { SireManagementTab } from "../SireManagementTab";

describe("SireManagementTab", () => {
	beforeEach(() => {
		useSireDemoSummaryMock.mockReturnValue({
			data: {
				period: "2026-03",
				source: "demo-seed",
				generatedAt: "2026-03-31T18:45:00.000Z",
				sales: {
					recordCount: 4,
					warningCount: 0,
					isValid: true,
				},
				purchases: {
					recordCount: 3,
					warningCount: 0,
					isValid: true,
				},
				matches: 7,
				differences: 0,
				previewRows: [
					{
						icon: "file",
						id: "F001-0000101",
						provider: "Cliente Demo Retail SAC",
						sunatStatus: "Observado",
						internalStatus: "En Proceso",
						amount: "S/ 118.00",
						date: "15 MAR",
						isCritical: true,
					},
					{
						icon: "file",
						id: "B001-000145",
						provider: "Proveedor Demo Norte SAC",
						sunatStatus: "Registrado",
						internalStatus: "Registrado",
						amount: "S/ 236.00",
						date: "16 MAR",
					},
				],
			},
			isLoading: false,
			isError: false,
		});
	});

	it("renders SIRE summary and shows export feedback on top actions", () => {
		render(<SireManagementTab />);

		expect(screen.getByText("Comparativa SIRE vs Libros")).toBeInTheDocument();
		expect(screen.getByText("Marzo 2026")).toBeInTheDocument();
		expect(
			screen.getByText(
				/export demo anclado al dataset seed de marzo 2026 para validación del pitch/i,
			),
		).toBeInTheDocument();
		expect(screen.getByText("Resumen verificado")).toBeInTheDocument();
		expect(
			screen.getByText(
				/resumen sire confirmado contra el dataset demo del backend/i,
			),
		).toBeInTheDocument();
		expect(
			screen.getByText("Ultima verificacion: 31/03/2026 13:45 PET"),
		).toBeInTheDocument();
		expect(screen.getByText("4")).toBeInTheDocument();
		expect(screen.getAllByText("3").length).toBeGreaterThan(0);
		expect(screen.getAllByText("0").length).toBeGreaterThan(0);
		expect(screen.getAllByText("7").length).toBeGreaterThan(0);
		expect(screen.getByText("Cliente Demo Retail SAC")).toBeInTheDocument();
		expect(screen.getByText("Proveedor Demo Norte SAC")).toBeInTheDocument();
		expect(screen.getByText("Observado")).toBeInTheDocument();
		expect(screen.getAllByText("En Proceso").length).toBeGreaterThan(0);
		expect(screen.getAllByRole("row")).toHaveLength(3);

		fireEvent.click(screen.getByRole("button", { name: /rvie txt/i }));
		expect(screen.getByText("Descarga iniciada")).toBeInTheDocument();
		expect(
			screen.getByText("RVIE Ventas TXT listo para Marzo 2026"),
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: /rce excel/i }));
		expect(
			screen.getByText("RCE Compras Excel listo para Marzo 2026"),
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: /aceptar propuesta/i }));

		expect(triggerMock).toHaveBeenCalledWith("light");
		expect(triggerMock).toHaveBeenCalledWith("success");
		expect(toastSuccessMock).toHaveBeenCalledWith("Descarga SIRE iniciada", {
			description: "RVIE Ventas TXT listo para Marzo 2026.",
		});
		expect(toastSuccessMock).toHaveBeenCalledWith("Descarga SIRE iniciada", {
			description: "RCE Compras Excel listo para Marzo 2026.",
		});
		expect(triggerSireDemoExportMock).toHaveBeenCalledWith({
			companyId: "00000000-0000-0000-0000-000000000001",
			ledgerType: "ventas",
			format: "TXT",
			period: "2026-03",
		});
		expect(triggerSireDemoExportMock).toHaveBeenCalledWith({
			companyId: "00000000-0000-0000-0000-000000000001",
			ledgerType: "compras",
			format: "EXCEL",
			period: "2026-03",
		});
	});

	it("shows a loading state instead of fallback rows while summary is pending", () => {
		useSireDemoSummaryMock.mockReturnValue({
			data: undefined,
			isLoading: true,
			isError: false,
		});

		render(<SireManagementTab />);

		expect(screen.getByText("Cargando preview SIRE...")).toBeInTheDocument();
		expect(screen.getByText("Resumen sincronizando")).toBeInTheDocument();
		expect(
			screen.getByText("Ultima verificacion pendiente"),
		).toBeInTheDocument();
		expect(screen.getAllByText("Cargando").length).toBeGreaterThan(0);
		expect(screen.getByText("... Coincidencias")).toBeInTheDocument();
		expect(
			screen.queryByText("Cliente Demo Retail SAC"),
		).not.toBeInTheDocument();
	});

	it("shows an explicit error state when summary fetch fails", () => {
		useSireDemoSummaryMock.mockReturnValue({
			data: undefined,
			isLoading: false,
			isError: true,
		});

		render(<SireManagementTab />);

		expect(screen.getAllByText("Resumen no disponible").length).toBeGreaterThan(
			0,
		);
		expect(
			screen.getByText(/se muestra estado sin datos/i),
		).toBeInTheDocument();
		expect(
			screen.getByText("Ultima verificacion pendiente"),
		).toBeInTheDocument();
		expect(screen.getAllByText("Sin datos").length).toBeGreaterThan(0);
		expect(screen.getByText("— Coincidencias")).toBeInTheDocument();
		expect(
			screen.getByText(
				"No se pudo cargar el preview SIRE para este periodo demo.",
			),
		).toBeInTheDocument();
	});
});
