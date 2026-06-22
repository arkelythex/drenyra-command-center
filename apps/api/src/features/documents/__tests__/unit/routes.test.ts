import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildDocumentsModule } from "../..";
import type {
	DocumentRow,
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
			"x-forwarded-for": `10.0.0.${token}`,
			"x-user-id": "usr-routes-test",
			"x-user-role": "analyst",
			"x-company-id": "cmp-10",
			...(init.headers ?? {}),
		},
	};
}

function buildFakeStore(rows: DocumentRow[]): DocumentStorePort {
	return {
		save: vi.fn(async () => undefined),
		update: vi.fn(async () => undefined),
		getById: vi.fn(async (id: string) => rows.find((row) => row.id === id)),
		list: vi.fn(async () => rows),
		toResponseDTO: vi.fn((row: DocumentRow) => ({
			id: row.id,
			clientId: row.clientId || "",
			clientName: row.clientName,
			fileName: row.fileName,
			fileUrl: row.fileUrl,
			fileType: row.fileType,
			fileSize: row.fileSize,
			status: row.status,
		})),
	};
}

describe("documentsRoutes", () => {
	let app: ReturnType<typeof createApp>;
	let store: DocumentStorePort;

	function createApp() {
		return new Elysia().use(
			buildDocumentsModule({
				documentStore: store,
				resolveActorIdFromHeaders: () => "usr-routes-test",
				resolveOrganizationIdFromCompanyId: async () => 10,
			}),
		);
	}

	beforeEach(() => {
		mockResolve.mockResolvedValue({
			ok: true,
			context: {
				userId: "usr-routes-test",
				authUserId: "usr-routes-test",
				legacyUserId: null,
				role: "analyst",
				companyId: "cmp-10",
			},
		});
		store = buildFakeStore([
			{
				id: "doc-1",
				organizationId: 10,
				companyId: "cmp-10",
				clientId: null,
				clientName: "Client",
				fileName: "f1.pdf",
				fileUrl: "https://x/f1.pdf",
				fileType: "PDF",
				fileSize: 1024,
				status: "revision_humana",
				confidenceLevel: null,
				extractedData: null,
				validatedBy: null,
				validatedAt: null,
				validationNotes: null,
				uploadedAt: new Date(),
				processedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		] as unknown as DocumentRow[]);

		app = createApp();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("returns 401 when GET /documents misses auth context", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/documents", {
				headers: {
					"x-forwarded-for": "10.0.0.11",
				},
			}),
		);

		expect(response.status).toBe(401);
		expect(store.list).not.toHaveBeenCalled();
	});

	it("derives GET /documents scope from authenticated caller", async () => {
		const response = await app.handle(
			new Request(
				"http://localhost/api/documents?limit=20&offset=0",
				withUniqueForwardedFor({}, "12"),
			),
		);

		expect(response.status).toBe(200);
		expect(store.list).toHaveBeenCalledTimes(1);
		expect(store.list).toHaveBeenCalledWith(
			expect.objectContaining({
				companyId: "cmp-10",
				organizationId: 10,
			}),
		);
		const payload = await response.json();
		expect(payload.success).toBe(true);
	});

	it("accepts GET /documents when companyId is provided", async () => {
		const response = await app.handle(
			new Request(
				"http://localhost/api/documents?companyId=cmp-10&limit=20&offset=0",
				withUniqueForwardedFor({}, "16"),
			),
		);

		expect(response.status).toBe(200);
		expect(store.list).toHaveBeenCalledWith(
			expect.objectContaining({
				companyId: "cmp-10",
			}),
		);
	});

	it("returns 422 when POST /documents/validate/:id has invalid status", async () => {
		const response = await app.handle(
			new Request(
				"http://localhost/api/documents/validate/doc-1",
				withUniqueForwardedFor(
					{
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({
							status: "not_valid_status",
						}),
					},
					"13",
				),
			),
		);

		expect(response.status).toBe(422);
		expect(store.getById).not.toHaveBeenCalled();
	});

	it("forwards PATCH /documents/:id/status to status handler", async () => {
		const response = await app.handle(
			new Request(
				"http://localhost/api/documents/doc-1/status",
				withUniqueForwardedFor(
					{
						method: "PATCH",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({
							status: "listo_para_sire",
						}),
					},
					"14",
				),
			),
		);

		expect(response.status).toBe(200);
		expect(store.update).toHaveBeenCalledWith(
			"doc-1",
			expect.objectContaining({
				status: "listo_para_sire",
				validated_by: "usr-routes-test",
			}),
			expect.objectContaining({ companyId: "cmp-10", organizationId: 10 }),
		);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				id: "doc-1",
				status: "revision_humana",
			},
		});
	});

	it("returns 422 when POST /documents/reject/:id misses reason", async () => {
		const response = await app.handle(
			new Request(
				"http://localhost/api/documents/reject/doc-2",
				withUniqueForwardedFor(
					{
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({}),
					},
					"15",
				),
			),
		);

		expect(response.status).toBe(422);
		expect(store.update).not.toHaveBeenCalled();
	});
});
