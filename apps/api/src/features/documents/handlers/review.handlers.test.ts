import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DocumentStorePort } from "../ports/document-store.port";
import { createReviewHandlers } from "./review.handlers";
import type { HeaderContainer } from "./types";

describe("review handlers", () => {
	let store: DocumentStorePort;
	let resolveActorIdFromHeaders: (
		headers: HeaderContainer,
	) => string | Promise<string>;
	let parseStoredExtractedData: (raw: unknown) => Record<string, unknown>;

	beforeEach(() => {
		store = {
			save: vi.fn(async () => undefined),
			update: vi.fn(async () => undefined),
			getById: vi.fn(async () => undefined),
			list: vi.fn(async () => []),
			toResponseDTO: vi.fn((doc: unknown) => doc as never),
		};
		resolveActorIdFromHeaders = vi.fn(() => "usr-review");
		parseStoredExtractedData = vi.fn((value: unknown) =>
			typeof value === "object" && value !== null
				? (value as Record<string, unknown>)
				: {},
		);
		vi.clearAllMocks();
	});

	it("returns 400 when rejecting without reason on status update", async () => {
		const set: { status?: number } = {};
		(store.getById as ReturnType<typeof vi.fn>).mockResolvedValue({
			id: "doc-1",
		} as never);
		(resolveActorIdFromHeaders as ReturnType<typeof vi.fn>).mockReturnValue(
			"usr-1",
		);

		const { updateDocumentStatusHandler } = createReviewHandlers({
			documentStore: store,
			resolveActorIdFromHeaders,
			parseStoredExtractedData,
			resolveOrganizationIdFromCompanyId: vi.fn(async () => 1),
		});
		const response = await updateDocumentStatusHandler({
			params: { id: "doc-1" },
			body: { status: "rechazado_por_sire" },
			headers: {
				"x-user-id": "usr-1",
				"x-user-role": "analyst",
				"x-company-id": "cmp-1",
			},
			set,
		});

		expect(set.status).toBe(400);
		expect(response).toMatchObject({
			success: false,
			error: "Reason is required when rejecting",
		});
		expect(store.update).not.toHaveBeenCalled();
	});

	it("validates document and persists merged extracted data", async () => {
		const set: { status?: number } = {};
		const existingData = { issuerName: "Old Corp", confidenceScore: 0.82 };

		(store.getById as ReturnType<typeof vi.fn>).mockResolvedValue({
			id: "doc-2",
			extractedData: existingData,
		} as never);
		(resolveActorIdFromHeaders as ReturnType<typeof vi.fn>).mockReturnValue(
			"usr-2",
		);
		(parseStoredExtractedData as ReturnType<typeof vi.fn>).mockReturnValue(
			existingData,
		);

		const { validateDocumentHandler } = createReviewHandlers({
			documentStore: store,
			resolveActorIdFromHeaders,
			parseStoredExtractedData,
			resolveOrganizationIdFromCompanyId: vi.fn(async () => 1),
		});
		const response = await validateDocumentHandler({
			params: { id: "doc-2" },
			body: {
				status: "approved",
				correctedData: {
					issuerName: "New Corp",
				},
			},
			headers: {
				"x-user-id": "usr-2",
				"x-user-role": "analyst",
				"x-company-id": "cmp-1",
			},
			set,
		});

		expect(set.status).toBeUndefined();
		expect(response).toMatchObject({
			success: true,
			data: {
				id: "doc-2",
				status: "listo_para_sire",
				updatedFields: ["issuerName"],
				confidence: 0.82,
			},
		});
		expect(store.update).toHaveBeenCalledWith(
			"doc-2",
			expect.objectContaining({
				status: "listo_para_sire",
				validated_by: "usr-2",
			}),
			expect.objectContaining({
				companyId: "cmp-1",
			}),
		);
	});

	it("rejects document and sets actor metadata", async () => {
		const set: { status?: number } = {};
		(store.getById as ReturnType<typeof vi.fn>).mockResolvedValue({
			id: "doc-3",
		} as never);
		(resolveActorIdFromHeaders as ReturnType<typeof vi.fn>).mockReturnValue(
			"usr-3",
		);

		const { rejectDocumentHandler } = createReviewHandlers({
			documentStore: store,
			resolveActorIdFromHeaders,
			parseStoredExtractedData,
			resolveOrganizationIdFromCompanyId: vi.fn(async () => 1),
		});
		const response = await rejectDocumentHandler({
			params: { id: "doc-3" },
			body: { reason: "Formato inválido" },
			headers: {
				"x-user-id": "usr-3",
				"x-user-role": "analyst",
				"x-company-id": "cmp-1",
			},
			set,
		});

		expect(set.status).toBeUndefined();
		expect(response).toMatchObject({
			success: true,
			data: {
				id: "doc-3",
				status: "rechazado_por_sire",
				rejectedBy: "usr-3",
			},
		});
		expect(store.update).toHaveBeenCalledWith(
			"doc-3",
			expect.objectContaining({
				rejection_reason: "Formato inválido",
				rejected_by: "usr-3",
			}),
			expect.objectContaining({
				companyId: "cmp-1",
			}),
		);
	});
});
