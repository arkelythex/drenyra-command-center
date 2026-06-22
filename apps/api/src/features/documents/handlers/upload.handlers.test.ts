import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "../../auth/auth.config";
import type { DocumentStorePort } from "../ports/document-store.port";
import { createUploadHandlers } from "./upload.handlers";

vi.mock("../file-processing.service", () => ({
	detectFileType: vi.fn(),
	generateDocumentId: vi.fn(),
	isValidFileType: vi.fn(),
	validateFileContent: vi.fn(),
}));

vi.mock("./shared", () => ({
	fail: vi.fn(
		(set: { status?: number }, status: number, error: string, code: string) => {
			set.status = status;
			return { success: false, error, code };
		},
	),
	persistIncomingDocument: vi.fn(),
	processXmlDocument: vi.fn(),
	queueOcrJob: vi.fn(),
	toErrorMessage: vi.fn((error: unknown, fallback: string) =>
		error instanceof Error ? error.message : fallback,
	),
}));

import * as fileProcessing from "../file-processing.service";
import * as shared from "./shared";

const mockedFileProcessing = fileProcessing as unknown as {
	detectFileType: ReturnType<typeof vi.fn>;
	generateDocumentId: ReturnType<typeof vi.fn>;
	isValidFileType: ReturnType<typeof vi.fn>;
	validateFileContent: ReturnType<typeof vi.fn>;
};

const mockedShared = shared as unknown as {
	fail: ReturnType<typeof vi.fn>;
	persistIncomingDocument: ReturnType<typeof vi.fn>;
	processXmlDocument: ReturnType<typeof vi.fn>;
	queueOcrJob: ReturnType<typeof vi.fn>;
	toErrorMessage: ReturnType<typeof vi.fn>;
};

function makeFile(name: string, type: string): File {
	return new File(["sample-content"], name, { type });
}

