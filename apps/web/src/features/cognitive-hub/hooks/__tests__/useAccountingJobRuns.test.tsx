import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	useActiveCompanyContextMock: vi.fn(),
	accountingJobRunsGetMock: vi.fn(),
	getControlPlaneRegistryMock: vi.fn(),
	getControlPlaneRunStateMock: vi.fn(),
	getControlPlaneRunTraceMock: vi.fn(),
	getControlPlaneRunEvaluationMock: vi.fn(),
	getLegacyUserIdMock: vi.fn(() => "legacy-user-1"),
}));

vi.mock("@/lib/api", () => ({
	api: {
		compliance: {
			"accounting-job-runs": {
				get: mocks.accountingJobRunsGetMock,
			},
		},
	},
	getLegacyUserId: mocks.getLegacyUserIdMock,
}));

vi.mock("@/lib/use-active-company-context", () => ({
	useActiveCompanyContext: mocks.useActiveCompanyContextMock,
}));

vi.mock("../../api/context-control-plane.api", () => ({
	getControlPlaneRegistry: mocks.getControlPlaneRegistryMock,
	getControlPlaneRunState: mocks.getControlPlaneRunStateMock,
	getControlPlaneRunTrace: mocks.getControlPlaneRunTraceMock,
	getControlPlaneRunEvaluation: mocks.getControlPlaneRunEvaluationMock,
	isControlPlaneMissingTraceError: (error: unknown) =>
		error instanceof Error &&
		"code" in error &&
		(error as Error & { code?: string }).code === "CONTEXT_TRACE_ID_REQUIRED",
}));

import { useAccountingJobRuns } from "../useAccountingJobRuns";

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

const baseRun = {
	id: "run-1",
	companyId: "cmp-1",
	countryCode: "pe",
	jobId: "prepare-sire",
	jobTitle: "Preparar SIRE",
	jobCategory: "compliance",
	status: "COMPLETED",
	approvalRequired: true,
	requestedBy: "legacy-user-1",
	approvedBy: "supervisor-1",
	prompt: "Preparar SIRE del periodo actual",
	summary: "SIRE listo",
	inputPayload: {
		contextControlPlane: {
			traceId: "trace-1234",
			surfaceId: "prepare-sire",
			representativePath: true,
			policy: { retrievalMode: "hybrid-documentary" },
			traceRecords: [
				{
					eventType: "policy-resolved",
					traceId: "trace-1234",
					occurredAt: "2026-04-01T00:00:00.000Z",
					summary: "Policy resolved",
					piiRedacted: true,
					attributes: {
						traceId: "trace-1234",
						runId: "run-1",
						surfaceId: "prepare-sire",
						tenantId: "cmp-1",
					},
				},
			],
		},
	},
	resultPayload: null,
	evidencePayload: {
		documentarySources: [{ source: "sunat-manual" }],
	},
	startedAt: "2026-04-01T00:00:00.000Z",
	completedAt: "2026-04-01T00:05:00.000Z",
	createdAt: "2026-04-01T00:00:00.000Z",
	updatedAt: "2026-04-01T00:05:00.000Z",
} as const;

