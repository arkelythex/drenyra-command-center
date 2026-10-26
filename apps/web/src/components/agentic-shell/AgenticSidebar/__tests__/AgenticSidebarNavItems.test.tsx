import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockNavigate = vi.fn();
const mockSetMobileOpen = vi.fn();
let mockPathname = "/cierre-mensual";

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mockNavigate,
	useLocation: () => ({ pathname: mockPathname }),
	Link: ({
		children,
		to,
		...rest
	}: {
		children: ReactNode;
		to: string;
		[prop: string]: unknown;
	}) => (
		<a href={to} {...rest}>
			{children}
		</a>
	),
}));

vi.mock("@/stores/agentic-shell.store", () => ({
	useAgenticShell: (
		selector: (s: {
			setSidebarMobileOpen: typeof mockSetMobileOpen;
		}) => unknown,
	) => selector({ setSidebarMobileOpen: mockSetMobileOpen }),
}));

import { AgenticSidebarNavItems } from "../components/AgenticSidebarNavItems.tsx";

describe("AgenticSidebarNavItems — L3 Spanish-first navigation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockPathname = "/cierre-mensual";
	});

	it("renders Spanish section headers, only for sections with screens", () => {
		render(<AgenticSidebarNavItems isCollapsed={false} />);

		expect(screen.getByText("Centro de operaciones")).toBeInTheDocument();
		expect(screen.getByText("Operaciones")).toBeInTheDocument();
		expect(screen.getByText("Fiscal y cumplimiento")).toBeInTheDocument();
		expect(screen.getByText("Sistema")).toBeInTheDocument();
		expect(screen.queryByText("REPORTES")).toBeNull();
	});

	it("shows Spanish labels for the screens that exist, and hides the rest", () => {
		render(<AgenticSidebarNavItems isCollapsed={false} />);

		expect(screen.getByText("Misiones")).toBeInTheDocument();
		expect(screen.getByText("Conciliaciones")).toBeInTheDocument();
		expect(screen.getByText("Comprobantes")).toBeInTheDocument();
		expect(screen.getByText("SIRE / SUNAT")).toBeInTheDocument();
		expect(screen.getByText("Configuración")).toBeInTheDocument();
		for (const hidden of [
			"Bandeja",
			"Evidencia",
			"Cola de revisión",
			"Bancos",
			"Libro Mayor",
		]) {
			expect(screen.queryByText(hidden)).toBeNull();
		}
	});

	it("starts a monthly close from the primary button", () => {
		render(<AgenticSidebarNavItems isCollapsed={false} />);

		screen.getByText("Nuevo cierre mensual").click();

		expect(mockNavigate).toHaveBeenCalledWith({ to: "/cierre-mensual" });
		expect(screen.queryByText("Buscar en Drenyra")).toBeNull();
	});

	it("reflects active navigation state with a non-color-only indicator", () => {
		mockPathname = "/cierre-mensual";
		render(<AgenticSidebarNavItems isCollapsed={false} />);

		const activeLink = screen.getByRole("link", { name: "Misiones" });
		expect(activeLink).toHaveAttribute("aria-current", "page");
		// Non-color indicator: the active entry is also set in a heavier weight.
		expect(activeLink.className).toContain("font-medium");
		expect(
			screen.getByRole("link", { name: "Comprobantes" }),
		).not.toHaveAttribute("aria-current");
	});
});
