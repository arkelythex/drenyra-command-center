import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildDocumentsModule } from "../..";
import type {
	DocumentResponseDTO,
	DocumentStorePort,
} from "../../ports/document-store.port";

// Mock resolveSessionContext so the companyScopeGuard doesn't reject requests
vi.mock("../../../security/session-context", () => ({
	resolveSessionContext: vi.fn(),
}));

import { resolveSessionContext } from "../../../security/session-context";

const mockResolve = resolveSessionContext as unknown as ReturnType<
	typeof vi.fn
>;

function withUniqueForwardedFor(
	init: RequestInit = {},
	token: string,
): RequestInit {
	return {
		...init,
		headers: {
			"x-forwarded-for": `10.99.0.${token}`,
			"x-user-id": "usr-integration",
			"x-user-role": "analyst",
			"x-company-id": "cmp-integration",
			...(init.headers ?? {}),
		},
	};
}

function buildFakeStore(
	overrides: Partial<DocumentStorePort> = {},
): DocumentStorePort {
	return {
		save: vi.fn(async () => undefined),
		update: vi.fn(async () => undefined),
		getById: vi.fn(async () => undefined),
		list: vi.fn(async () => []),
		toResponseDTO: vi.fn(
			(doc: unknown) =>
				({
					id:
						typeof doc === "object" && doc !== null && "id" in doc
							? String((doc as { id: unknown }).id)
							: "doc-unknown",
					clientId: "",
					clientName: "",
					fileName: "",
					fileUrl: "",
					fileType: "pdf",
					fileSize: 0,
					status:
						typeof doc === "object" && doc !== null && "status" in doc
							? String((doc as { status: unknown }).status)
							: "por_procesar",
				}) satisfies DocumentResponseDTO,
		),
		...overrides,
	};
}

function buildApp(
	store: DocumentStorePort,
	overrides: {
		resolveActorIdFromHeaders?: () => Promise<string> | string;
		parseStoredExtractedData?: (value: unknown) => Record<string, unknown>;
	} = {},
) {
	return new Elysia().use(
		buildDocumentsModule({
			documentStore: store,
			resolveActorIdFromHeaders:
				overrides.resolveActorIdFromHeaders ?? (() => "usr-integration"),
			resolveOrganizationIdFromCompanyId: async () => 10,
			parseStoredExtractedData:
				overrides.parseStoredExtractedData ??
				((value: unknown) =>
					typeof value === "object" && value !== null
						? (value as Record<string, unknown>)
						: {}),
		}),
	);
}

