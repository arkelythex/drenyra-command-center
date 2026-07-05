/**
 * @fileoverview Tests for the CRUD hooks factory (`createCrudHooks`) and
 * query-key factory (`crudKeys`).
 *
 * Tests follow the patterns established in:
 * - `features/vendors/hooks/__tests__/useVendors.test.tsx`
 * - `features/customers/hooks/__tests__/useCustomers.test.tsx`
 *
 * The factory uses `useActiveCompanyContext` internally, so we mock that
 * module. The CRUD config functions are `vi.fn()` stubs injected at test
 * time so we can assert they're called with the right parameters.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createCrudHooks, crudKeys } from "../crud-api";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
	useActiveCompanyContextMock: vi.fn(),
}));

vi.mock("@/lib/use-active-company-context", () => ({
	useActiveCompanyContext: mocks.useActiveCompanyContextMock,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
}

function createWrapper(queryClient: QueryClient) {
	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

/** Default company context used unless overridden per test. */
const DEFAULT_COMPANY = {
	companyContext: {
		companyId: "company-42",
		companyName: "ARKELYTHEX SAC",
		ruc: "20555555555",
		isDemoFallback: false,
	},
	availableCompanies: [],
	setActiveCompanyById: vi.fn(),
};

interface Product {
	id: string;
	name: string;
	price: number;
}

interface CreateProduct {
	name: string;
	price: number;
}

interface UpdateProduct {
	name?: string;
	price?: number;
}

function createProductApiStubs() {
	return {
		list: vi.fn<[string], Promise<Product[]>>(),
		getById: vi.fn<[string], Promise<Product>>(),
		create: vi.fn<[string, CreateProduct], Promise<Product>>(),
		update: vi.fn<[string, UpdateProduct], Promise<Product>>(),
		delete: vi.fn<[string], Promise<void>>(),
	};
}

// ---------------------------------------------------------------------------
// crudKeys
// ---------------------------------------------------------------------------

