import { queryOptions } from "@tanstack/react-query";
import {
	type InventoryKardexFilters,
	type InventoryListFilters,
	inventoryApi,
} from "./inventory.api";
import { inventoryKeys } from "./query-keys";

export function inventoryListQueryOptions(filters: InventoryListFilters) {
	return queryOptions({
		queryKey: inventoryKeys.list(filters.companyId),
		queryFn: () => inventoryApi.list(filters),
	});
}

export function inventoryKardexQueryOptions(
	productId: string,
	filters: InventoryKardexFilters,
) {
	return queryOptions({
		queryKey: [...inventoryKeys.all, "kardex", productId, filters] as const,
		queryFn: () => inventoryApi.getKardex(productId, filters),
	});
}

export function inventorySummaryQueryOptions(companyId: string) {
	return queryOptions({
		queryKey: inventoryKeys.summary(companyId),
		queryFn: () => inventoryApi.getSummary(companyId),
	});
}

export function inventoryWarehousesListQueryOptions(companyId: string) {
	return queryOptions({
		queryKey: [...inventoryKeys.all, "warehouses", companyId] as const,
		queryFn: () => inventoryApi.warehouses.list(companyId),
	});
}
