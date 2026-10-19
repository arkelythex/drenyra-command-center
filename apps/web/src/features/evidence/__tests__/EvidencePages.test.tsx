import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { EvidenceBrowserPage } from "../EvidenceBrowserPage";
import { EvidenceDetailPage } from "../EvidenceDetailPage";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
	useParams: () => ({ id: "evidence-123" }),
}));

vi.mock("@/lib/use-active-company-context", () => ({
	useActiveCompanyContext: () => ({
		availableCompanies: [],
		companyContext: { companyId: null },
		fiscalPeriod: null,
	}),
}));

vi.mock("../components/EvidenceUploadZone", () => ({
	EvidenceUploadZone: () => null,
}));

vi.mock("../hooks/useEvidence", () => ({
	useEvidenceList: () => ({
		isPending: false,
		isError: false,
		data: { data: [], total: 0 },
	}),
	useEvidenceDetail: () => ({
		isPending: true,
		isError: false,
		data: undefined,
	}),
	useValidateEvidence: () => ({ isPending: false, mutate: vi.fn() }),
}));

describe("evidence pages", () => {
	it("renders the browser empty state", () => {
		render(<EvidenceBrowserPage />);
		expect(
			screen.getByRole("heading", { name: "Bóveda de evidencia" }),
		).toBeInTheDocument();
		expect(screen.getByText("Sin evidencia registrada")).toBeInTheDocument();
		expect(
			screen.getByText("Los documentos cargados aparecerán aquí."),
		).toBeInTheDocument();
	});

	it("updates the browser search and exposes the filter controls", () => {
		render(<EvidenceBrowserPage />);
		const search = screen.getByPlaceholderText("Buscar por nombre...");
		fireEvent.change(search, { target: { value: "factura abril" } });
		expect(search).toHaveValue("factura abril");
		for (const label of [
			"Filtrar por tipo",
			"Filtrar por origen",
			"Filtrar por estado",
		]) {
			expect(screen.getByRole("combobox", { name: label })).toBeInTheDocument();
		}
	});

	it("renders the selected evidence identifier while loading its detail", () => {
		render(<EvidenceDetailPage />);
		expect(
			screen.getByText("Cargando detalle de evidencia..."),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /volver a evidencia/i }),
		).toHaveAttribute("href", "/evidence");
	});
});
