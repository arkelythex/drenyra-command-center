import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HeaderSupportMenu } from "../HeaderSupportMenu";

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mockNavigate,
}));

vi.mock("@/hooks/useKeyboardShortcuts", () => ({
	useKeyboardShortcuts: () => ({
		getAllShortcuts: () => [
			{
				category: "Navegación",
				description: "Abrir buscador",
				key: "k",
				meta: true,
			},
		],
		getShortcutsByCategory: () => [
			{
				category: "Navegación",
				description: "Abrir buscador",
				key: "k",
				meta: true,
			},
		],
	}),
}));

describe("HeaderSupportMenu", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("opens keyboard shortcuts from the help menu", async () => {
		const user = userEvent.setup();
		render(<HeaderSupportMenu />);

		await user.click(screen.getByRole("button", { name: /ayuda y atajos/i }));
		await user.click(screen.getByText(/atajos de teclado/i));

		await waitFor(() => {
			expect(screen.getByText(/Atajos de Teclado/i)).toBeInTheDocument();
			expect(screen.getByText(/Abrir buscador/i)).toBeInTheDocument();
		});
	});

	it("navigates to operational routes from the help menu", async () => {
		const user = userEvent.setup();
		render(<HeaderSupportMenu compact />);

		await user.click(screen.getByRole("button", { name: /ayuda y atajos/i }));
		await user.click(screen.getByText(/estado ose/i));

		expect(mockNavigate).toHaveBeenCalledWith({ to: "/connections" });
	});
});
