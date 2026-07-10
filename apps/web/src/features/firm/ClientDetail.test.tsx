import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClientDetail } from "./ClientDetail";

// Mock useQuery since ClientDetail fetches from API
vi.mock("@tanstack/react-query", () => ({
	useQuery: vi.fn().mockReturnValue({
		data: {
			id: "client-1",
			name: "Arkelythex SAC",
			ruc: "20608451231",
			slug: "arkelythex",
			status: "ACTIVE",
			healthScore: 85,
			settings: null,
			createdAt: "2025-01-15T00:00:00Z",
			updatedAt: "2026-07-01T00:00:00Z",
		},
		isLoading: false,
		isError: false,
		error: null,
	}),
}));

describe("ClientDetail", () => {
	it("renders client name and RUC", () => {
		render(<ClientDetail clientId="client-1" />);

		expect(screen.getByText("Arkelythex SAC")).toBeInTheDocument();
		expect(screen.getByText("RUC 20608451231")).toBeInTheDocument();
	});

	it("shows health score label", () => {
		render(<ClientDetail clientId="client-1" />);

		const labels = screen.getAllByText("Saludable");
		expect(labels.length).toBeGreaterThanOrEqual(1);
		expect(labels[0]).toBeInTheDocument();
	});

	it("shows all 4 tabs", () => {
		render(<ClientDetail clientId="client-1" />);

		expect(screen.getByText("Resumen")).toBeInTheDocument();
		expect(screen.getByText("Misiones")).toBeInTheDocument();
		expect(screen.getByText("Evidencia")).toBeInTheDocument();
		expect(screen.getByText("Historial")).toBeInTheDocument();
	});

	it("shows back link to client list", () => {
		render(<ClientDetail clientId="client-1" />);

		const backLink = screen.getByText("Volver a clientes");
		expect(backLink).toBeInTheDocument();
		expect(backLink.closest("a")).toHaveAttribute("href", "/firm/clients");
	});
});
