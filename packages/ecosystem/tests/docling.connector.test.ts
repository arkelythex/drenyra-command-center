import { beforeEach, describe, expect, it, vi } from "vitest";
import { DoclingConnector } from "../src/adapters/docling/docling.connector";

describe("DoclingConnector", () => {
	let connector: DoclingConnector;

	beforeEach(() => {
		vi.resetAllMocks();
		connector = new DoclingConnector();
	});

	describe("connect", () => {
		it("validates config from environment variables", async () => {
			vi.stubEnv("DRENYRA_DOCLING_ENDPOINT", "http://docling:5001");
			vi.stubEnv("DRENYRA_DOCLING_TIMEOUT_MS", "15000");

			await connector.connect();

			expect(connector.config.endpoint).toBe("http://docling:5001");
			expect(connector.config.timeoutMs).toBe(15000);
		});

		it("uses defaults when env vars are not set", async () => {
			vi.stubEnv("DRENYRA_DOCLING_ENDPOINT", "");
			vi.stubEnv("DRENYRA_DOCLING_TIMEOUT_MS", "");

			await connector.connect();

			expect(connector.config.endpoint).toBe("http://docling:5001");
			expect(connector.config.timeoutMs).toBe(30000);
		});

		it("throws on invalid endpoint URL", async () => {
			vi.stubEnv("DRENYRA_DOCLING_ENDPOINT", "not-a-url");

			await expect(connector.connect()).rejects.toThrow(
				/Invalid Docling configuration/,
			);
		});
	});

	describe("execute — document.extract", () => {
		beforeEach(async () => {
			vi.stubEnv("DRENYRA_DOCLING_ENDPOINT", "http://docling:5001");
			await connector.connect();
		});

		it("sends correct request payload and returns extraction result", async () => {
			const mockResponse: DoclingExtractionResult = {
				markdown: "# Invoice\n\n**Total:** S/ 1,200.00\n",
				tables: [
					{
						caption: "Line Items",
						data: [
							["Item", "Qty", "Price"],
							["Laptop", "1", "1200.00"],
						],
					},
				],
				processingTimeMs: 1250,
			};

			const fetchSpy = vi
				.spyOn(globalThis, "fetch")
				.mockResolvedValueOnce(
					new Response(JSON.stringify(mockResponse), { status: 200 }),
				);

			const result = await connector.execute<
				import("../src/adapters/docling/docling.types").DoclingExtractionResult
			>({
				type: "document.extract",
				document: {
					content: "base64pdfcontent",
					mimeType: "application/pdf",
					filename: "factura-001.pdf",
				},
				options: {
					extractTables: true,
					language: "spa",
				},
			});

			expect(fetchSpy).toHaveBeenCalledTimes(1);
			expect(fetchSpy).toHaveBeenCalledWith(
				"http://docling:5001/v1/documents/extract",
				expect.objectContaining({
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						content: "base64pdfcontent",
						mime_type: "application/pdf",
						filename: "factura-001.pdf",
						options: {
							extract_tables: true,
							extract_images: false,
							language: "spa",
						},
					}),
				}),
			);
			expect(result.markdown).toContain("S/ 1,200.00");
			expect(result.tables).toHaveLength(1);
			expect(result.processingTimeMs).toBe(1250);
		});
	});

	describe("execute — health", () => {
		beforeEach(async () => {
			vi.stubEnv("DRENYRA_DOCLING_ENDPOINT", "http://docling:5001");
			await connector.connect();
		});

		it("returns health status on success", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
				new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
			);

			const result = await connector.execute<{
				status: string;
				version: string;
			}>({
				type: "health",
			});

			expect(result.status).toBe("connected");
			expect(result.version).toBe("docling");
		});
	});

	describe("circuit breaker", () => {
		beforeEach(async () => {
			vi.stubEnv("DRENYRA_DOCLING_ENDPOINT", "http://docling:5001");
			await connector.connect();
		});

		it("trips after consecutive failures", async () => {
			vi.spyOn(globalThis, "fetch").mockRejectedValue(
				new Error("connection refused"),
			);

			for (let i = 0; i < 5; i++) {
				await expect(connector.execute({ type: "health" })).rejects.toThrow();
			}

			await expect(connector.execute({ type: "health" })).rejects.toThrow(
				/circuit breaker/i,
			);
		});
	});

	describe("execute — not connected", () => {
		it("throws when execute is called before connect", async () => {
			await expect(connector.execute({ type: "health" })).rejects.toThrow(
				/not connected/,
			);
		});
	});
});

import type { DoclingExtractionResult } from "../src/adapters/docling/docling.types";
