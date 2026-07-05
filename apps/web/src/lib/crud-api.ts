/**
 * @fileoverview TanStack Query CRUD hook generator.
 *
 * Creates a complete set of React Query hooks (`useList`, `useGet`, `useCreate`,
 * `useUpdate`, `useDelete`) for any resource. Every hook is company-scoped via
 * `useActiveCompanyContext()` and mutations automatically invalidate the resource's
 * query key on success.
 *
 * **Design philosophy:**
 * - Follows the same patterns as existing features (customers, vendors, products)
 * - Query keys use a factory pattern (`all` / `list(companyId)` / `detail(id)`)
 *   so any mutation can selectively invalidate
 * - Callers provide `CrudConfig<T, Create, Update>` with the actual API calls;
 *   the factory handles React Query lifecycle, loading state, and invalidation
 *
 * @see {@link createCrudHooks} for the main factory
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveCompanyContext } from "./use-active-company-context";

/**
 * Base CRUD configuration for a resource.
 *
 * Each field maps to a TanStack Query hook produced by {@link createCrudHooks}.
 *
 * @typeParam T - The UI-facing entity type returned by the API
 * @typeParam Create - The create payload type (sent to the POST endpoint)
 * @typeParam Update - The update payload type (sent to the PATCH/PUT endpoint;
 *   typically partial)
 */
export interface CrudConfig<T, Create, Update> {
	/** Unique resource key used for query-key generation (e.g. `"products"`) */
	key: string;
	/** Fetch all records scoped to a company */
	list: (companyId: string) => Promise<T[]>;
	/** Fetch a single record by ID */
	getById: (id: string) => Promise<T>;
	/** Create a new record within a company */
	create: (companyId: string, data: Create) => Promise<T>;
	/** Update an existing record by ID */
	update: (id: string, data: Update) => Promise<T>;
	/** Delete a record by ID */
	delete: (id: string) => Promise<void>;
}

/**
 * Query key helpers for a CRUD resource.
 *
 * Generates structured keys so TanStack Query can cache lists and details
 * independently and mutations can invalidate granularly.
 *
 * @param resource - The resource name (same as `CrudConfig.key`)
 * @returns An object with:
 *  - `all`: all queries for the resource `[resource]`
 *  - `list(companyId)`: company-scoped list key `[resource, companyId]`
 *  - `detail(id)`: single-record key `[resource, id]`
 *
 * @example
 * ```ts
 * const keys = crudKeys("products")
 * queryClient.invalidateQueries({ queryKey: keys.all })
 * ```
 */
export function crudKeys(resource: string) {
	return {
		all: [resource] as const,
		list: (companyId: string) => [resource, companyId] as const,
		detail: (id: string) => [resource, id] as const,
	};
}

/**
 * Options for the `useList` hook produced by {@link createCrudHooks}.
 */
export interface UseListOptions {
	/** When `false`, the query is disabled (default: `true`) */
	enabled?: boolean;
}

/**
 * Return type of {@link createCrudHooks}.
 * Provides React Query hooks and query key helpers for a CRUD resource.
 *
 * @typeParam T - Entity type returned by the API
 * @typeParam Create - Payload type for record creation
 * @typeParam Update - Payload type for record updates
 */
export interface CrudHooks<T, Create, Update> {
	/** Query key factory for cache management */
	keys: ReturnType<typeof crudKeys>;
	/** Fetch all records scoped to the active company */
	useList: (options?: UseListOptions) => { data?: T[]; isLoading: boolean };
	/** Fetch a single record by ID */
	useGet: (id: string) => { data?: T; isLoading: boolean };
	/** Create a new record (auto-injects company ID) */
	useCreate: () => {
		mutateAsync: (data: Create) => Promise<T>;
		isPending: boolean;
	};
	/** Update a record by ID */
	useUpdate: () => {
		mutateAsync: (params: { id: string; data: Update }) => Promise<T>;
		isPending: boolean;
	};
	/** Delete a record by ID */
	useDelete: () => {
		mutateAsync: (id: string) => Promise<void>;
		isPending: boolean;
	};
}

/**
 * Creates TanStack Query hooks for a CRUD resource.
 *
 * Follows the same patterns as existing features (customers, vendors, products):
 * - Company-scoped queries via `useActiveCompanyContext()`
 * - Query key factory with `all` + `list(companyId)` keys
 * - Mutation invalidation of the `all` key on success
 *
 * @typeParam T - The UI-facing entity type
 * @typeParam Create - The create payload type
 * @typeParam Update - The update payload type (partial)
 * @param config - CRUD configuration with the actual API functions
 * @returns An object with `{ keys, useList, useGet, useCreate, useUpdate, useDelete }`
 *
 * @example
 * ```ts
 * // api/products.api.ts
 * export const productsApi = createCrudHooks({
 *   key: "products",
 *   list: (companyId) => productsApi.list({ companyId }),
 *   getById: (id) => productsApi.getById(id),
 *   create: (companyId, data) => productsApi.create({ ...data, companyId }),
 *   update: (id, data) => productsApi.update(id, data),
 *   delete: (id) => productsApi.delete(id),
 * })
 *
 * // In a component:
 * const { data, isLoading } = useProductsList();
 * const createMutation = useCreateProduct();
 * ```
 *
 * @throws In the React Query error boundary if any config function throws
 *
 * @see {@link crudKeys} for the key factory used internally
 */
export function createCrudHooks<T, Create, Update>(
	config: CrudConfig<T, Create, Update>,
): CrudHooks<T, Create, Update> {
	const keys = crudKeys(config.key);

	/**
	 * Fetch the full list of records for the active company.
	 * Disabled until `companyId` is available.
	 */
	function useList(options?: UseListOptions) {
		const { companyContext } = useActiveCompanyContext();
		const companyId = companyContext.companyId;

		return useQuery({
			queryKey: keys.list(companyId),
			queryFn: () => config.list(companyId),
			enabled: options?.enabled ?? true,
		});
	}

	/**
	 * Fetch a single record by ID.
	 * Disabled when `id` is falsy.
	 */
	function useGet(id: string) {
		return useQuery({
			queryKey: keys.detail(id),
			queryFn: () => config.getById(id),
			enabled: !!id,
		});
	}

	/**
	 * Create a new record. Auto-injects the active company ID.
	 * Invalidates the `all` query key on success.
	 */
	function useCreate() {
		const queryClient = useQueryClient();
		const { companyContext } = useActiveCompanyContext();
		const companyId = companyContext.companyId;

		return useMutation({
			mutationFn: (data: Create) => config.create(companyId, data),
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: keys.all });
			},
		});
	}

	/**
	 * Update an existing record.
	 * Accepts `{ id, data }` as the mutation variable.
	 * Invalidates the `all` query key on success.
	 */
	function useUpdate() {
		const queryClient = useQueryClient();

		return useMutation({
			mutationFn: ({ id, data }: { id: string; data: Update }) =>
				config.update(id, data),
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: keys.all });
			},
		});
	}

	/**
	 * Delete a record by ID.
	 * Invalidates the `all` query key on success.
	 */
	function useDelete() {
		const queryClient = useQueryClient();

		return useMutation({
			mutationFn: (id: string) => config.delete(id),
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: keys.all });
			},
		});
	}

	return {
		keys,
		useList,
		useGet,
		useCreate,
		useUpdate,
		useDelete,
	};
}
