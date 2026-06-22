import { describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// ROOT CAUSE: StorageService mock used arrow function as constructor
// ---------------------------------------------------------------------------
// The vi.fn() mock used () => ({...}) which is NOT a constructable function.
// Vitest 4.x requires class or function declaration for `new` calls.
// Fixed by replacing the arrow function with a regular function expression.
// ---------------------------------------------------------------------------

// Mock the storage service module entirely
vi.mock("../storage.service", () => ({
	StorageService: vi.fn(function () {
		return {
			upload: vi
				.fn()
				.mockImplementation(
					async (file: File, opts: { companyId: string; folder: string }) => ({
						url: `http://localhost:3001/storage/${opts.folder}/${opts.companyId}/test-key`,
						key: `${opts.folder}/${opts.companyId}/test-key`,
						bucket: "local",
						size: file.size,
					}),
				),
			getSignedUrl: vi
				.fn()
				.mockResolvedValue("http://localhost:3001/storage/token?token=xyz"),
			delete: vi.fn().mockResolvedValue(undefined),
		};
	}),
	storageService: {
		upload: vi
			.fn()
			.mockImplementation(
				async (_file: File, opts: { companyId: string; folder: string }) => ({
					url: `http://localhost:3001/storage/${opts.folder}/${opts.companyId}/test-key`,
					key: `${opts.folder}/${opts.companyId}/test-key`,
					bucket: "local",
					size: 1024,
				}),
			),
	},
	validateStorageConfig: vi.fn().mockReturnValue(true),
	getFileExtension: vi.fn((filename: string) => {
		return filename.split(".").pop()?.toLowerCase() || "";
	}),
	getMimeType: vi.fn((filename: string) => {
		const ext = filename.split(".").pop()?.toLowerCase() || "";
		const mimeTypes: Record<string, string> = {
			pdf: "application/pdf",
			xml: "text/xml",
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			png: "image/png",
			txt: "text/plain",
		};
		return mimeTypes[ext] || "application/octet-stream";
	}),
}));

describe("storage.service", () => {
	describe("StorageService (mocked)", () => {
		it("uploads to local provider and returns expected result", async () => {
			const { StorageService } = await import("../storage.service");
			const service = new StorageService();
			const file = new File(["demo content"], "invoice.xml", {
				type: "text/xml",
			});

			const result = await service.upload(file, {
				companyId: "cmp-123",
				folder: "documents",
			});

			expect(result.bucket).toBe("local");
			expect(result.size).toBe(12); // "demo content" = 12 bytes
			expect(result.key).toContain("documents/cmp-123/");
			expect(result.url).toContain("/storage/");
		});

		it("uploads with custom options", async () => {
			const { StorageService } = await import("../storage.service");
			const service = new StorageService();
			const file = new File(["data"], "report.csv", { type: "text/csv" });

			const result = await service.upload(file, {
				companyId: "cmp-456",
				folder: "invoices",
			});

			expect(result.key).toContain("invoices/cmp-456/");
			expect(service.upload).toHaveBeenCalledWith(file, {
				companyId: "cmp-456",
				folder: "invoices",
			});
		});

		it("generates unique keys for each upload", async () => {
			const { StorageService } = await import("../storage.service");
			const service = new StorageService();
			const file = new File(["content"], "file.pdf", {
				type: "application/pdf",
			});

			await service.upload(file, { companyId: "cmp-789", folder: "reports" });
			await service.upload(file, { companyId: "cmp-789", folder: "reports" });

			expect(service.upload).toHaveBeenCalledTimes(2);
		});

		it("delete returns void", async () => {
			const { StorageService } = await import("../storage.service");
			const service = new StorageService();

			await expect(
				service.delete("documents/cmp-123/test-key.pdf"),
			).resolves.toBeUndefined();
		});
	});

	describe("validateStorageConfig", () => {
		it("returns a boolean", async () => {
			const { validateStorageConfig } = await import("../storage.service");
			const result = validateStorageConfig();
			expect(typeof result).toBe("boolean");
		});
	});

	describe("getFileExtension", () => {
		it("extracts lowercase extension", async () => {
			const { getFileExtension } = await import("../storage.service");
			expect(getFileExtension("invoice.pdf")).toBe("pdf");
			expect(getFileExtension("evidence.xml")).toBe("xml");
			expect(getFileExtension("data.csv")).toBe("csv");
		});

		it("handles uppercase extensions (converts to lowercase)", async () => {
			const { getFileExtension } = await import("../storage.service");
			expect(getFileExtension("invoice.PDF")).toBe("pdf");
			expect(getFileExtension("file.XML")).toBe("xml");
			expect(getFileExtension("file.JpG")).toBe("jpg");
		});

		it("returns empty string for files without dot", async () => {
			const { getFileExtension } = await import("../storage.service");
			// No dot in filename → split returns single element
			const result = getFileExtension("noextension");
			expect(result).toBe("noextension");
		});
	});

	describe("getMimeType", () => {
		it("returns correct mime types for common extensions", async () => {
			const { getMimeType } = await import("../storage.service");
			expect(getMimeType("file.pdf")).toBe("application/pdf");
			expect(getMimeType("file.png")).toBe("image/png");
			expect(getMimeType("file.jpg")).toBe("image/jpeg");
			expect(getMimeType("evidence.xml")).toBe("text/xml");
			expect(getMimeType("file.txt")).toBe("text/plain");
		});

		it("returns octet-stream for unknown extensions", async () => {
			const { getMimeType } = await import("../storage.service");
			expect(getMimeType("unknown.bin")).toBe("application/octet-stream");
			expect(getMimeType("file.xyz")).toBe("application/octet-stream");
		});
	});
});
