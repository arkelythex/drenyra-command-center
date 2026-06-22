import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let currentCompanyId = "comp-1";

vi.mock("@/lib/use-active-company-context", () => ({
	useActiveCompanyContext: () => ({
		companyContext: { companyId: currentCompanyId },
	}),
}));

import { useSettingsGeneral } from "../use-settings-general";

function createWrapper(queryClient: QueryClient) {
	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

describe("useSettingsGeneral", () => {
	beforeEach(() => {
		currentCompanyId = "comp-1";
		vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
			const url = String(input);
			const companyId = url.includes("comp-2") ? "comp-2" : "comp-1";

			return {
				ok: true,
				json: async () => ({
					language: "es",
					timezone: "America/Lima",
					currency: companyId === "comp-2" ? "USD" : "PEN",
					companyName: companyId === "comp-2" ? "Company Two" : "Company One",
					companyRuc: companyId === "comp-2" ? "20111111112" : "20111111111",
					autoClosePeriod: true,
					showAmountsInWords: false,
				}),
			} as Response;
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("keeps settings cached per company instead of reusing a global key", async () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false, gcTime: Number.POSITIVE_INFINITY },
			},
		});

		const { result, rerender } = renderHook(() => useSettingsGeneral(), {
			wrapper: createWrapper(queryClient),
		});

		await waitFor(() => {
			expect(result.current.companyName).toBe("Company One");
		});

		currentCompanyId = "comp-2";
		rerender();

		await waitFor(() => {
			expect(result.current.companyName).toBe("Company Two");
			expect(result.current.currency).toBe("USD");
		});

		expect(
			queryClient.getQueryData(["company-settings", "comp-1"]),
		).toMatchObject({ companyName: "Company One", currency: "PEN" });
		expect(
			queryClient.getQueryData(["company-settings", "comp-2"]),
		).toMatchObject({ companyName: "Company Two", currency: "USD" });
	});
});
