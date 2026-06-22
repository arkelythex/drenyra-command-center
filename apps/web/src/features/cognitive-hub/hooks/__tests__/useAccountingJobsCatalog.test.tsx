import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	useActiveCompanyContextMock: vi.fn(),
	accountingJobsGetMock: vi.fn(),
	getControlPlaneRegistryMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
	api: {
		compliance: {
			"accounting-jobs": {
				get: mocks.accountingJobsGetMock,
			},
		},
	},
}));

vi.mock("@/lib/use-active-company-context", () => ({
	useActiveCompanyContext: mocks.useActiveCompanyContextMock,
}));

vi.mock("../../api/context-control-plane.api", () => ({
	getControlPlaneRegistry: mocks.getControlPlaneRegistryMock,
}));

import { useAccountingJobsCatalog } from "../useAccountingJobsCatalog";

function createWrapper(): ({
	children,
}: {
	children: ReactNode;
}) => JSX.Element {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
		},
	});

	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

describe("useAccountingJobsCatalog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.useActiveCompanyContextMock.mockReturnValue({
			companyContext: {
				companyId: "cmp-1",
				countryCode: "pe",
			},
		});
		mocks.accountingJobsGetMock.mockResolvedValue({
			data: {
				success: true,
				data: {
					countryCode: "pe",
					jobs: [
						{
							id: "prepare-sire",
							title: "Preparar SIRE",
							description: "Supervised SIRE export",
							prompt: "Preparar SIRE del periodo actual",
							category: "compliance",
							cadence: "monthly",
							approvalRequired: true,
							controlPlaneSurface: null,
						},
					],
				},
			},
			error: null,
		});
		mocks.getControlPlaneRegistryMock.mockResolvedValue({
			companyId: "cmp-1",
			count: 1,
			surfaces: [
				{
					surfaceId: "prepare-sire",
					jobId: "prepare-sire",
					title: "Preparar SIRE",
					description: "Representative supervised path",
					tenantScope: "organization",
					approvalsRequired: ["supervisor"],
					allowedTools: ["prepare-sire"],
					allowedCorpora: [],
					retrievalDefault: "hybrid-documentary",
					deterministicFallback: {
						strategyId: "sire-fallback",
						description: "Deterministic fallback",
						owner: "compliance",
						evidenceSource: "sunat",
					},
					contextWindow: {
						maxMemoryItems: 5,
						maxDocumentResults: 3,
						maxToolCalls: 1,
					},
				},
			],
		});
	});

	it("merges registry-backed surface metadata into the job catalog", async () => {
		const { result } = renderHook(() => useAccountingJobsCatalog("pe"), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.data?.jobs[0]?.surfaceId).toBe("prepare-sire");
		});

		expect(result.current.data?.registrySurfaces).toHaveLength(1);
		expect(
			result.current.data?.jobs[0]?.controlPlaneSurface?.retrievalDefault,
		).toBe("hybrid-documentary");
	});
});
