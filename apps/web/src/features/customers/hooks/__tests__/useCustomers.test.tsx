import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	useActiveCompanyContextMock: vi.fn(),
	customersGetMock: vi.fn(),
	customersPostMock: vi.fn(),
	customersPutMock: vi.fn(),
	customersDeleteMock: vi.fn(),
}));

vi.mock("@/lib/api", () => {
	const customersRoute = ((params: { id: string }) => ({
		patch: (payload: unknown) => mocks.customersPutMock(params.id, payload),
		delete: () => mocks.customersDeleteMock(params.id),
	})) as unknown as {
		(params: {
			id: string;
		}): {
			patch: (payload: unknown) => Promise<unknown>;
			delete: () => Promise<unknown>;
		};
		get: (payload: unknown) => Promise<unknown>;
		post: (payload: unknown) => Promise<unknown>;
	};

	customersRoute.get = mocks.customersGetMock;
	customersRoute.post = mocks.customersPostMock;

	return {
		api: {
			api: {
				customers: customersRoute,
			},
		},
	};
});

vi.mock("@/lib/use-active-company-context", () => ({
	useActiveCompanyContext: mocks.useActiveCompanyContextMock,
}));

import {
	useCreateCustomer,
	useCustomers,
	useDeleteCustomer,
	useUpdateCustomer,
} from "../useCustomers";

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);

	return { queryClient, wrapper };
}

describe("useCustomers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.useActiveCompanyContextMock.mockReturnValue({
			companyContext: {
				companyId: "company-1",
				companyName: "LOGISTICA REAL S.A.C.",
				ruc: "20123456789",
				isDemoFallback: false,
			},
			availableCompanies: [],
			setActiveCompanyById: vi.fn(),
		});
		mocks.customersGetMock.mockResolvedValue({
			data: [
				{
					id: "cus-1",
					legalName: "Comercial Uno SAC",
					tradeName: "Comercial Uno",
					taxId: "20123456789",
					status: "active",
					currentBalance: "120.50",
				},
				{
					id: "cus-2",
					legalName: "Servicios Dos EIRL",
					tradeName: "Servicios Dos",
					taxId: "20987654321",
					status: "inactive",
					currentBalance: "50",
				},
			],
			error: null,
		});
		mocks.customersPostMock.mockResolvedValue({
			data: { id: "new-customer" },
			error: null,
		});
		mocks.customersPutMock.mockResolvedValue({
			data: { ok: true },
			error: null,
		});
		mocks.customersDeleteMock.mockResolvedValue({
			data: { ok: true },
			error: null,
		});
	});

	it("loads customers, filters by search, and computes stats", async () => {
		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useCustomers(), { wrapper });

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.customers).toHaveLength(2);
		expect(result.current.stats).toEqual({
			total: 2,
			active: 1,
			debt: 170.5,
			totalRevenue: 0,
			totalPending: 170.5,
			retentionTotal: 0,
		});

		act(() => {
			result.current.setSearchQuery("201234");
		});
		expect(result.current.customers).toHaveLength(1);
		expect(result.current.customers[0].id).toBe("cus-1");

		act(() => {
			result.current.toggleCustomer("cus-1");
		});
		expect(result.current.expandedCustomers).toContain("cus-1");

		act(() => {
			result.current.setActiveTab("cobranza");
		});
		expect(result.current.activeTab).toBe("cobranza");
	});

	it("supports Eden wrapper payload shape ({ data: [...] })", async () => {
		mocks.customersGetMock.mockResolvedValue({
			data: {
				data: [
					{
						id: "cus-wrapped",
						legalName: "Cliente Wrapped",
						taxId: "20111111111",
						status: "active",
						currentBalance: "0",
					},
				],
			},
			error: null,
		});

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useCustomers(), { wrapper });

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.customers).toHaveLength(1);
		expect(result.current.customers[0].id).toBe("cus-wrapped");
	});

	it("creates, updates, and deletes customers with cache invalidation", async () => {
		const { queryClient, wrapper } = createWrapper();
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

		const createHook = renderHook(() => useCreateCustomer(), { wrapper });
		await act(async () => {
			await createHook.result.current.mutateAsync({
				companyId: "company-1",
				legalName: "Nuevo Cliente",
				taxId: "20444444444",
				address: "Av. Lima 123",
				email: "nuevo@cliente.pe",
				status: "active",
			});
		});

		expect(mocks.customersPostMock).toHaveBeenCalledWith(
			expect.objectContaining({
				companyId: "company-1",
				legalName: "Nuevo Cliente",
			}),
		);

		const updateHook = renderHook(() => useUpdateCustomer(), { wrapper });
		await act(async () => {
			await updateHook.result.current.mutateAsync({
				id: "cus-1",
				data: { legalName: "Cliente Actualizado" },
			});
		});
		expect(mocks.customersPutMock).toHaveBeenCalledWith("cus-1", {
			legalName: "Cliente Actualizado",
		});

		const deleteHook = renderHook(() => useDeleteCustomer(), { wrapper });
		await act(async () => {
			await deleteHook.result.current.mutateAsync("cus-1");
		});
		expect(mocks.customersDeleteMock).toHaveBeenCalledWith("cus-1");

		expect(invalidateSpy).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: ["customers"] }),
		);
		expect(invalidateSpy).toHaveBeenCalledTimes(3);
	});
});
