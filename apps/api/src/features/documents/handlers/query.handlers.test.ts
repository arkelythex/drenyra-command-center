import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DocumentStorePort } from "../ports/document-store.port";
import { createQueryHandlers } from "./query.handlers";

describe("query handlers", () => {
	let store: DocumentStorePort;

	beforeEach(() => {
		store = {
			save: vi.fn(async () => undefined),
			update: vi.fn(async () => undefined),
			getById: vi.fn(async () => undefined),
			list: vi.fn(async () => []),
			toResponseDTO: vi.fn((doc: unknown) => doc as never),
		};
	});

	it("returns list with status counts", async () => {
		const set: { status?: number } = {};
		const docs = [
			{ id: "1", status: "por_procesar" },
			{ id: "2", status: "revision_humana" },
			{ id: "3", status: "listo_para_sire" },
			{ id: "4", status: "rechazado_por_sire" },
		];
		(store.list as ReturnType<typeof vi.fn>).mockResolvedValue(docs as never);

		const { listDocumentsHandler } = createQueryHandlers({
			documentStore: store,
			resolveOrganizationIdFromCompanyId: vi.fn(async () => 1),
		});
		const response = await listDocumentsHandler({
			query: { organizationId: 1, limit: 10, offset: 0 },
			headers: {
				"x-user-id": "usr-1",
				"x-user-role": "viewer",
				"x-company-id": "cmp-1",
			},
			set,
		});

		expect(set.status).toBeUndefined();
		expect(response).toMatchObject({
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

	it("rejects list queries when organization assertion mismatches tenant scope", async () => {
		const set: { status?: number } = {};
		const { listDocumentsHandler } = createQueryHandlers({
			documentStore: store,
			resolveOrganizationIdFromCompanyId: vi.fn(async () => 9),
		});

		const response = await listDocumentsHandler({
			query: { organizationId: 99, limit: 25, offset: 0 },
			headers: {
				"x-user-id": "usr-1",
				"x-user-role": "viewer",
				"x-company-id": "cmp-1",
			},
			set,
		});

		expect(set.status).toBe(403);
		expect(response).toMatchObject({
			success: false,
			error: "Requested organizationId does not match caller tenant scope",
			code: "TENANT_SCOPE_VIOLATION",
		});
		expect(store.list).not.toHaveBeenCalled();
	});

	it("returns 404 when requested document does not exist", async () => {
		const set: { status?: number } = {};
		const { getDocumentByIdHandler } = createQueryHandlers({
			documentStore: store,
			resolveOrganizationIdFromCompanyId: vi.fn(async () => 1),
		});

		const response = await getDocumentByIdHandler({
			params: { id: "missing-id" },
			headers: {
				"x-company-id": "cmp-1",
				"x-user-id": "usr-1",
				"x-user-role": "viewer",
			},
			set,
		});

		expect(set.status).toBe(404);
		expect(response).toMatchObject({
			success: false,
			error: "Document not found",
		});
	});
});
