import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EvidenceBrowserPage } from "../EvidenceBrowserPage";
import { EvidenceDetailPage } from "../EvidenceDetailPage";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
	useParams: () => ({ id: "evidence-123" }),
}));

describe("evidence pages", () => {
	it("renders the browser empty state", () => {
		render(<EvidenceBrowserPage />);
		expect(screen.getByRole("heading", { name: "Evidencia" })).toBeInTheDocument();
		expect(screen.getByText("Sin evidencia registrada")).toBeInTheDocument();
		expect(screen.getByText("Los documentos cargados aparecerán aquí.")).toBeInTheDocument();
	});

	it("updates the browser search and filter controls", () => {
		render(<EvidenceBrowserPage />);
		const search = screen.getByPlaceholderText("Buscar por nombre...");
		fireEvent.change(search, { target: { value: "factura abril" } });
		fireEvent.change(screen.getByLabelText("Filtrar por estado"), { target: { value: "VALIDATED" } });
		fireEvent.change(screen.getByLabelText("Filtrar por tipo"), { target: { value: "INVOICE" } });
		expect(search).toHaveValue("factura abril");
		expect(screen.getByLabelText("Filtrar por estado")).toHaveValue("VALIDATED");
		expect(screen.getByLabelText("Filtrar por tipo")).toHaveValue("INVOICE");
	});

	it("renders the selected evidence identifier while loading its detail", () => {
		render(<EvidenceDetailPage />);
		expect(screen.getByText("evidence-123")).toBeInTheDocument();
		expect(screen.getByText("Cargando detalle de evidencia")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /volver a evidencia/i })).toHaveAttribute("href", "/evidence");
	});
});
