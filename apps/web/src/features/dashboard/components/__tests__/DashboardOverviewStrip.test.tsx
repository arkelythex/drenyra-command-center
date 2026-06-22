import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { useDashboardDataMock, useActiveCompanyContextMock } = vi.hoisted(
	() => ({
		useDashboardDataMock: vi.fn(),
		useActiveCompanyContextMock: vi.fn(),
	}),
);

vi.mock("../../hooks/useDashboardData", () => ({
	useDashboardData: useDashboardDataMock,
}));

vi.mock("@/lib/use-active-company-context", () => ({
	useActiveCompanyContext: useActiveCompanyContextMock,
}));

import { DashboardOverviewStrip } from "../DashboardOverviewStrip";

describe("DashboardOverviewStrip", () => {
	it("shows the seeded demo company banner when running on demo fallback context", () => {
		useDashboardDataMock.mockReturnValue({
			financials: {
				revenue: "12500",
				growth: 8.2,
				outstanding: "3400",
			},
			health: {
				complianceScore: 92,
			},
			raw: {
				__source: "live",
			},
			lastUpdatedAt: Date.UTC(2026, 2, 3, 15, 45),
		});

		useActiveCompanyContextMock.mockReturnValue({
			companyContext: {
				companyId: "00000000-0000-0000-0000-000000000001",
				companyName: "NEBULA OPERACIONES LOGISTICAS S.A.C.",
				ruc: "20608451231",
				isDemoFallback: true,
			},
			availableCompanies: [],
			setActiveCompanyById: vi.fn(),
		});

		render(<DashboardOverviewStrip />);

		expect(
			screen.getByRole("heading", { name: /Radar Operativo/i }),
		).toBeInTheDocument();
		expect(
			screen.getByText(/NEBULA OPERACIONES LOGISTICAS S\.A\.C\./i),
		).toBeInTheDocument();
		expect(screen.getByText(/RUC 20608451231/i)).toBeInTheDocument();
		expect(screen.getByText(/Live Sync:/i)).toBeInTheDocument();
	});
});
