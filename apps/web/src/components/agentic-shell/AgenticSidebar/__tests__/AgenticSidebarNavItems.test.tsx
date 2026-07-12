import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockNavigate = vi.fn();
const mockSetMobileOpen = vi.fn();
let mockPathname = "/inbox";

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mockNavigate,
	useLocation: () => ({ pathname: mockPathname }),
	Link: ({
		children,
		to,
		className,
	}: {
		children: ReactNode;
		to: string;
		className?: string;
	}) => (
		<a href={to} className={className}>
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
		mockPathname = "/inbox";
	});

	it("renders Spanish section headers", () => {
		render(<AgenticSidebarNavItems isCollapsed={false} />);

		expect(screen.getByText("CENTRO DE OPERACIONES")).toBeInTheDocument();
		expect(screen.getByText("OPERACIONES")).toBeInTheDocument();
		expect(screen.getByText("FISCAL Y CUMPLIMIENTO")).toBeInTheDocument();
		expect(screen.getByText("REPORTES")).toBeInTheDocument();
		expect(screen.getByText("SISTEMA")).toBeInTheDocument();
	});

	it("shows Spanish nav labels instead of English", () => {
		render(<AgenticSidebarNavItems isCollapsed={false} />);

		expect(screen.getByText("Bandeja")).toBeInTheDocument();
		expect(screen.getByText("Empresas")).toBeInTheDocument();
		expect(screen.getByText("Evidencia")).toBeInTheDocument();
		expect(screen.getByText("Cola de revisión")).toBeInTheDocument();
		expect(screen.getByText("Bancos")).toBeInTheDocument();
		expect(screen.getByText("Conciliaciones")).toBeInTheDocument();
		expect(screen.getByText("Comprobantes")).toBeInTheDocument();
		expect(screen.getByText("Libro Mayor")).toBeInTheDocument();
		expect(screen.getByText("Impuestos")).toBeInTheDocument();
		expect(screen.getByText("SIRE / SUNAT")).toBeInTheDocument();
		expect(screen.getByText("Cumplimiento")).toBeInTheDocument();
		expect(screen.getByText("Estados Financieros")).toBeInTheDocument();
		expect(screen.getByText("Reportes")).toBeInTheDocument();
		expect(screen.getByText("Auditoría")).toBeInTheDocument();
		expect(screen.getByText("Herramientas")).toBeInTheDocument();
		expect(screen.getByText("Configuración")).toBeInTheDocument();
	});

	it("has actionable Spanish buttons", () => {
		render(<AgenticSidebarNavItems isCollapsed={false} />);

		expect(screen.getByText("Nueva revisión fiscal")).toBeInTheDocument();
		expect(screen.getByText("Buscar en Drenyra")).toBeInTheDocument();
	});

	it("reflects active navigation state with a non-color-only indicator", () => {
		mockPathname = "/inbox";
		render(<AgenticSidebarNavItems isCollapsed={false} />);

		const activeButton = screen.getByText("Bandeja").closest("button");
		expect(activeButton?.className).toContain("border-[var(--color-primary)]");
	});
});
