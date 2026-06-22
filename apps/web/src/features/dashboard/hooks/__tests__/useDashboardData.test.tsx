import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	getDashboardMock,
	useActiveCompanyContextMock,
	runtimeConfigMock,
	dashboardFallbackMock,
} = vi.hoisted(() => ({
	getDashboardMock: vi.fn(),
	useActiveCompanyContextMock: vi.fn(),
	runtimeConfigMock: {
		mockMode: false,
	},
	dashboardFallbackMock: {
		financial: {
			monthlyRevenue: { amount: "0.00", currency: "PEN", formatted: "S/ 0.00" },
			outstandingAmount: {
				amount: "0.00",
				currency: "PEN",
				formatted: "S/ 0.00",
			},
			monthOverMonthGrowth: 0,
		},
		compliance: {
			complianceScore: 0,
		},
		__source: "fallback",
	},
}));

vi.mock("@/lib/use-active-company-context", () => ({
	useActiveCompanyContext: useActiveCompanyContextMock,
}));

vi.mock("@/lib/runtime-config", () => ({
	runtimeConfig: runtimeConfigMock,
}));

vi.mock("../../api/analytics.api", () => ({
	analyticsApi: {
		getDashboard: getDashboardMock,
	},
	DASHBOARD_ANALYTICS_FALLBACK: dashboardFallbackMock,
}));

import { useDashboardData } from "../useDashboardData";

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

describe("useDashboardData", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		runtimeConfigMock.mockMode = false;
		useActiveCompanyContextMock.mockReturnValue({
			companyContext: {
				companyId: "company-1",
				companyName: "Company 1",
				ruc: "20123456789",
				isDemoFallback: false,
			},
			availableCompanies: [],
			setActiveCompanyById: vi.fn(),
		});
	});

	it("uses fallback when mockMode is enabled", async () => {
		runtimeConfigMock.mockMode = true;
		const { result } = renderHook(() => useDashboardData(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.raw).toEqual(dashboardFallbackMock);
		expect(result.current.health.complianceScore).toBe(0);
		expect(result.current.financials.revenue).toBe("0.00");
		expect(getDashboardMock).not.toHaveBeenCalled();
	});

	it("returns live dashboard data and maps adapters", async () => {
		getDashboardMock.mockResolvedValue({
			__source: "live",
			financial: {
				monthlyRevenue: {
					amount: "4200.00",
					currency: "PEN",
					formatted: "S/ 4,200.00",
				},
				outstandingAmount: {
					amount: "800.00",
					currency: "PEN",
					formatted: "S/ 800.00",
				},
				monthOverMonthGrowth: 12.5,
			},
			compliance: {
				complianceScore: 97.2,
			},
		});

		const { result } = renderHook(() => useDashboardData(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(getDashboardMock).toHaveBeenCalledWith({
			companyId: "company-1",
			currency: "PEN",
		});
		expect(result.current.raw?.__source).toBe("live");
		expect(result.current.health).toEqual({
			complianceScore: 97.2,
			level: "Excelente",
			risks: [],
		});
		expect(result.current.financials).toEqual({
			revenue: "4200.00",
			growth: 12.5,
			outstanding: "800.00",
		});
	});

	it("falls back for retryable HTTP statuses (404/503/etc)", async () => {
		getDashboardMock.mockRejectedValue({ status: 404 });

		const { result } = renderHook(() => useDashboardData(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.raw).toEqual(dashboardFallbackMock);
		expect(result.current.error).toBeNull();
	});

	it("exposes error for non-fallback statuses", async () => {
		getDashboardMock.mockRejectedValue({
			status: 500,
			message: "server exploded",
		});

		const { result } = renderHook(() => useDashboardData(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.error).toBeTruthy();
		});

		expect(result.current.raw).toBeUndefined();
		expect(result.current.health.complianceScore).toBe(0);
		expect(result.current.financials.revenue).toBe("0.00");
	});
});
