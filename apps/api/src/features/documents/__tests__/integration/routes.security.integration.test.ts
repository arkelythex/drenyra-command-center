import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "../../../auth/auth.config";
import { buildDocumentsModule } from "../..";
import type {
	DocumentResponseDTO,
	DocumentStorePort,
} from "../../ports/document-store.port";

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

function buildApp(store: DocumentStorePort, organizationId: number = 77) {
	return new Elysia().use(
		buildDocumentsModule({
			documentStore: store,
			resolveOrganizationIdFromCompanyId: vi.fn(async () => organizationId),
		}),
	);
}

describe("documents routes security hardening", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		vi.restoreAllMocks();
		vi.clearAllMocks();
		process.env = {
			...originalEnv,
			NODE_ENV: "test",
			SECURITY_ENFORCE_TEST_RBAC: "true",
			SECURITY_ENFORCE_TEST_SESSION: "true",
		};
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.clearAllMocks();
		process.env = { ...originalEnv };
	});

	it("rejects document list requests when company assertion mismatches the session tenant", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			session: { id: "sess-doc-1" },
			user: {
				id: "auth-doc-1",
				role: "admin",
				companyId: "cmp-session",
				activeCompanyId: "cmp-session",
			},
		} as never);

		const response = await buildApp(buildFakeStore()).handle(
			new Request("http://localhost/api/documents?companyId=cmp-spoofed", {
				headers: {
					cookie: "better-auth.session_token=test-session",
					"x-auth-user-id": "auth-doc-1",
					"x-user-role": "admin",
				},
			}),
		);

		expect(response.status).toBe(403);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "TENANT_SCOPE_VIOLATION",
		});
	});

	it("uses authenticated session tenant scope for document queries", async () => {
		const store = buildFakeStore();
		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			session: { id: "sess-doc-2" },
			user: {
				id: "auth-doc-2",
				legacyUserId: "legacy-doc-2",
				role: "admin",
				companyId: "cmp-session",
				activeCompanyId: "cmp-session",
			},
		} as never);

		const response = await buildApp(store).handle(
			new Request("http://localhost/api/documents?limit=20&offset=0", {
				headers: {
					cookie: "better-auth.session_token=test-session",
					"x-auth-user-id": "auth-doc-2",
					"x-user-id": "legacy-doc-2",
					"x-user-role": "admin",
				},
			}),
		);

		expect(response.status).toBe(200);
		expect(store.list).toHaveBeenCalledWith(
			expect.objectContaining({
				companyId: "cmp-session",
				organizationId: 77,
			}),
		);
	});

	it("rejects review requests when organization assertion does not match session scope", async () => {
		const store = buildFakeStore({
			getById: vi.fn(async () => ({ id: "doc-403" }) as never),
		});
		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			session: { id: "sess-doc-3" },
			user: {
				id: "auth-doc-3",
				role: "admin",
				companyId: "cmp-session",
				activeCompanyId: "cmp-session",
			},
		} as never);

		const response = await buildApp(store).handle(
			new Request("http://localhost/api/documents/doc-403/status", {
				method: "PATCH",
				headers: {
					"content-type": "application/json",
					cookie: "better-auth.session_token=test-session",
					"x-auth-user-id": "auth-doc-3",
					"x-user-role": "admin",
					"x-organization-id": "999",
				},
				body: JSON.stringify({ status: "listo_para_sire" }),
			}),
		);

		expect(response.status).toBe(403);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "TENANT_SCOPE_VIOLATION",
		});
		expect(store.getById).not.toHaveBeenCalled();
	});
});
