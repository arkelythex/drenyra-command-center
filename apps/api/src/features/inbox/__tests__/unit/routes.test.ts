import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock resolveSessionContext so the companyScopeGuard doesn't reject requests
vi.mock("../../../security/session-context", () => ({
	resolveSessionContext: vi.fn(),
}));

import { resolveSessionContext } from "../../../security/session-context";

const mockResolve = resolveSessionContext as unknown as ReturnType<
	typeof vi.fn
>;

const processUploadMock = vi.fn();

vi.mock("../../../../services/inbox.service", () => ({
	InboxService: {
		processUpload: processUploadMock,
	},
}));

const { inboxModule } = await import("../../index");

async function readSseEvents(response: Response): Promise<string[]> {
	const text = await response.text();
	return text
		.split("\n\n")
		.map((chunk) => chunk.trim())
		.filter(Boolean);
}

describe("inboxModule /process", () => {
	beforeEach(() => {
		mockResolve.mockResolvedValue({
			ok: true,
			context: {
				userId: "test-user",
				authUserId: "test-user",
				legacyUserId: null,
				role: "admin",
				companyId: "test-company",
			},
		});
		vi.clearAllMocks();
		processUploadMock.mockResolvedValue({ id: "tx-1" });
	});

	it("streams SSE events for uploaded files", async () => {
		const xml = `<?xml version="1.0"?>
<Invoice xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>20123456786</cbc:ID>
  <cbc:LineExtensionAmount>100.00</cbc:LineExtensionAmount>
  <cbc:TaxAmount>18.00</cbc:TaxAmount>
  <cbc:PayableAmount>118.00</cbc:PayableAmount>
</Invoice>`;

		const formData = new FormData();
		formData.set("files", new File([xml], "FAC-001.xml", { type: "text/xml" }));

		const app = new Elysia().use(inboxModule);
		const response = await app.handle(
			new Request("http://localhost/api/inbox/process", {
				method: "POST",
				headers: { "x-company-id": "cmp-123" },
				body: formData,
			}),
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/event-stream");

		const chunks = await readSseEvents(response);
		expect(
			chunks.some((chunk) => chunk.includes("event: batch:complete")),
		).toBe(true);
		expect(processUploadMock).toHaveBeenCalled();
	});

	it("returns 400 when no files provided", async () => {
		const app = new Elysia().use(inboxModule);
		const response = await app.handle(
			new Request("http://localhost/api/inbox/process", {
				method: "POST",
				body: new FormData(),
			}),
		);

		expect(response.status).toBe(400);
	});
});

describe("inboxModule /upload legacy", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		processUploadMock.mockResolvedValue({ id: "tx-1" });
	});

	it("forwards x-company-id to InboxService", async () => {
		const file = new File(["xml"], "invoice.xml", { type: "text/xml" });
		const formData = new FormData();
		formData.set("file", file);

		const app = new Elysia().use(inboxModule);
		const response = await app.handle(
			new Request("http://localhost/api/inbox/upload", {
				method: "POST",
				headers: { "x-company-id": "cmp-123" },
				body: formData,
			}),
		);

		expect(response.status).toBe(200);
		expect(processUploadMock).toHaveBeenCalledWith(expect.any(File), "cmp-123");
	});
});
