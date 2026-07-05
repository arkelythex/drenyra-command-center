import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { useEntitySearch } from "../useEntitySearch";

interface TestEntity {
	id: string;
	name: string;
	taxId: string;
	amount: number;
}

interface TestStats {
	count: number;
	total: number;
}

const MOCK_ITEMS: TestEntity[] = [
	{ id: "1", name: "Juan Pérez", taxId: "12345678", amount: 100 },
	{ id: "2", name: "María García", taxId: "87654321", amount: 200 },
	{ id: "3", name: "Empresa SAC", taxId: "20123456789", amount: 300 },
];

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
			},
		},
	});
	return function Wrapper({ children }: { children: React.ReactNode }) {
		return React.createElement(
			QueryClientProvider,
			{ client: queryClient },
			children,
		);
	};
}

describe("useEntitySearch", () => {
	it("returns all items unfiltered when searchQuery is empty", async () => {
		const { result } = renderHook(
			() =>
				useEntitySearch<TestEntity, TestStats>(
					{
						queryKey: ["test-entities", "company-1"],
						fetcher: async () => MOCK_ITEMS,
						searchFields: (e) => [e.name, e.taxId],
						tabs: ["all", "active"] as const,
						calculateStats: (items) => ({
							count: items.length,
							total: items.reduce((s, e) => s + e.amount, 0),
						}),
					},
					"company-1",
				),
			{ wrapper: createWrapper() },
		);

		await waitFor(() => expect(result.current.isLoading).toBe(false));

		expect(result.current.raw).toHaveLength(3);
		expect(result.current.filtered).toHaveLength(3);
	});

	it("filters by search query", async () => {
		const { result } = renderHook(
			() =>
				useEntitySearch<TestEntity, TestStats>(
					{
						queryKey: ["test-entities", "company-1"],
						fetcher: async () => MOCK_ITEMS,
						searchFields: (e) => [e.name, e.taxId],
						tabs: ["all", "active"] as const,
						calculateStats: (items) => ({
							count: items.length,
							total: items.reduce((s, e) => s + e.amount, 0),
						}),
					},
					"company-1",
				),
			{ wrapper: createWrapper() },
		);

		await waitFor(() => expect(result.current.isLoading).toBe(false));

		act(() => result.current.setSearchQuery("juan"));

		expect(result.current.filtered).toHaveLength(1);
		expect(result.current.filtered[0].name).toBe("Juan Pérez");
	});

	it("filters by taxId", async () => {
		const { result } = renderHook(
			() =>
				useEntitySearch<TestEntity, TestStats>(
					{
						queryKey: ["test-entities", "company-1"],
						fetcher: async () => MOCK_ITEMS,
						searchFields: (e) => [e.name, e.taxId],
						tabs: ["all", "active"] as const,
						calculateStats: (items) => ({
							count: items.length,
							total: items.reduce((s, e) => s + e.amount, 0),
						}),
					},
					"company-1",
				),
			{ wrapper: createWrapper() },
		);

		await waitFor(() => expect(result.current.isLoading).toBe(false));

		act(() => result.current.setSearchQuery("20123456789"));

		expect(result.current.filtered).toHaveLength(1);
		expect(result.current.filtered[0].name).toBe("Empresa SAC");
	});

	it("toggles expanded ids", async () => {
		const { result } = renderHook(
			() =>
				useEntitySearch<TestEntity, TestStats>(
					{
						queryKey: ["test-entities", "company-1"],
						fetcher: async () => MOCK_ITEMS,
						searchFields: (e) => [e.name, e.taxId],
						tabs: ["all", "active"] as const,
						calculateStats: (items) => ({
							count: items.length,
							total: items.reduce((s, e) => s + e.amount, 0),
						}),
					},
					"company-1",
				),
			{ wrapper: createWrapper() },
		);

		await waitFor(() => expect(result.current.isLoading).toBe(false));

		expect(result.current.expandedIds).toHaveLength(0);

		act(() => result.current.toggleItem("1"));
		expect(result.current.expandedIds).toEqual(["1"]);

		act(() => result.current.toggleItem("1"));
		expect(result.current.expandedIds).toHaveLength(0);
	});

	it("sets active tab", async () => {
		const { result } = renderHook(
			() =>
				useEntitySearch<TestEntity, TestStats>(
					{
						queryKey: ["test-entities", "company-1"],
						fetcher: async () => MOCK_ITEMS,
						searchFields: (e) => [e.name, e.taxId],
						tabs: ["all", "active"] as const,
						calculateStats: (items) => ({
							count: items.length,
							total: items.reduce((s, e) => s + e.amount, 0),
						}),
					},
					"company-1",
				),
			{ wrapper: createWrapper() },
		);

		await waitFor(() => expect(result.current.isLoading).toBe(false));

		expect(result.current.activeTab).toBe("all");

		act(() => result.current.setActiveTab("active"));
		expect(result.current.activeTab).toBe("active");
	});

	it("calculates stats from raw data", async () => {
		const { result } = renderHook(
			() =>
				useEntitySearch<TestEntity, TestStats>(
					{
						queryKey: ["test-entities", "company-1"],
						fetcher: async () => MOCK_ITEMS,
						searchFields: (e) => [e.name, e.taxId],
						tabs: ["all", "active"] as const,
						calculateStats: (items) => ({
							count: items.length,
							total: items.reduce((s, e) => s + e.amount, 0),
						}),
					},
					"company-1",
				),
			{ wrapper: createWrapper() },
		);

		await waitFor(() => expect(result.current.isLoading).toBe(false));

		expect(result.current.stats.count).toBe(3);
		expect(result.current.stats.total).toBe(600);
	});

	it("returns empty filtered when nothing matches search", async () => {
		const { result } = renderHook(
			() =>
				useEntitySearch<TestEntity, TestStats>(
					{
						queryKey: ["test-entities", "company-1"],
						fetcher: async () => MOCK_ITEMS,
						searchFields: (e) => [e.name, e.taxId],
						tabs: ["all", "active"] as const,
						calculateStats: (items) => ({
							count: items.length,
							total: items.reduce((s, e) => s + e.amount, 0),
						}),
					},
					"company-1",
				),
			{ wrapper: createWrapper() },
		);

		await waitFor(() => expect(result.current.isLoading).toBe(false));

		act(() => result.current.setSearchQuery("zzzzz_no_match"));

		expect(result.current.filtered).toHaveLength(0);
	});

	it("preserves raw data when filtering", async () => {
		const { result } = renderHook(
			() =>
				useEntitySearch<TestEntity, TestStats>(
					{
						queryKey: ["test-entities", "company-1"],
						fetcher: async () => MOCK_ITEMS,
						searchFields: (e) => [e.name, e.taxId],
						tabs: ["all", "active"] as const,
						calculateStats: (items) => ({
							count: items.length,
							total: items.reduce((s, e) => s + e.amount, 0),
						}),
					},
					"company-1",
				),
			{ wrapper: createWrapper() },
		);

		await waitFor(() => expect(result.current.isLoading).toBe(false));

		act(() => result.current.setSearchQuery("juan"));

		expect(result.current.filtered).toHaveLength(1);
		expect(result.current.raw).toHaveLength(3);
	});
});
