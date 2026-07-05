import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_FETCH = globalThis.fetch;

describe("inngest client", () => {
	beforeEach(() => {
		vi.resetModules();
		process.env = { ...ORIGINAL_ENV };
	});

	afterEach(() => {
		process.env = { ...ORIGINAL_ENV };
		globalThis.fetch = ORIGINAL_FETCH;
	});

	it("skips dispatch when INNGEST_URL is missing", async () => {
		delete process.env.INNGEST_URL;
		const fetchMock = vi.fn();
		globalThis.fetch = fetchMock as typeof fetch;

		const { inngest } = await import("../inngest.client");
		await inngest.send({
			name: "documents/ocr.requested",
			data: { documentId: "doc-1" },
		});

		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("posts events to configured inngest endpoint", async () => {
		process.env.INNGEST_URL = "http://localhost:8288/";
		const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
		globalThis.fetch = fetchMock as typeof fetch;

		const { inngest } = await import("../inngest.client");
		await inngest.send({
			name: "documents/ocr.requested",
			data: { documentId: "doc-1" },
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8288/e/drenyra-documents",
			expect.objectContaining({
				method: "POST",
			}),
		);
	});
});
