// @vitest-environment happy-dom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...props }: Record<string, unknown>) => (
			<div {...props} data-motion="div">
				{children as React.ReactNode}
			</div>
		),
		span: ({ children, ...props }: Record<string, unknown>) => (
			<span {...props} data-motion="span">
				{children as React.ReactNode}
			</span>
		),
	},
	AnimatePresence: ({ children }: Record<string, unknown>) => (
		<>{children as React.ReactNode}</>
	),
	useReducedMotion: () => false,
	useMotionValue: (_v: number) => ({ get: () => _v }),
}));

describe("DrenyraWorkspacePreview", () => {
	afterEach(() => {
		cleanup();
	});

	const renderComponent = async () => {
		const { DrenyraWorkspacePreview } = await import(
			"../drenyra-workspace-preview"
		);
		return render(<DrenyraWorkspacePreview />);
	};

	it("renders without crashing", async () => {
		const { container } = await renderComponent();
		expect(container.firstChild).toBeTruthy();
	});

	it("renders brand, workspace badge, and status bar", async () => {
		await renderComponent();

		expect(screen.getByText("Arkelythex / Drenyra")).toBeTruthy();
		expect(screen.getByText("Active Workspace")).toBeTruthy();
		expect(screen.getByText(/Drenyra Cognitive Interface/)).toBeTruthy();
	});

	it("renders company info with RUC", async () => {
		await renderComponent();

		expect(screen.getByText("Inversiones Drenyra S.A.C.")).toBeTruthy();
		const rucElements = screen.getAllByText("20608492015");
		expect(rucElements.length).toBeGreaterThanOrEqual(1);
	});

	it("renders navigation spine and subagentes", async () => {
		await renderComponent();

		for (const label of ["Overview", "Documents", "SIRE", "Settings"]) {
			expect(screen.getByText(label)).toBeTruthy();
		}
		expect(screen.getByText("Subagentes")).toBeTruthy();
		expect(screen.getByText("Eviden node")).toBeTruthy();
		expect(screen.getByText("Regula node")).toBeTruthy();
	});

	it("renders fiscal health indicators (score, severity, risk text)", async () => {
		await renderComponent();

		expect(screen.getByText("Score")).toBeTruthy();
		const scoreElements = screen.getAllByText("620");
		expect(scoreElements.length).toBe(2);
		const riesgoElements = screen.getAllByText("Crítico");
		expect(riesgoElements.length).toBe(2);
	});

	it("renders money values formatted with S/.", async () => {
		await renderComponent();

		expect(screen.getByText(/S\/\. 1,248\.40/)).toBeTruthy();
		expect(screen.getByText(/S\/\. 8183\.96/)).toBeTruthy();
	});

	it("renders evidence stack with documents and rotate action", async () => {
		await renderComponent();

		expect(screen.getByText("Evidence Stack (CPE / Banco)")).toBeTruthy();
		expect(screen.getByText("CPE E001-8422")).toBeTruthy();
		expect(screen.getByText("Rotar pila")).toBeTruthy();
	});

	it("renders reconciliation timeline with steps", async () => {
		await renderComponent();

		expect(screen.getByText("Reconciliation Timeline")).toBeTruthy();
		expect(screen.getByText("Factura Emitida")).toBeTruthy();
		expect(screen.getByText("SIRE Preparado")).toBeTruthy();
	});

	it("renders Drenyra Action Card with findings and actions", async () => {
		await renderComponent();

		expect(screen.getByText("Severidad")).toBeTruthy();
		expect(screen.getByText("Drenyra Halló:")).toBeTruthy();
		expect(
			screen.getByText(/3 inconsistencias de IGV encontradas/),
		).toBeTruthy();
	});

	it("switches themes on button click", async () => {
		const { container } = await renderComponent();
		const outerDiv = container.firstChild as HTMLElement;

		expect(outerDiv.style.getPropertyValue("--bg-base")).toBe("#F3E7D8");

		fireEvent.click(
			screen.getByTitle("Identity pública - Perla / Grafito"),
		);
		expect(outerDiv.style.getPropertyValue("--bg-base")).toBe("#F7F4EE");

		fireEvent.click(
			screen.getByTitle("Modo Power User - OLED / Sage"),
		);
		expect(outerDiv.style.getPropertyValue("--bg-base")).toBe("#090604");
	});

	it("switches months and updates content", async () => {
		await renderComponent();

		const riesgoElements = screen.getAllByText("Crítico");
		expect(riesgoElements.length).toBe(2);

		fireEvent.click(screen.getByText("jan"));
		const soberanoElements = screen.getAllByText("Soberano");
		expect(soberanoElements.length).toBe(2);
		const scoreJan = screen.getAllByText("985");
		expect(scoreJan.length).toBe(2);

		fireEvent.click(screen.getByText("mar"));
		const revisarElements = screen.getAllByText("Revisar");
		expect(revisarElements.length).toBe(2);
		const scoreMar = screen.getAllByText("840");
		expect(scoreMar.length).toBe(2);
	});

	it("approves month and shows sealed indicator", async () => {
		await renderComponent();

		expect(screen.getByText("Aprobar y Sellar")).toBeTruthy();

		fireEvent.click(screen.getByText("Aprobar y Sellar"));
		expect(screen.getByText("Seal Evidencia Aprobado")).toBeTruthy();
	});

	it("rotates document stack on click", async () => {
		await renderComponent();

		expect(screen.getByText("CPE E001-8422")).toBeTruthy();

		fireEvent.click(screen.getByText("Rotar pila"));
		expect(screen.getByText("CPE F003-10492")).toBeTruthy();

		fireEvent.click(screen.getByText("Rotar pila"));
		expect(screen.getByText("BANCO N-40291")).toBeTruthy();
	});

	it("toggles audit lens on and off", async () => {
		await renderComponent();

		expect(screen.getByText("Activar Trazabilidad (Audit)")).toBeTruthy();

		fireEvent.click(screen.getByText("Activar Trazabilidad (Audit)"));
		expect(screen.getByText("Trazabilidad Activa")).toBeTruthy();

		fireEvent.click(screen.getByText("Trazabilidad Activa"));
		expect(screen.getByText("Activar Trazabilidad (Audit)")).toBeTruthy();
	});
});
