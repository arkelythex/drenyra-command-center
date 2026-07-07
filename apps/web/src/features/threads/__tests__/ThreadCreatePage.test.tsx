import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThreadCreatePage } from "../components/ThreadCreatePage";

// Mock navigate
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mockNavigate,
}));

describe("ThreadCreatePage", () => {
	it("renders the Let's Close heading", () => {
		render(<ThreadCreatePage />);
		expect(screen.getByText("Let's close")).toBeDefined();
	});

	it("renders all 5 default quick actions", () => {
		render(<ThreadCreatePage />);
		expect(screen.getByText("Cerrar mes")).toBeDefined();
		expect(screen.getByText("Revisar SIRE compras")).toBeDefined();
		expect(screen.getByText("Conciliar bancos")).toBeDefined();
		expect(screen.getByText("Buscar riesgos fiscales")).toBeDefined();
		expect(screen.getByText("Pedir documentos faltantes")).toBeDefined();
	});

	it("shows company and period in header", () => {
		render(<ThreadCreatePage />);
		expect(screen.getByText("Andrés Capital SAC")).toBeDefined();
		expect(screen.getByText("Jun 2026")).toBeDefined();
	});

	it("calls onCreateThread when a quick action is clicked", () => {
		const handleCreate = vi.fn();
		render(<ThreadCreatePage onCreateThread={handleCreate} />);

		screen.getByText("Cerrar mes").click();
		expect(handleCreate).toHaveBeenCalledWith(
			expect.objectContaining({ id: "close-month" }),
		);
	});
});
