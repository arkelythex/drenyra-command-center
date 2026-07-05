import { describe, expect, it, vi } from "vitest";
import type { ExportFormat, ExportPlugin } from "../export-service";
import {
	downloadExport,
	EXPORT_FORMATS,
	exportData,
	registerPlugin,
	resolveColumns,
} from "../export-service";

describe("resolveColumns", () => {
	it("uses provided columns when given", () => {
		const columns = [
			{ key: "b", label: "B" },
			{ key: "a", label: "A" },
		];
		expect(resolveColumns([{ a: 1, b: 2 }], columns)).toBe(columns);
	});

	it("derives columns from first data object when not provided", () => {
		const result = resolveColumns([{ name: "Alice", age: 30 }]);
		expect(result).toEqual([
			{ key: "name", label: "name" },
			{ key: "age", label: "age" },
		]);
	});

	it("returns empty array when data is empty and no columns given", () => {
		expect(resolveColumns([])).toEqual([]);
	});
});

describe("CSV export", () => {
	const sampleData = [
		{ name: "Alice", age: 30, city: "Lima" },
		{ name: "Bob", age: 25, city: "Arequipa" },
	];

	it("returns a Blob with correct MIME type", async () => {
		const blob = await exportData({
			filename: "test.csv",
			format: "csv",
			data: sampleData,
		});

		expect(blob).toBeInstanceOf(Blob);
		expect(blob.type).toBe("text/csv;charset=utf-8");
	});

	it("includes BOM for Excel compatibility", async () => {
		const blob = await exportData({
			filename: "test.csv",
			format: "csv",
			data: sampleData,
		});

		const buffer = await blob.arrayBuffer();
		const bytes = new Uint8Array(buffer);
		expect(bytes[0]).toBe(0xef);
		expect(bytes[1]).toBe(0xbb);
		expect(bytes[2]).toBe(0xbf);
	});

	it("generates correct CSV content", async () => {
		const blob = await exportData({
			filename: "test.csv",
			format: "csv",
			data: sampleData,
		});

		const text = await blob.text();
		const lines = text.split("\n");

		expect(lines[0]).toBe("name,age,city");
		expect(lines[1]).toBe("Alice,30,Lima");
		expect(lines[2]).toBe("Bob,25,Arequipa");
	});

	it("respects custom columns for ordering and filtering", async () => {
		const blob = await exportData({
			filename: "test.csv",
			format: "csv",
			data: sampleData,
			columns: [
				{ key: "city", label: "Ciudad" },
				{ key: "name", label: "Nombre" },
			],
		});

		const text = await blob.text();
		const lines = text.split("\n");

		expect(lines[0]).toBe("Ciudad,Nombre");
		expect(lines[1]).toBe("Lima,Alice");
		expect(lines[2]).toBe("Arequipa,Bob");
	});

	it("escapes cells containing quotes", async () => {
		const data = [{ name: 'Alice "The Great"' }];
		const blob = await exportData({
			filename: "test.csv",
			format: "csv",
			data,
		});
		const text = await blob.text();
		expect(text).toContain('"Alice ""The Great"""');
	});

	it("escapes cells containing commas", async () => {
		const data = [{ name: "Hello, World" }];
		const blob = await exportData({
			filename: "test.csv",
			format: "csv",
			data,
		});
		const text = await blob.text();
		expect(text).toContain('"Hello, World"');
	});

	it("handles null and undefined values as empty strings", async () => {
		const data = [{ name: "Alice", age: null, city: undefined }];
		const blob = await exportData({
			filename: "test.csv",
			format: "csv",
			data,
		});
		const text = await blob.text();
		expect(text).toContain("Alice,,");
	});

	it("handles empty data array", async () => {
		const blob = await exportData({
			filename: "empty.csv",
			format: "csv",
			data: [],
		});
		const buffer = await blob.arrayBuffer();
		const bytes = new Uint8Array(buffer);
		expect(bytes.length).toBe(3);
		expect(bytes[0]).toBe(0xef);
		expect(bytes[1]).toBe(0xbb);
		expect(bytes[2]).toBe(0xbf);
	});
});

