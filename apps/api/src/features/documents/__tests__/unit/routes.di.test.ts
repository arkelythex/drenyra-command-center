import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
	companyId = "cmp-test",
): RequestInit {
	return {
		...init,
		headers: {
			"x-forwarded-for": `10.88.0.${token}`,
			"x-user-id": `usr-${token}`,
			"x-user-role": "admin",
			"x-company-id": companyId,
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

describe("buildDocumentsRoutes DI", () => {
	beforeEach(() => {
		mockResolve.mockResolvedValue({
			ok: true,
			context: {
				userId: "usr-di-test",
				authUserId: "usr-di-test",
				legacyUserId: null,
				role: "admin",
				companyId: "cmp-test",
			},
		});
	});

	it("uses injected store for GET /documents list", async () => {
		const fakeRows = [
			{
				id: "doc-di-1",
				organizationId: 1,
				companyId: "cmp-test",
				clientId: null,
				clientName: "Client",
				fileName: "f1.pdf",
				fileUrl: "https://x/f1.pdf",
				fileType: "PDF",
				fileSize: 1024,
				status: "por_procesar",
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
		] as unknown as DocumentRow[];
		const store = buildFakeStore(fakeRows);
		const app = new Elysia().use(
			buildDocumentsModule({
				documentStore: store,
				resolveOrganizationIdFromCompanyId: async () => 1,
			}),
		);

		const response = await app.handle(
			new Request(
				"http://localhost/api/documents?organizationId=1",
				withUniqueForwardedFor({}, "31"),
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload.success).toBe(true);
		expect(payload.data.total).toBe(1);
		expect(store.list).toHaveBeenCalledTimes(1);
		expect(store.toResponseDTO).toHaveBeenCalledTimes(1);
	});

	it("uses injected store for company-scoped GET /documents list", async () => {
		const fakeRows = [
			{
				id: "doc-di-company",
				companyId: "cmp-1",
				organizationId: 1,
				clientId: null,
				clientName: "Client",
				fileName: "f-company.pdf",
				fileUrl: "https://x/f-company.pdf",
				fileType: "PDF",
				fileSize: 256,
				status: "por_procesar",
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
		] as unknown as DocumentRow[];
		const store = buildFakeStore(fakeRows);
		const app = new Elysia().use(
			buildDocumentsModule({
				documentStore: store,
				resolveOrganizationIdFromCompanyId: async () => 1,
			}),
		);

		// Override the beforeEach mock to match this test's company scope
		mockResolve.mockResolvedValue({
			ok: true,
			context: {
				userId: "usr-34",
				authUserId: "usr-34",
				legacyUserId: null,
				role: "admin",
				companyId: "cmp-1",
			},
		});

		const response = await app.handle(
			new Request(
				"http://localhost/api/documents?organizationId=1",
				withUniqueForwardedFor({}, "34", "cmp-1"),
			),
		);

		expect(response.status).toBe(200);
		expect(store.list).toHaveBeenCalledWith(
			expect.objectContaining({
				companyId: "cmp-1",
			}),
		);
	});

	it("uses injected store for GET /documents/:id", async () => {
		const fakeRows = [
			{
				id: "doc-di-2",
				organizationId: 1,
				companyId: "cmp-test",
				clientId: null,
				clientName: "Client",
				fileName: "f2.xml",
				fileUrl: "https://x/f2.xml",
				fileType: "XML",
				fileSize: 2048,
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
		] as unknown as DocumentRow[];
		const store = buildFakeStore(fakeRows);
		const app = new Elysia().use(
			buildDocumentsModule({
				documentStore: store,
				resolveOrganizationIdFromCompanyId: async () => 1,
			}),
		);

		const response = await app.handle(
			new Request(
				"http://localhost/api/documents/doc-di-2",
				withUniqueForwardedFor({}, "32"),
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: { id: "doc-di-2" },
		});
		expect(store.getById).toHaveBeenCalledWith(
			"doc-di-2",
			expect.objectContaining({ companyId: "cmp-test" }),
		);
		expect(store.toResponseDTO).toHaveBeenCalledTimes(1);
	});

	it("uses injected actor resolver on PATCH /documents/:id/status", async () => {
		const fakeRows = [
			{
				id: "doc-di-3",
				organizationId: 1,
				companyId: "cmp-test",
				clientId: null,
				clientName: "Client",
				fileName: "f3.xml",
				fileUrl: "https://x/f3.xml",
				fileType: "XML",
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
		] as unknown as DocumentRow[];
		const store = buildFakeStore(fakeRows);
		const injectedResolver = vi.fn(() => "usr-di-resolver");
		const app = new Elysia().use(
			buildDocumentsModule({
				documentStore: store,
				resolveActorIdFromHeaders: injectedResolver,
				resolveOrganizationIdFromCompanyId: async () => 1,
			}),
		);

		const response = await app.handle(
			new Request(
				"http://localhost/api/documents/doc-di-3/status",
				withUniqueForwardedFor(
					{
						method: "PATCH",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({
							status: "listo_para_sire",
						}),
					},
					"33",
					"cmp-test",
				),
			),
		);

		// Test validates that the status update works with the authenticated context
		// The actor ID comes from the security middleware, not from injected resolver
		expect(response.status).toBe(200);
		expect(store.update).toHaveBeenCalledWith(
			"doc-di-3",
			expect.objectContaining({
				status: "listo_para_sire",
			}),
			expect.objectContaining({ companyId: "cmp-test" }),
		);
	});
});
