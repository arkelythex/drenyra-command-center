import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExpedienteCard } from "../components/ExpedienteCard";
import { ExpedienteFilters } from "../components/ExpedienteFilters";
import type { ExpedienteFiscal } from "@drenyra/domain";

const expediente: ExpedienteFiscal = {
	id: "EXP-1",
	companyRuc: "20123456789",
	companyName: "Drenyra SAC",
	periodo: "2026-04",
	kind: "SIRE_COMPRAS",
	status: "PENDIENTE_APROBACION",
	titulo: "SIRE Compras Abril",
	descripcion: "Validación de compras.",
	createdAt: "2026-04-01T00:00:00Z",
	updatedAt: "2026-04-01T00:00:00Z",
	acciones: [],
	documentos: [],
	evidencia: [],
	requiredApprovers: [],
	approvedBy: [],
	globalRiskLevel: "MEDIUM",
	pendingActions: 3,
	totalDocuments: 4,
};

describe("expediente components", () => {
	it("renders the expediente identity, status, and pending actions", () => {
		render(<ExpedienteCard expediente={expediente} isSelected={false} onSelect={vi.fn()} />);
		expect(screen.getByText("SIRE Compras Abril")).toBeInTheDocument();
		expect(screen.getByText("Drenyra SAC")).toBeInTheDocument();
		expect(screen.getByText("3 acciones pendientes")).toBeInTheDocument();
	});

	it("selects an expediente when its card is clicked", () => {
		const onSelect = vi.fn();
		render(<ExpedienteCard expediente={expediente} isSelected={false} onSelect={onSelect} />);
		fireEvent.click(screen.getByRole("button"));
		expect(onSelect).toHaveBeenCalledWith(expediente);
	});

	it("forwards search text and selected kind changes", () => {
		const onSearchChange = vi.fn();
		const onKindChange = vi.fn();
		render(
			<ExpedienteFilters
				searchQuery=""
				onSearchChange={onSearchChange}
				selectedKind="ALL"
				onKindChange={onKindChange}
			/>,
		);
		fireEvent.change(screen.getByLabelText("Buscar expediente"), { target: { value: "abril" } });
		fireEvent.click(screen.getByRole("button", { name: "SIRE Compras" }));
		expect(onSearchChange).toHaveBeenCalledWith("abril");
		expect(onKindChange).toHaveBeenCalledWith("SIRE_COMPRAS");
	});
});
