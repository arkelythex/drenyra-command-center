import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const { readinessGetMock } = vi.hoisted(() => ({
	readinessGetMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
	api: {
		api: {
			"electronic-invoicing": {
				ose: {
					readiness: {
						get: readinessGetMock,
					},
				},
			},
		},
	},
	getGovernanceAuditHeaders: vi.fn(() => ({
		"x-company-id": "cmp-1",
		"x-active-company-id": "cmp-1",
	})),
}));

import { useOseReadiness } from "../useOseReadiness";

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

	return {
		wrapper: ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		),
	};
}

describe("useOseReadiness", () => {
	it("returns OSE readiness payload from the backend route", async () => {
		readinessGetMock.mockResolvedValue({
			data: {
				success: true,
				data: {
					status: "ready",
					provider: "nubefact",
					environment: "production",
					simulationMode: false,
					online: true,
					message: "NubeFact online",
					configuration: {
						valid: true,
						missing: [],
						errors: [],
						hasApiUrl: true,
						hasApiToken: true,
						hasCompanyRuc: true,
						hasUsername: true,
						hasWebhookSecret: true,
					},
				},
			},
		});

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useOseReadiness(), { wrapper });

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toMatchObject({
			status: "ready",
			provider: "nubefact",
		});
	});
});
