import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getMock: vi.fn(),
	validatePostMock: vi.fn(),
	rejectPostMock: vi.fn(),
	useActiveCompanyContextMock: vi.fn(),
}));

vi.mock("../api/documents-treaty-client", () => ({
	documentsTreatyClient: {
		get: mocks.getMock,
		validate: ({ id }: { id: string }) => ({
			post: (body: unknown) => mocks.validatePostMock(id, body),
		}),
		reject: ({ id }: { id: string }) => ({
			post: (body: unknown) => mocks.rejectPostMock(id, body),
		}),
	},
	parseDocumentsTreatyError: (
		error: { value?: unknown } | null | undefined,
		fallback: string,
	) => {
		if (error && typeof error.value === "string") {
			return { message: error.value, runbook: null };
		}
		return { message: fallback, runbook: null };
	},
	parseDocumentsEnvelopeError: (value: unknown, fallback: string) => {
		if (typeof value === "object" && value !== null) {
			const record = value as Record<string, unknown>;
			const message =
				typeof record.error === "string" ? record.error : fallback;
			const runbook =
				typeof record.runbook === "object" && record.runbook !== null
					? (record.runbook as { id: string; title?: string })
					: null;
			return { message, runbook };
		}
		return { message: fallback, runbook: null };
	},
}));

vi.mock("@/lib/use-active-company-context", () => ({
	useActiveCompanyContext: mocks.useActiveCompanyContextMock,
}));

import { useReviewQueue } from "./useReviewQueue";

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

	return { wrapper };
}

describe("review/useReviewQueue", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.useActiveCompanyContextMock.mockReturnValue({
			companyContext: {
				companyId: "company-1",
				companyName: "ARKELYTHEX S.A.C.",
				ruc: "20555555555",
				isDemoFallback: false,
			},
			availableCompanies: [],
			setActiveCompanyById: vi.fn(),
		});
		mocks.getMock.mockResolvedValue({
			error: null,
			data: {
				success: true,
				data: {
					documents: [
						{
							id: "doc-1",
							fileName: "factura-1.pdf",
							status: "revision_humana",
							confidenceLevel: "high",
							uploadedAt: "2026-04-18T12:00:00.000Z",
							extractedData: {
								issuerRUC: "20100017491",
								total: 450.5,
							},
						},
					],
					total: 1,
				},
			},
		});
		mocks.validatePostMock.mockResolvedValue({
			error: null,
			data: { success: true, data: { id: "doc-1", status: "listo_para_sire" } },
		});
		mocks.rejectPostMock.mockResolvedValue({
			error: null,
			data: {
				success: true,
				data: { id: "doc-1", status: "rechazado_por_sire" },
			},
		});
	});

	it("loads queue items from Eden documents route", async () => {
		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useReviewQueue(), { wrapper });

		await waitFor(() => {
			expect(result.current.data).toHaveLength(1);
		});

		expect(mocks.getMock).toHaveBeenCalledWith(
			expect.objectContaining({
				query: expect.objectContaining({
					companyId: "company-1",
					status: "revision_humana",
				}),
			}),
		);
		expect(result.current.data?.[0]).toMatchObject({
			id: "doc-1",
			filename: "factura-1.pdf",
			status: "conflict",
		});
	});

	it("captures approve failure with runbook and retries action", async () => {
		mocks.validatePostMock
			.mockResolvedValueOnce({
				error: null,
				data: {
					success: false,
					error: "No se pudo aprobar",
					runbook: { id: "RB-DOC-001", title: "Documents approval fallback" },
				},
			})
			.mockResolvedValueOnce({
				error: null,
				data: {
					success: true,
					data: { id: "doc-1", status: "listo_para_sire" },
				},
			});

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useReviewQueue(), { wrapper });

		await waitFor(() => {
			expect(result.current.data).toHaveLength(1);
		});

		await act(async () => {
			await result.current.approveDocument("doc-1");
		});

		expect(result.current.actionError).toMatchObject({
			action: "approve",
			documentId: "doc-1",
			message: "No se pudo aprobar",
			runbook: { id: "RB-DOC-001" },
		});

		await act(async () => {
			await result.current.retryLastAction();
		});

		expect(mocks.validatePostMock).toHaveBeenCalledTimes(2);
		expect(result.current.actionError).toBeNull();
	});
});
