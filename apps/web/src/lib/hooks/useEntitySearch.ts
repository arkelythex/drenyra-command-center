import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

export interface EntitySearchOptions<T, TStats> {
	/** TanStack Query key for the list (caller should include companyId). */
	queryKey: readonly unknown[];
	/** Async fetcher that receives a companyId. */
	fetcher: (companyId: string) => Promise<T[]>;
	/** Return the string fields to search against (name, taxId, etc.). */
	searchFields: (item: T) => string[];
	/** Available tab identifiers. */
	tabs: readonly string[];
	/** Derive stats from the full (unfiltered) list. */
	calculateStats: (items: T[]) => TStats;
}

export interface EntitySearchResult<T, TStats> {
	/** Items filtered by the current search query. */
	filtered: T[];
	/** Raw unfiltered list from the query. */
	raw: T[];
	/** Current search text. */
	searchQuery: string;
	setSearchQuery: (value: string) => void;
	/** IDs of expanded/collapsed items. */
	expandedIds: string[];
	toggleItem: (id: string) => void;
	/** Active tab. */
	activeTab: string;
	setActiveTab: (tab: string) => void;
	/** Derived statistics from the full list. */
	stats: TStats;
	isLoading: boolean;
	isError: boolean;
	/** Re-fetch the list query. */
	refetch: () => Promise<unknown>;
}

/**
 * Shared hook for entity list features that need search filtering,
 * expand/collapse toggling, tab navigation, and stats calculation.
 *
 * Extracted from the nearly identical `useCustomers` / `useVendors` hooks
 * (~80 % code duplication) into a single generic factory.
 */
export function useEntitySearch<T extends { id: string }, TStats>(
	options: EntitySearchOptions<T, TStats>,
	companyId: string,
): EntitySearchResult<T, TStats> {
	const { queryKey, fetcher, searchFields, tabs, calculateStats } = options;
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedIds, setExpandedIds] = useState<string[]>([]);
	const [activeTab, setActiveTab] = useState<string>(tabs[0] ?? "");

	const {
		data: raw = [],
		isLoading,
		isError,
		refetch,
	} = useQuery({
		queryKey,
		queryFn: () => fetcher(companyId),
	});

	const filtered = useMemo(() => {
		if (!searchQuery) return raw;
		const query = searchQuery.toLowerCase();
		return raw.filter((item) =>
			searchFields(item).some((field) => field.toLowerCase().includes(query)),
		);
	}, [raw, searchQuery, searchFields]);

	const toggleItem = useCallback((id: string) => {
		setExpandedIds((prev) =>
			prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
		);
	}, []);

	const stats = useMemo(() => calculateStats(raw), [raw, calculateStats]);

	return {
		filtered,
		raw,
		searchQuery,
		setSearchQuery,
		expandedIds,
		toggleItem,
		activeTab,
		setActiveTab,
		stats,
		refetch,
		isLoading,
		isError,
	};
}