describe("upload handlers", () => {
	const originalEnv = { ...process.env };
	let store: DocumentStorePort;

	beforeEach(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
		store = {
			save: vi.fn(async () => undefined),
			update: vi.fn(async () => undefined),
			getById: vi.fn(async () => undefined),
			list: vi.fn(async () => []),
			toResponseDTO: vi.fn((doc: unknown) => doc as never),
		};
	});

	afterEach(() => {
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
	});

	it("returns 400 when file is missing", async () => {
		const set: { status?: number } = {};
		const handlers = createUploadHandlers({
			documentStore: store,
			resolveActorIdFromHeaders: () => "usr-test",
			queueOcrJob: vi.fn(async () => undefined),
			resolveOrganizationIdFromCompanyId: vi.fn(async () => null),
		});

		const response = await handlers.uploadDocumentHandler({
			body: { organizationId: 1 } as never,
			headers: {},
			set,
		});

		expect(set.status).toBe(400);
		expect(response).toMatchObject({
			success: false,
			error: "No file provided",
		});
	});

	it("accepts company-scoped upload with injected company bridge", async () => {
		const set: { status?: number } = {};
		const file = makeFile("invoice.pdf", "application/pdf");
		const injectedQueue = vi.fn(async () => undefined);
		const resolveOrganizationIdFromCompanyId = vi.fn(async () => 27);

		mockedFileProcessing.isValidFileType.mockReturnValue(true);
		mockedFileProcessing.validateFileContent.mockResolvedValue(true);
		mockedFileProcessing.generateDocumentId.mockReturnValue("doc-company-1");
		mockedFileProcessing.detectFileType.mockReturnValue("PDF");
		mockedShared.persistIncomingDocument.mockResolvedValue(
			"https://file.local/company",
		);

		const handlers = createUploadHandlers({
			documentStore: store,
			resolveActorIdFromHeaders: vi.fn(() => "usr-company"),
			queueOcrJob: injectedQueue,
			resolveOrganizationIdFromCompanyId,
		});

		const response = await handlers.uploadDocumentHandler({
			body: { file, companyId: "cmp-123" },
			headers: {
				"x-user-id": "usr-company",
				"x-user-role": "analyst",
				"x-company-id": "cmp-123",
			},
			set,
		});

		expect(set.status).toBeUndefined();
		expect(response).toMatchObject({
			success: true,
			data: {
				id: "doc-company-1",
				status: "queued_for_ocr",
			},
		});
		expect(resolveOrganizationIdFromCompanyId).toHaveBeenCalledWith("cmp-123");
		expect(mockedShared.persistIncomingDocument).toHaveBeenCalledWith(
			expect.objectContaining({
				companyId: "cmp-123",
				organizationId: 27,
			}),
		);
		expect(injectedQueue).toHaveBeenCalledWith(
			expect.objectContaining({
				companyId: "cmp-123",
				organizationId: 27,
			}),
		);
	});

	it("returns 422 and marks document as error when XML parsing fails", async () => {
		const set: { status?: number } = {};
		const file = makeFile("invoice.xml", "text/xml");

		mockedFileProcessing.isValidFileType.mockReturnValue(true);
		mockedFileProcessing.validateFileContent.mockResolvedValue(true);
		mockedFileProcessing.generateDocumentId.mockReturnValue("doc-1");
		mockedFileProcessing.detectFileType.mockReturnValue("XML");
		mockedShared.persistIncomingDocument.mockResolvedValue(
			"https://file.local/x",
		);
		mockedShared.processXmlDocument.mockRejectedValue(
			new Error("Invalid XML payload"),
		);

		const handlers = createUploadHandlers({
			documentStore: store,
			resolveActorIdFromHeaders: vi.fn(() => "usr-1"),
			queueOcrJob: vi.fn(async () => undefined),
			resolveOrganizationIdFromCompanyId: vi.fn(async () => 7),
		});
		const response = await handlers.uploadDocumentHandler({
			body: { file, organizationId: 7 },
			headers: {
				"x-user-id": "usr-1",
				"x-user-role": "analyst",
				"x-company-id": "cmp-1",
				"x-organization-id": "7",
			},
			set,
		});

		expect(set.status).toBe(422);
		expect(response).toMatchObject({
			success: false,
			error: "Invalid XML payload",
		});
		expect(store.update).toHaveBeenCalledWith(
			"doc-1",
			expect.objectContaining({ status: "error" }),
		);
	});

	it("queues OCR for non-XML files in batch upload", async () => {
		const set: { status?: number } = {};
		const file = makeFile("invoice.pdf", "application/pdf");
		const injectedQueue = vi.fn(async () => undefined);

		mockedFileProcessing.generateDocumentId.mockReturnValue("doc-2");
		mockedFileProcessing.detectFileType.mockReturnValue("PDF");
		mockedFileProcessing.isValidFileType.mockReturnValue(true);
		mockedFileProcessing.validateFileContent.mockResolvedValue(true);
		mockedShared.persistIncomingDocument.mockResolvedValue(
			"https://file.local/y",
		);

		const handlers = createUploadHandlers({
			documentStore: store,
			resolveActorIdFromHeaders: vi.fn(() => "usr-2"),
			queueOcrJob: injectedQueue,
			resolveOrganizationIdFromCompanyId: vi.fn(async () => 9),
		});
		const response = await handlers.batchUploadDocumentsHandler({
			body: { files: [file], organizationId: 9 },
			headers: {
				"x-user-id": "usr-2",
				"x-user-role": "analyst",
				"x-company-id": "cmp-2",
				"x-organization-id": "9",
			},
			set,
		});

		expect(set.status).toBeUndefined();
		expect(response).toMatchObject({
			success: true,
			data: {
				total: 1,
				processed: {
					xml: 0,
					pdf: 1,
				},
			},
		});
		expect(injectedQueue).toHaveBeenCalledTimes(1);
	});

	it("uses authenticated caller identity for queue metadata", async () => {
		const set: { status?: number } = {};
		const file = makeFile("invoice.pdf", "application/pdf");
		const injectedQueue = vi.fn(async () => undefined);
		const injectedResolver = vi.fn(() => "usr-injected");

		mockedFileProcessing.isValidFileType.mockReturnValue(true);
		mockedFileProcessing.validateFileContent.mockResolvedValue(true);
		mockedFileProcessing.generateDocumentId.mockReturnValue("doc-3");
		mockedFileProcessing.detectFileType.mockReturnValue("PDF");
		mockedShared.persistIncomingDocument.mockResolvedValue(
			"https://file.local/z",
		);

		const handlers = createUploadHandlers({
			documentStore: store,
			resolveActorIdFromHeaders: injectedResolver,
			queueOcrJob: injectedQueue,
			resolveOrganizationIdFromCompanyId: vi.fn(async () => 11),
		});
		const response = await handlers.uploadDocumentHandler({
			body: { file, organizationId: 11 },
			headers: {
				"x-user-id": "ignored-by-injected-resolver",
				"x-user-role": "analyst",
				"x-company-id": "cmp-11",
				"x-organization-id": "11",
			},
			set,
		});

		expect(set.status).toBeUndefined();
		expect(response).toMatchObject({
			success: true,
			data: {
				id: "doc-3",
				status: "queued_for_ocr",
			},
		});
		expect(injectedQueue).toHaveBeenCalledWith(
			expect.objectContaining({
				documentId: "doc-3",
				actorId: "ignored-by-injected-resolver",
			}),
		);
	});

	it("derives upload tenant scope from authenticated session when body omits tenant fields", async () => {
		process.env.NODE_ENV = "test";
		process.env.SECURITY_ENFORCE_TEST_SESSION = "true";
		process.env.SECURITY_ENFORCE_TEST_RBAC = "true";

		const set: { status?: number } = {};
		const file = makeFile("invoice.pdf", "application/pdf");
		const injectedQueue = vi.fn(async () => undefined);

		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			session: { id: "sess-upload-1" },
			user: {
				id: "auth-upload-1",
				role: "analyst",
				companyId: "cmp-session",
				activeCompanyId: "cmp-session",
			},
		} as never);

		mockedFileProcessing.isValidFileType.mockReturnValue(true);
		mockedFileProcessing.validateFileContent.mockResolvedValue(true);
		mockedFileProcessing.generateDocumentId.mockReturnValue("doc-session-1");
		mockedFileProcessing.detectFileType.mockReturnValue("PDF");
		mockedShared.persistIncomingDocument.mockResolvedValue(
			"https://file.local/session",
		);

		const handlers = createUploadHandlers({
			documentStore: store,
			resolveActorIdFromHeaders: vi.fn(() => "ignored-resolver"),
			queueOcrJob: injectedQueue,
			resolveOrganizationIdFromCompanyId: vi.fn(async () => 44),
		});

		const response = await handlers.uploadDocumentHandler({
			body: { file },
			headers: {
				cookie: "better-auth.session_token=test-session",
				"x-auth-user-id": "auth-upload-1",
				"x-user-role": "analyst",
			},
			set,
		});

		expect(set.status).toBeUndefined();
		expect(response).toMatchObject({
			success: true,
			data: { id: "doc-session-1", status: "queued_for_ocr" },
		});
		expect(mockedShared.persistIncomingDocument).toHaveBeenCalledWith(
			expect.objectContaining({
				companyId: "cmp-session",
				organizationId: 44,
			}),
		);
		expect(injectedQueue).toHaveBeenCalledWith(
			expect.objectContaining({
				actorId: "auth-upload-1",
				companyId: "cmp-session",
				organizationId: 44,
			}),
		);
	});
});
