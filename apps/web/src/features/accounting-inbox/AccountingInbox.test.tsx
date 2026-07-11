import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AccountingInbox } from "./AccountingInbox";

const openInspector = vi.fn();

vi.mock("@tanstack/react-router", () => ({
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

vi.mock("@/context/FiscalInspectorContext", () => ({
	useFiscalInspector: () => ({ open: openInspector }),
}));

vi.mock("@/lib/use-active-company-context", () => ({
	useActiveCompanyContext: () => ({
		companyContext: { companyId: "test-co", ruc: "20123456789" },
		fiscalPeriod: "Julio 2026",
	}),
}));

vi.mock("./hooks/useInboxDashboard", () => ({
	useInboxDashboard: () => ({
		data: undefined,
		isLoading: false,
	}),
}));

describe("AccountingInbox", () => {
	it("makes the monthly close context and dominant P0 blocker visible", () => {
		render(<AccountingInbox />);

		expect(
			screen.getByText("RUC 20123456789 · Julio 2026 · Cierre en revisión"),
		).toBeInTheDocument();
		expect(screen.getByText("1 bloqueo P0")).toBeInTheDocument();
		const p0 = screen.getByText("P0");
		const p1 = screen.getByText("P1");
		expect(
			p0.compareDocumentPosition(p1) & Node.DOCUMENT_POSITION_FOLLOWING,
		).not.toBe(0);
		expect(
			screen.getByText("Resolver 3 inconsistencias entre SIRE y comprobantes"),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Bloquea la validación del IGV y la declaración del período.",
			),
		).toBeInTheDocument();
		fireEvent.click(
			screen.getByRole("button", { name: "Inspeccionar evidencia" }),
		);
		expect(openInspector).toHaveBeenCalledWith(
			expect.objectContaining({
				riskLevel: "CRITICAL",
				requiresApproval: true,
			}),
		);
	});

	it("explains recommendation confidence and preserves typed close navigation", () => {
		render(<AccountingInbox />);

		expect(
			screen.getByRole("heading", { name: "Pendiente de tu aprobación" }),
		).toBeInTheDocument();
		expect(
			screen.getByText("Conciliación de abono BCP S/ 8,420"),
		).toBeInTheDocument();
		expect(screen.getByText("Confianza Alta")).toBeInTheDocument();
		expect(
			screen.getByText(/Coincidencia entre XML, patrón histórico/),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /Continuar cierre/i }),
		).toHaveAttribute("href", "/cierre-mensual");
	});
});