describe("TSV export", () => {
	const sampleData = [
		{ name: "Alice", age: 30 },
		{ name: "Bob", age: 25 },
	];

	it("returns a Blob with tab-separated content", async () => {
		const blob = await exportData({
			filename: "test.tsv",
			format: "tsv",
			data: sampleData,
		});

		const text = await blob.text();
		const lines = text.split("\n");

		expect(lines[0]).toBe("name\tage");
		expect(lines[1]).toBe("Alice\t30");
		expect(lines[2]).toBe("Bob\t25");
	});

	it("includes BOM", async () => {
		const blob = await exportData({
			filename: "test.tsv",
			format: "tsv",
			data: sampleData,
		});
		const buffer = await blob.arrayBuffer();
		const bytes = new Uint8Array(buffer);
		expect(bytes[0]).toBe(0xef);
		expect(bytes[1]).toBe(0xbb);
		expect(bytes[2]).toBe(0xbf);
	});
});

describe("JSON export", () => {
	const sampleData = [{ name: "Alice", age: 30 }];

	it("returns a Blob with JSON content", async () => {
		const blob = await exportData({
			filename: "test.json",
			format: "json",
			data: sampleData,
		});

		expect(blob.type).toBe("application/json;charset=utf-8");
		const text = await blob.text();
		const parsed = JSON.parse(text);
		expect(parsed).toEqual(sampleData);
	});

	it("pretty-prints JSON", async () => {
		const blob = await exportData({
			filename: "test.json",
			format: "json",
			data: sampleData,
		});
		const text = await blob.text();
		expect(text).toContain("\n");
	});
});

describe("plugin registration", () => {
	it("uses a custom registered plugin", async () => {
		const customFormat = "custom-test-plugin";

		const customPlugin: ExportPlugin = {
			format: customFormat as ExportFormat,
			mimeType: "text/plain",
			extension: ".test",
			async generate(data) {
				return new Blob([`count:${data.length}`], { type: "text/plain" });
			},
		};

		registerPlugin(customPlugin);

		const blob = await exportData({
			filename: "test.test",
			format: customFormat as ExportFormat,
			data: [{ x: 1 }],
		});

		const text = await blob.text();
		expect(text).toBe("count:1");
	});
});

describe("error handling", () => {
	it("throws for unregistered format", async () => {
		await expect(
			exportData({
				filename: "test.xyz",
				format: "xyz" as ExportFormat,
				data: [],
			}),
		).rejects.toThrow("Unsupported export format");
	});

	it("throws for encrypted format without password", async () => {
		await expect(
			exportData({
				filename: "secret.json",
				format: "encrypted",
				data: [{ secret: "value" }],
			}),
		).rejects.toThrow("Encryption password must be at least 12 characters");
	});

	it("throws for PDF without apiUrl", async () => {
		await expect(
			exportData({
				filename: "doc.pdf",
				format: "pdf",
				data: [],
			}),
		).rejects.toThrow("PDF export requires an apiUrl");
	});

	it("throws for XLSX without apiUrl", async () => {
		await expect(
			exportData({
				filename: "sheet.xlsx",
				format: "xlsx",
				data: [],
			}),
		).rejects.toThrow("XLSX export requires an apiUrl");
	});
});

describe("downloadExport", () => {
	beforeEach(() => {
		vi.stubGlobal("window", {} as unknown as Window & typeof globalThis);
		vi.stubGlobal("URL", {
			createObjectURL: vi.fn(() => "blob:mock"),
			revokeObjectURL: vi.fn(),
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("creates and clicks an anchor element", () => {
		const appendChild = vi.fn();
		const removeChild = vi.fn();
		const mockAnchor = { href: "", download: "", click: vi.fn() };
		const createElement = vi.fn(() => mockAnchor);

		vi.stubGlobal("document", {
			body: { appendChild, removeChild },
			createElement,
		} as unknown as Document);

		const blob = new Blob(["test"], { type: "text/plain" });
		downloadExport(blob, "test.txt");

		expect(createElement).toHaveBeenCalledWith("a");
		expect(mockAnchor.download).toBe("test.txt");
		expect(appendChild).toHaveBeenCalledWith(mockAnchor);
		expect(mockAnchor.click).toHaveBeenCalled();
		expect(removeChild).toHaveBeenCalledWith(mockAnchor);
	});
});

describe("EXPORT_FORMATS", () => {
	it("defines all expected formats", () => {
		expect(EXPORT_FORMATS).toEqual({
			CSV: "csv",
			TSV: "tsv",
			JSON: "json",
			PDF: "pdf",
			XLSX: "xlsx",
			ENCRYPTED: "encrypted",
		});
	});
});
