import type { CierreMensual } from "@drenyra/domain";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SidePanel } from "../components/SidePanel";

function cierre(over: Record<string, unknown> = {}): CierreMensual {
	return {
		sireStatus: "CONCILIADO",
		bancosStatus: "PENDIENTE",
		igvStatus: "CON_DISCREPANCIAS",
		globalRiskLevel: "MEDIUM",
		firmas: {
			contador: { firmado: true, fecha: "2026-10-02" },
			gerente: { firmado: false },
		},
		agentAnalysis: {
			summary: "Tres comprobantes sin sustento.",
			confidence: 0.87,
			discrepancies: 3,
			recommendations: [
				"Adjuntar las guías de remisión",
				"Revisar detracciones",
			],
		},
		...over,
	} as unknown as CierreMensual;
}

describe("SidePanel", () => {
	it("states the status of each area in words", () => {
		render(<SidePanel cierre={cierre()} onOpenInspector={vi.fn()} />);

		const list = screen.getByRole("list", { name: /estado del cierre/i });
		const rows = within(list).getAllByRole("listitem");
		expect(rows[0]).toHaveTextContent(/SIRE.*Conciliado/);
		expect(rows[1]).toHaveTextContent(/Bancos.*Pendiente/);
		expect(rows[2]).toHaveTextContent(/IGV.*Con discrepancias/);
		expect(rows[3]).toHaveTextContent(/Riesgo.*Con alertas/);
	});

	it("shows the agent's confidence as a whole percentage, never a float artifact", () => {
		render(
			<SidePanel
				cierre={cierre({
					agentAnalysis: {
						summary: "x",
						confidence: 0.58,
						discrepancies: 1,
						recommendations: [],
					},
				})}
				onOpenInspector={vi.fn()}
			/>,
		);

		expect(screen.getByText(/58% de confianza/)).toBeInTheDocument();
		expect(screen.getByText(/1 discrepancia\b/)).toBeInTheDocument();
	});

	it("lists recommendations as a real list", () => {
		render(<SidePanel cierre={cierre()} onOpenInspector={vi.fn()} />);

		const list = screen.getByRole("list", { name: /recomendaciones/i });
		expect(within(list).getAllByRole("listitem")).toHaveLength(2);
	});

	it("shows who signed and who is pending", () => {
		render(<SidePanel cierre={cierre()} onOpenInspector={vi.fn()} />);

		const list = screen.getByRole("list", { name: /firmas requeridas/i });
		const rows = within(list).getAllByRole("listitem");
		expect(rows[0]).toHaveTextContent(/contador.*Firmado 2026-10-02/i);
		expect(rows[1]).toHaveTextContent(/gerente.*Pendiente/i);
	});

	it("opens the fiscal inspector", async () => {
		const onOpenInspector = vi.fn();
		render(<SidePanel cierre={cierre()} onOpenInspector={onOpenInspector} />);

		await userEvent
			.setup()
			.click(screen.getByRole("button", { name: /abrir inspector fiscal/i }));
		expect(onOpenInspector).toHaveBeenCalledOnce();
	});
});