describe("documentsRoutes integration", () => {
	beforeEach(() => {
		mockResolve.mockResolvedValue({
			ok: true,
			context: {
				userId: "usr-integration",
				authUserId: "usr-integration",
				legacyUserId: null,
				role: "analyst",
				companyId: "cmp-integration",
			},
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("GET /documents returns computed counts from repository rows", async () => {
		const store = buildFakeStore({
			list: vi.fn(
				async () =>
					[
						{ id: "d1", status: "por_procesar" },
						{ id: "d2", status: "revision_humana" },
						{ id: "d3", status: "listo_para_sire" },
						{ id: "d4", status: "rechazado_por_sire" },
					] as never,
			),
		});
		const app = buildApp(store);

		const response = await app.handle(
			new Request(
				"http://localhost/api/documents?organizationId=10",
				withUniqueForwardedFor({}, "21"),
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				total: 4,
				counts: {
					porProcesar: 1,
					revisionHumana: 1,
					listoParaSIRE: 1,
					rechazadoPorSIRE: 1,
					total: 4,
				},
			},
		});
	});

	it("GET /documents/:id returns 404 when record is missing inside tenant scope", async () => {
		const store = buildFakeStore();
		const app = buildApp(store);

		const response = await app.handle(
			new Request(
				"http://localhost/api/documents/doc-missing",
				withUniqueForwardedFor({}, "22"),
			),
		);

		expect(response.status).toBe(404);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			error: "Document not found",
			code: "DOCUMENTS_NOT_FOUND",
		});
	});

	it("PATCH /documents/:id/status returns 400 when rejecting without reason", async () => {
		const store = buildFakeStore({
			getById: vi.fn(async () => ({ id: "doc-400" }) as never),
		});
		const app = buildApp(store);

		const response = await app.handle(
			new Request(
				"http://localhost/api/documents/doc-400/status",
				withUniqueForwardedFor(
					{
						method: "PATCH",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({
							status: "rechazado_por_sire",
						}),
					},
					"23",
				),
			),
		);

		expect(response.status).toBe(400);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			error: "Reason is required when rejecting",
			code: "DOCUMENTS_BAD_REQUEST",
		});
		expect(store.update).not.toHaveBeenCalled();
	});

	it("PATCH /documents/:id/status updates and returns mapped document", async () => {
		const store = buildFakeStore({
			getById: vi
				.fn()
				.mockResolvedValueOnce({
					id: "doc-200",
					status: "revision_humana",
				} as never)
				.mockResolvedValueOnce({
					id: "doc-200",
					status: "listo_para_sire",
				} as never),
			toResponseDTO: vi.fn(
				() =>
					({
						id: "doc-200",
						clientId: "",
						clientName: "",
						fileName: "",
						fileUrl: "",
						fileType: "pdf",
						fileSize: 0,
						status: "listo_para_sire",
					}) satisfies DocumentResponseDTO,
			),
		});
		const app = buildApp(store, {
			resolveActorIdFromHeaders: () => "usr-99",
		});

		const response = await app.handle(
			new Request(
				"http://localhost/api/documents/doc-200/status",
				withUniqueForwardedFor(
					{
						method: "PATCH",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({
							status: "listo_para_sire",
						}),
					},
					"24",
				),
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				id: "doc-200",
				status: "listo_para_sire",
			},
		});
		expect(store.update).toHaveBeenCalledWith(
			"doc-200",
			expect.objectContaining({
				status: "listo_para_sire",
				validated_by: "usr-integration",
			}),
			expect.objectContaining({
				companyId: "cmp-integration",
				organizationId: 10,
			}),
		);
	});

	it("POST /documents/validate/:id merges correctedData and returns confidence", async () => {
		const store = buildFakeStore({
			getById: vi.fn(
				async () =>
					({
						id: "doc-v1",
						extractedData: { confidenceScore: 0.77, issuerName: "Old Co" },
					}) as never,
			),
		});
		const app = buildApp(store, {
			resolveActorIdFromHeaders: () => "usr-validate",
			parseStoredExtractedData: () => ({
				confidenceScore: 0.77,
				issuerName: "Old Co",
			}),
		});

		const response = await app.handle(
			new Request(
				"http://localhost/api/documents/validate/doc-v1",
				withUniqueForwardedFor(
					{
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({
							status: "approved",
							correctedData: {
								issuerName: "New Co",
							},
						}),
					},
					"25",
				),
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				id: "doc-v1",
				status: "listo_para_sire",
				updatedFields: ["issuerName"],
				confidence: 0.77,
			},
		});
		expect(store.update).toHaveBeenCalledWith(
			"doc-v1",
			expect.objectContaining({
				validated_by: "usr-integration",
				status: "listo_para_sire",
				extracted_data: expect.objectContaining({
					issuerName: "New Co",
					confidenceScore: 0.77,
				}),
			}),
			expect.objectContaining({
				companyId: "cmp-integration",
				organizationId: 10,
			}),
		);
	});

	it("GET /documents/:id returns 401 when auth headers are missing", async () => {
		const store = buildFakeStore();
		const app = buildApp(store);

		// Override the beforeEach mock to simulate auth failure
		mockResolve.mockResolvedValue({
			ok: false,
			status: 401,
			code: "AUTH_REQUIRED",
			error: "Missing auth context headers",
		});

		const response = await app.handle(
			new Request("http://localhost/api/documents/doc-no-tenant", {
				headers: {
					"x-forwarded-for": "10.99.0.26",
				},
			}),
		);

		expect(response.status).toBe(401);
		const text = await response.text();
		expect(text).toContain("Missing");
		expect(store.getById).not.toHaveBeenCalled();
	});
});
