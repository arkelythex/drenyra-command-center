import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AgentsWindowPage } from "../components/AgentsWindowPage";

// Mock tanstack router
vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
}));

describe("AgentsWindowPage", () => {
	it("renders the Agents Window header", () => {
		render(<AgentsWindowPage />);
		expect(screen.getByText("Agents Window")).toBeDefined();
	});

	it("shows session count", () => {
		render(<AgentsWindowPage />);
		expect(screen.getByText(/4 sesiones activas/)).toBeDefined();
	});

	it("renders all 4 agent cards", () => {
		render(<AgentsWindowPage />);
		expect(screen.getByText("SIRE Agent")).toBeDefined();
		expect(screen.getByText("Reconciliation Agent")).toBeDefined();
		expect(screen.getByText("Tax Risk Agent")).toBeDefined();
		expect(screen.getByText("Close Agent")).toBeDefined();
	});

	it("shows filter chips", () => {
		render(<AgentsWindowPage />);
		expect(screen.getByText("Ejecutando")).toBeDefined();
		expect(screen.getByText("Requiere aprobación")).toBeDefined();
		expect(screen.getByText("Completados")).toBeDefined();
		expect(screen.getByText("Fallidos")).toBeDefined();
	});

	it("shows risk badges on agent cards", () => {
		render(<AgentsWindowPage />);
		const bajos = screen.getAllByText("Bajo");
		const altos = screen.getAllByText("Alto");
		expect(bajos.length).toBeGreaterThanOrEqual(1);
		expect(altos.length).toBeGreaterThanOrEqual(1);
	});
});