describe("useAccountingJobRuns", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.useActiveCompanyContextMock.mockReturnValue({
			companyContext: {
				companyId: "cmp-1",
				countryCode: "pe",
			},
		});
		mocks.accountingJobRunsGetMock.mockResolvedValue({
			data: {
				success: true,
				data: {
					runs: [baseRun],
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
					description: "Representative path",
					tenantScope: "organization",
					approvalsRequired: ["supervisor"],
					allowedTools: ["prepare-sire"],
					allowedCorpora: [],
					retrievalDefault: "hybrid-documentary",
					deterministicFallback: {
						strategyId: "sire-fallback",
						description: "fallback",
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

	it("hydrates run visibility with typed control-plane state, trace, and evaluation", async () => {
		mocks.getControlPlaneRunStateMock.mockResolvedValue({
			runId: "run-1",
			traceId: "trace-1234",
			surfaceId: "prepare-sire",
			approvalState: "approved",
			retrievalMode: "hybrid-documentary",
			contextWindow: {
				maxMemoryItems: 5,
				maxDocumentResults: 3,
				maxToolCalls: 1,
			},
			evaluationSummary: null,
		});
		mocks.getControlPlaneRunTraceMock.mockResolvedValue({
			runId: "run-1",
			count: 1,
			events: [baseRun.inputPayload.contextControlPlane.traceRecords[0]],
		});
		mocks.getControlPlaneRunEvaluationMock.mockResolvedValue({
			runId: "run-1",
			evaluationSummary: {
				state: "green",
				metrics: [],
				generatedAt: "2026-04-01T00:05:00.000Z",
			},
		});

		const { result } = renderHook(() => useAccountingJobRuns(4), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.runs[0]?.controlPlane?.traceId).toBe("trace-1234");
		});

		expect(result.current.runs[0]?.controlPlane?.surface?.title).toBe(
			"Preparar SIRE",
		);
		expect(result.current.runs[0]?.controlPlane?.evaluationSummary?.state).toBe(
			"green",
		);
	});

	it("falls back to persisted snapshot when trace reads are unavailable", async () => {
		const missingTraceError = Object.assign(new Error("missing trace"), {
			code: "CONTEXT_TRACE_ID_REQUIRED",
		});
		mocks.getControlPlaneRunStateMock.mockRejectedValue(missingTraceError);
		mocks.getControlPlaneRunTraceMock.mockRejectedValue(missingTraceError);
		mocks.getControlPlaneRunEvaluationMock.mockRejectedValue(missingTraceError);

		const { result } = renderHook(() => useAccountingJobRuns(4), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.runs[0]?.controlPlane?.trace.length).toBe(1);
		});

		expect(result.current.runs[0]?.controlPlane?.approvalState).toBe(
			"approved",
		);
		expect(
			result.current.runs[0]?.controlPlane?.documentarySources,
		).toHaveLength(1);
	});

	it("can defer control-plane enrichment for collapsed timeline consumers", async () => {
		const { result } = renderHook(
			() => useAccountingJobRuns(4, { includeControlPlane: false }),
			{
				wrapper: createWrapper(),
			},
		);

		await waitFor(() => {
			expect(result.current.runs).toHaveLength(1);
		});

		expect(result.current.runs[0]?.controlPlane).toBeNull();
		expect(mocks.getControlPlaneRegistryMock).not.toHaveBeenCalled();
		expect(mocks.getControlPlaneRunStateMock).not.toHaveBeenCalled();
		expect(mocks.getControlPlaneRunTraceMock).not.toHaveBeenCalled();
		expect(mocks.getControlPlaneRunEvaluationMock).not.toHaveBeenCalled();
	});

	it("reuses the base runs cache when control-plane hydration is enabled later", async () => {
		mocks.getControlPlaneRunStateMock.mockResolvedValue({
			runId: "run-1",
			traceId: "trace-1234",
			surfaceId: "prepare-sire",
			approvalState: "approved",
			retrievalMode: "hybrid-documentary",
			contextWindow: {
				maxMemoryItems: 5,
				maxDocumentResults: 3,
				maxToolCalls: 1,
			},
			evaluationSummary: null,
		});
		mocks.getControlPlaneRunTraceMock.mockResolvedValue({
			runId: "run-1",
			count: 1,
			events: [baseRun.inputPayload.contextControlPlane.traceRecords[0]],
		});
		mocks.getControlPlaneRunEvaluationMock.mockResolvedValue({
			runId: "run-1",
			evaluationSummary: {
				state: "green",
				metrics: [],
				generatedAt: "2026-04-01T00:05:00.000Z",
			},
		});

		const { result, rerender } = renderHook(
			({ includeControlPlane }: { includeControlPlane: boolean }) =>
				useAccountingJobRuns(4, { includeControlPlane }),
			{
				initialProps: { includeControlPlane: false },
				wrapper: createWrapper(),
			},
		);

		await waitFor(() => {
			expect(result.current.runs).toHaveLength(1);
		});

		expect(result.current.runs[0]?.controlPlane).toBeNull();
		expect(mocks.accountingJobRunsGetMock).toHaveBeenCalledTimes(1);

		rerender({ includeControlPlane: true });

		await waitFor(() => {
			expect(result.current.runs[0]?.controlPlane?.traceId).toBe("trace-1234");
		});

		expect(mocks.accountingJobRunsGetMock).toHaveBeenCalledTimes(1);
		expect(mocks.getControlPlaneRegistryMock).toHaveBeenCalledTimes(1);
	});
});