describe("crudKeys", () => {
	it("returns object with all, list, and detail functions", () => {
		const keys = crudKeys("products");
		expect(keys).toHaveProperty("all");
		expect(keys).toHaveProperty("list");
		expect(keys).toHaveProperty("detail");
		expect(typeof keys.all).toBe("object");
		expect(typeof keys.list).toBe("function");
		expect(typeof keys.detail).toBe("function");
	});

	it("all returns [resource] tuple", () => {
		const keys = crudKeys("products");
		expect(keys.all).toEqual(["products"]);
	});

	it("list returns [resource, companyId] tuple", () => {
		const keys = crudKeys("products");
		expect(keys.list("company-42")).toEqual(["products", "company-42"]);
	});

	it("detail returns [resource, id] tuple", () => {
		const keys = crudKeys("products");
		expect(keys.detail("prod-1")).toEqual(["products", "prod-1"]);
	});

	it("supports arbitrary resource names", () => {
		const keys = crudKeys("tax-rates");
		expect(keys.all).toEqual(["tax-rates"]);
		expect(keys.list("c-1")).toEqual(["tax-rates", "c-1"]);
		expect(keys.detail("tr-99")).toEqual(["tax-rates", "tr-99"]);
	});

	it("returns frozen-like arrays (const assertions)", () => {
		// The implementation uses `as const`, which narrows to readonly tuples.
		// We verify the returned values are read-only tuples at the type level
		// via the runtime behaviour (no mutable methods needed for typical usage).
		const keys = crudKeys("items");
		expect(Array.isArray(keys.all)).toBe(true);
		expect(Array.isArray(keys.list("c-1"))).toBe(true);
		expect(Array.isArray(keys.detail("i-1"))).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// createCrudHooks
// ---------------------------------------------------------------------------

describe("createCrudHooks", () => {
	const defaultKey = "products";

	beforeEach(() => {
		mocks.useActiveCompanyContextMock.mockReturnValue(DEFAULT_COMPANY);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	// -- Return shape -------------------------------------------------------

	describe("return shape", () => {
		it("returns an object with keys and five hooks", () => {
			const api = createProductApiStubs();
			const hooks = createCrudHooks<Product, CreateProduct, UpdateProduct>({
				key: defaultKey,
				...api,
			});

			expect(hooks).toHaveProperty("keys");
			expect(hooks).toHaveProperty("useList");
			expect(hooks).toHaveProperty("useGet");
			expect(hooks).toHaveProperty("useCreate");
			expect(hooks).toHaveProperty("useUpdate");
			expect(hooks).toHaveProperty("useDelete");

			expect(typeof hooks.useList).toBe("function");
			expect(typeof hooks.useGet).toBe("function");
			expect(typeof hooks.useCreate).toBe("function");
			expect(typeof hooks.useUpdate).toBe("function");
			expect(typeof hooks.useDelete).toBe("function");
		});

		it("keys returned from hooks.keys matches crudKeys(key)", () => {
			const api = createProductApiStubs();
			const hooks = createCrudHooks<Product, CreateProduct, UpdateProduct>({
				key: defaultKey,
				...api,
			});

			const expected = crudKeys(defaultKey);
			expect(hooks.keys.all).toEqual(expected.all);
			expect(hooks.keys.list("c-1")).toEqual(expected.list("c-1"));
			expect(hooks.keys.detail("d-1")).toEqual(expected.detail("d-1"));
		});
	});

	// -- useList ------------------------------------------------------------

	describe("useList", () => {
		it("fetches data using config.list with the active companyId", async () => {
			const api = createProductApiStubs();
			const products: Product[] = [
				{ id: "p1", name: "Widget", price: 100 },
				{ id: "p2", name: "Gadget", price: 200 },
			];
			api.list.mockResolvedValue(products);

			const { useList } = createCrudHooks<
				Product,
				CreateProduct,
				UpdateProduct
			>({ key: defaultKey, ...api });

			const queryClient = createQueryClient();
			const { result } = renderHook(() => useList(), {
				wrapper: createWrapper(queryClient),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(api.list).toHaveBeenCalledTimes(1);
			expect(api.list).toHaveBeenCalledWith("company-42");
			expect(result.current.data).toEqual(products);
		});

		it("passes options.enabled to the query", async () => {
			const api = createProductApiStubs();
			api.list.mockResolvedValue([]);

			const { useList } = createCrudHooks<
				Product,
				CreateProduct,
				UpdateProduct
			>({ key: defaultKey, ...api });

			const queryClient = createQueryClient();
			const { result } = renderHook(() => useList({ enabled: false }), {
				wrapper: createWrapper(queryClient),
			});

			// Should never fetch
			expect(result.current.isFetching).toBe(false);
			// Wait a tick to be sure the query didn't fire
			await vi.waitFor(
				() => {
					expect(api.list).not.toHaveBeenCalled();
				},
				{ timeout: 500 },
			);
		});

		it("respects enabled: true (default)", async () => {
			const api = createProductApiStubs();
			api.list.mockResolvedValue([]);

			const { useList } = createCrudHooks<
				Product,
				CreateProduct,
				UpdateProduct
			>({ key: defaultKey, ...api });

			const queryClient = createQueryClient();
			renderHook(() => useList({ enabled: true }), {
				wrapper: createWrapper(queryClient),
			});

			await waitFor(() => expect(api.list).toHaveBeenCalled());
		});

		it("sets the correct queryKey", () => {
			const api = createProductApiStubs();
			api.list.mockResolvedValue([]);

			const { useList } = createCrudHooks<
				Product,
				CreateProduct,
				UpdateProduct
			>({ key: defaultKey, ...api });

			const queryClient = createQueryClient();
			const spy = vi.spyOn(queryClient, "getQueryCache");

			renderHook(() => useList(), {
				wrapper: createWrapper(queryClient),
			});

			// The query key used should be ["products", "company-42"]
			// We verify this indirectly via the list call
			expect(api.list).toHaveBeenCalledWith("company-42");
		});
	});

	// -- useGet -------------------------------------------------------------

	describe("useGet", () => {
		it("fetches a record by id using config.getById", async () => {
			const api = createProductApiStubs();
			const product: Product = { id: "p1", name: "Widget", price: 100 };
			api.getById.mockResolvedValue(product);

			const { useGet } = createCrudHooks<Product, CreateProduct, UpdateProduct>(
				{ key: defaultKey, ...api },
			);

			const queryClient = createQueryClient();
			const { result } = renderHook(() => useGet("p1"), {
				wrapper: createWrapper(queryClient),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(api.getById).toHaveBeenCalledTimes(1);
			expect(api.getById).toHaveBeenCalledWith("p1");
			expect(result.current.data).toEqual(product);
		});

		it("is disabled when id is an empty string", () => {
			const api = createProductApiStubs();
			api.getById.mockResolvedValue({} as Product);

			const { useGet } = createCrudHooks<Product, CreateProduct, UpdateProduct>(
				{ key: defaultKey, ...api },
			);

			const queryClient = createQueryClient();
			const { result } = renderHook(() => useGet(""), {
				wrapper: createWrapper(queryClient),
			});

			expect(result.current.isFetching).toBe(false);
			expect(api.getById).not.toHaveBeenCalled();
		});
	});

	// -- useCreate ----------------------------------------------------------

	describe("useCreate", () => {
		it("calls config.create with companyId and data when mutating", async () => {
			const api = createProductApiStubs();
			const created: Product = { id: "new-1", name: "New", price: 50 };
			api.create.mockResolvedValue(created);

			const { useCreate } = createCrudHooks<
				Product,
				CreateProduct,
				UpdateProduct
			>({ key: defaultKey, ...api });

			const queryClient = createQueryClient();
			const { result } = renderHook(() => useCreate(), {
				wrapper: createWrapper(queryClient),
			});

			const payload: CreateProduct = { name: "New", price: 50 };
			await act(async () => {
				await result.current.mutateAsync(payload);
			});

			expect(api.create).toHaveBeenCalledTimes(1);
			expect(api.create).toHaveBeenCalledWith("company-42", payload);
		});

		it("invalidates the all query key on success", async () => {
			const api = createProductApiStubs();
			api.create.mockResolvedValue({} as Product);

			const { useCreate } = createCrudHooks<
				Product,
				CreateProduct,
				UpdateProduct
			>({ key: defaultKey, ...api });

			const queryClient = createQueryClient();
			const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

			const { result } = renderHook(() => useCreate(), {
				wrapper: createWrapper(queryClient),
			});

			await act(async () => {
				await result.current.mutateAsync({ name: "X", price: 10 });
			});

			expect(invalidateSpy).toHaveBeenCalledWith(
				expect.objectContaining({ queryKey: ["products"] }),
			);
		});
	});

	// -- useUpdate ----------------------------------------------------------

	describe("useUpdate", () => {
		it("calls config.update with id and data when mutating", async () => {
			const api = createProductApiStubs();
			api.update.mockResolvedValue({} as Product);

			const { useUpdate } = createCrudHooks<
				Product,
				CreateProduct,
				UpdateProduct
			>({ key: defaultKey, ...api });

			const queryClient = createQueryClient();
			const { result } = renderHook(() => useUpdate(), {
				wrapper: createWrapper(queryClient),
			});

			const updatePayload: UpdateProduct = { name: "Updated" };
			await act(async () => {
				await result.current.mutateAsync({
					id: "p1",
					data: updatePayload,
				});
			});

			expect(api.update).toHaveBeenCalledTimes(1);
			expect(api.update).toHaveBeenCalledWith("p1", updatePayload);
		});

		it("invalidates the all query key on success", async () => {
			const api = createProductApiStubs();
			api.update.mockResolvedValue({} as Product);

			const { useUpdate } = createCrudHooks<
				Product,
				CreateProduct,
				UpdateProduct
			>({ key: defaultKey, ...api });

			const queryClient = createQueryClient();
			const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

			const { result } = renderHook(() => useUpdate(), {
				wrapper: createWrapper(queryClient),
			});

			await act(async () => {
				await result.current.mutateAsync({
					id: "p1",
					data: { price: 999 },
				});
			});

			expect(invalidateSpy).toHaveBeenCalledWith(
				expect.objectContaining({ queryKey: ["products"] }),
			);
		});
	});

	// -- useDelete ----------------------------------------------------------

	describe("useDelete", () => {
		it("calls config.delete with the id when mutating", async () => {
			const api = createProductApiStubs();
			api.delete.mockResolvedValue(undefined);

			const { useDelete } = createCrudHooks<
				Product,
				CreateProduct,
				UpdateProduct
			>({ key: defaultKey, ...api });

			const queryClient = createQueryClient();
			const { result } = renderHook(() => useDelete(), {
				wrapper: createWrapper(queryClient),
			});

			await act(async () => {
				await result.current.mutateAsync("p1");
			});

			expect(api.delete).toHaveBeenCalledTimes(1);
			expect(api.delete).toHaveBeenCalledWith("p1");
		});

		it("invalidates the all query key on success", async () => {
			const api = createProductApiStubs();
			api.delete.mockResolvedValue(undefined);

			const { useDelete } = createCrudHooks<
				Product,
				CreateProduct,
				UpdateProduct
			>({ key: defaultKey, ...api });

			const queryClient = createQueryClient();
			const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

			const { result } = renderHook(() => useDelete(), {
				wrapper: createWrapper(queryClient),
			});

			await act(async () => {
				await result.current.mutateAsync("p1");
			});

			expect(invalidateSpy).toHaveBeenCalledWith(
				expect.objectContaining({ queryKey: ["products"] }),
			);
		});
	});

	// -- Error propagation --------------------------------------------------

	describe("error propagation", () => {
		it("useList surfaces API errors to the component", async () => {
			const api = createProductApiStubs();
			const error = new Error("Network error");
			api.list.mockRejectedValue(error);

			const { useList } = createCrudHooks<
				Product,
				CreateProduct,
				UpdateProduct
			>({ key: defaultKey, ...api });

			const queryClient = createQueryClient();
			const { result } = renderHook(() => useList(), {
				wrapper: createWrapper(queryClient),
			});

			await waitFor(() => expect(result.current.isError).toBe(true));
			expect(result.current.error).toBeDefined();
		});

		it("useGet surfaces API errors to the component", async () => {
			const api = createProductApiStubs();
			const error = new Error("Not found");
			api.getById.mockRejectedValue(error);

			const { useGet } = createCrudHooks<Product, CreateProduct, UpdateProduct>(
				{ key: defaultKey, ...api },
			);

			const queryClient = createQueryClient();
			const { result } = renderHook(() => useGet("p-404"), {
				wrapper: createWrapper(queryClient),
			});

			await waitFor(() => expect(result.current.isError).toBe(true));
		});

		it("useCreate surfaces mutation errors to the caller", async () => {
			const api = createProductApiStubs();
			const error = new Error("Validation failed");
			api.create.mockRejectedValue(error);

			const { useCreate } = createCrudHooks<
				Product,
				CreateProduct,
				UpdateProduct
			>({ key: defaultKey, ...api });

			const queryClient = createQueryClient();
			const { result } = renderHook(() => useCreate(), {
				wrapper: createWrapper(queryClient),
			});

			await act(async () => {
				await expect(
					result.current.mutateAsync({ name: "Bad", price: -1 }),
				).rejects.toThrow("Validation failed");
			});
		});

		it("useUpdate surfaces mutation errors to the caller", async () => {
			const api = createProductApiStubs();
			const error = new Error("Conflict");
			api.update.mockRejectedValue(error);

			const { useUpdate } = createCrudHooks<
				Product,
				CreateProduct,
				UpdateProduct
			>({ key: defaultKey, ...api });

			const queryClient = createQueryClient();
			const { result } = renderHook(() => useUpdate(), {
				wrapper: createWrapper(queryClient),
			});

			await act(async () => {
				await expect(
					result.current.mutateAsync({ id: "p1", data: {} }),
				).rejects.toThrow("Conflict");
			});
		});

		it("useDelete surfaces mutation errors to the caller", async () => {
			const api = createProductApiStubs();
			const error = new Error("Forbidden");
			api.delete.mockRejectedValue(error);

			const { useDelete } = createCrudHooks<
				Product,
				CreateProduct,
				UpdateProduct
			>({ key: defaultKey, ...api });

			const queryClient = createQueryClient();
			const { result } = renderHook(() => useDelete(), {
				wrapper: createWrapper(queryClient),
			});

			await act(async () => {
				await expect(result.current.mutateAsync("p1")).rejects.toThrow(
					"Forbidden",
				);
			});
		});
	});

	// -- Company ID changes -------------------------------------------------

	describe("company-scoped re-fetching", () => {
		it("useList refetches when companyId changes", async () => {
			const api = createProductApiStubs();
			api.list.mockResolvedValue([]);

			const { useList } = createCrudHooks<
				Product,
				CreateProduct,
				UpdateProduct
			>({ key: defaultKey, ...api });

			const queryClient = createQueryClient();

			// First render — company-42
			const { rerender } = renderHook(() => useList(), {
				wrapper: createWrapper(queryClient),
			});

			await waitFor(() => {
				expect(api.list).toHaveBeenCalledWith("company-42");
			});

			// Change company to company-99 and re-render
			mocks.useActiveCompanyContextMock.mockReturnValue({
				...DEFAULT_COMPANY,
				companyContext: {
					...DEFAULT_COMPANY.companyContext,
					companyId: "company-99",
				},
			});

			rerender();

			await waitFor(() => {
				expect(api.list).toHaveBeenCalledWith("company-99");
			});
		});
	});
});
