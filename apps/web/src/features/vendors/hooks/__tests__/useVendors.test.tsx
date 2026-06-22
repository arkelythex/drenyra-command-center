import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	useActiveCompanyContextMock: vi.fn(),
	vendorsGetMock: vi.fn(),
	vendorsPostMock: vi.fn(),
	vendorsPutMock: vi.fn(),
	vendorsDeleteMock: vi.fn(),
}));

vi.mock("@/lib/api", () => {
	const vendorsRoute = ((params: { id: string }) => ({
		patch: (payload: unknown) => mocks.vendorsPutMock(params.id, payload),
		delete: () => mocks.vendorsDeleteMock(params.id),
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

	vendorsRoute.get = mocks.vendorsGetMock;
	vendorsRoute.post = mocks.vendorsPostMock;

	return {
		api: {
			api: {
				vendors: vendorsRoute,
			},
		},
	};
});

vi.mock("@/lib/use-active-company-context", () => ({
	useActiveCompanyContext: mocks.useActiveCompanyContextMock,
}));

import {
	useCreateVendor,
	useDeleteVendor,
	useUpdateVendor,
	useVendors,
} from "../useVendors";

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

describe("useVendors", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.useActiveCompanyContextMock.mockReturnValue({
			companyContext: {
				companyId: "company-55",
				companyName: "GRUPO ABASTECIMIENTO S.A.C.",
				ruc: "20555555555",
				isDemoFallback: false,
			},
			availableCompanies: [],
			setActiveCompanyById: vi.fn(),
		});
		mocks.vendorsGetMock.mockResolvedValue({
			data: [
				{
					id: "ven-1",
					name: "ACME Supplies",
					taxId: "20555555555",
					totalSpend: 3000,
					condition: "NO HABIDO",
					isRetentionAgent: true,
				},
				{
					id: "ven-2",
					name: "ServiParts",
					taxId: "20666666666",
					totalSpend: 500,
					condition: "HABIDO",
					isRetentionAgent: false,
				},
			],
			error: null,
		});
		mocks.vendorsPostMock.mockResolvedValue({
			data: { id: "new-vendor" },
			error: null,
		});
		mocks.vendorsPutMock.mockResolvedValue({ data: { ok: true }, error: null });
		mocks.vendorsDeleteMock.mockResolvedValue({
			data: { ok: true },
			error: null,
		});
	});

	it("loads vendors, filters, and computes summary stats", async () => {
		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useVendors(), { wrapper });

		await waitFor(() => {
			expect(result.current.vendors).toHaveLength(2);
		});

		expect(result.current.stats).toEqual({
			totalSpend: 3500,
			criticalCount: 1,
			retentionAgents: 1,
		});

		act(() => {
			result.current.setSearchQuery("ACME");
		});
		expect(result.current.vendors).toHaveLength(1);
		expect(result.current.vendors[0].id).toBe("ven-1");

		act(() => {
			result.current.toggleVendor("ven-1");
			result.current.setActiveTab("taxes");
		});
		expect(result.current.expandedVendors).toContain("ven-1");
		expect(result.current.activeTab).toBe("taxes");
	});

	it("supports Eden wrapper payload shape ({ data: [...] })", async () => {
		mocks.vendorsGetMock.mockResolvedValue({
			data: {
				data: [
					{
						id: "ven-wrapped",
						name: "Proveedor Wrapped",
						taxId: "20777777777",
						totalSpend: 1250,
						condition: "HABIDO",
						isRetentionAgent: false,
					},
				],
			},
			error: null,
		});

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useVendors(), { wrapper });

		await waitFor(() => {
			expect(result.current.vendors).toHaveLength(1);
		});

		expect(result.current.vendors[0].id).toBe("ven-wrapped");
		expect(result.current.stats.totalSpend).toBe(1250);
	});

	it("creates, updates, and deletes vendors with invalidation", async () => {
		const { queryClient, wrapper } = createWrapper();
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

		const createHook = renderHook(() => useCreateVendor(), { wrapper });
		await act(async () => {
			await createHook.result.current.mutateAsync({
				legalName: "Proveedor Nuevo",
				taxId: "20999999999",
			});
		});
		expect(mocks.vendorsPostMock).toHaveBeenCalledWith(
			expect.objectContaining({
				companyId: "company-55",
				legalName: "Proveedor Nuevo",
			}),
		);

		const updateHook = renderHook(() => useUpdateVendor(), { wrapper });
		await act(async () => {
			await updateHook.result.current.mutateAsync({
				id: "ven-1",
				data: { legalName: "Proveedor Actualizado" },
			});
		});
		expect(mocks.vendorsPutMock).toHaveBeenCalledWith("ven-1", {
			legalName: "Proveedor Actualizado",
		});

		const deleteHook = renderHook(() => useDeleteVendor(), { wrapper });
		await act(async () => {
			await deleteHook.result.current.mutateAsync("ven-1");
		});
		expect(mocks.vendorsDeleteMock).toHaveBeenCalledWith("ven-1");

		expect(invalidateSpy).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: ["vendors"] }),
		);
		expect(invalidateSpy).toHaveBeenCalledTimes(3);
	});
});
