import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RiskExecutiveSummary } from "../RiskExecutiveSummary";

describe("RiskExecutiveSummary", () => {
	it("renders contextual labels and uses a task-oriented review action", () => {
		const setShowDecisionGate = vi.fn();

		render(
			<RiskExecutiveSummary
				riskExposure={12500}
				complianceScore={78}
				decisionStatusLabel="Aprobación humana obligatoria"
				showDecisionGate
				setShowDecisionGate={setShowDecisionGate}
			/>,
		);

		expect(screen.getByText("Revisión Humana Obligatoria")).toBeInTheDocument();
		expect(
			screen.getByText("Aprobación pendiente de cierre mensual"),
		).toBeInTheDocument();
		expect(screen.getByText("Estado de Autonomía")).toBeInTheDocument();
		expect(
			screen.getByText("Aprobación humana obligatoria"),
		).toBeInTheDocument();
		expect(screen.getByText("Siguiente Acción Crítica")).toBeInTheDocument();
		expect(
			screen.getByText(/Validar conciliación bancaria BCP/i),
		).toBeInTheDocument();
		expect(screen.getByText("Métricas de Riesgo")).toBeInTheDocument();
		expect(screen.getByText("Exposición por Cobrar")).toBeInTheDocument();
		expect(screen.getByText("Compliance SUNAT")).toBeInTheDocument();

		fireEvent.click(
			screen.getByRole("button", { name: /Ingresar al Expediente de Cierre/i }),
		);

		expect(setShowDecisionGate).toHaveBeenCalledWith(false);
	});
});
