import { describe, it, expect } from "vitest";
import { parseDiffFromText } from "../../src/classifier/git-diff";

// ============================================================================
// Git Diff Parser — parseDiffFromText (unit tests)
// ============================================================================

describe("git-diff — parseDiffFromText", () => {
	// --- Empty diff ---
	it("returns empty entry for empty input", () => {
		const result = parseDiffFromText("", "");
		expect(result.entry.modifiedFiles).toEqual([]);
		expect(result.entry.addedLines).toEqual([]);
		expect(result.entry.renamedFiles).toEqual([]);
		expect(result.entry.deletedFiles).toEqual([]);
		expect(result.hadCriticalError).toBe(false);
	});

	// --- Modified files ---
	it("parses modified files from name-status", () => {
		// -z format: M\0path\0
		const nameStatus = "M\0packages/fiscal/src/rates.ts\0";
		const diff = "--- a/rates.ts\n+++ b/rates.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n";
		const result = parseDiffFromText(nameStatus, diff);
		expect(result.entry.modifiedFiles).toContain("packages/fiscal/src/rates.ts");
		expect(result.entry.addedLines).toContain("const x = 2;");
	});

	it("parses multiple modified files", () => {
		const nameStatus = "M\0file1.ts\0M\0file2.ts\0";
		const diff = "";
		const result = parseDiffFromText(nameStatus, diff);
		expect(result.entry.modifiedFiles).toHaveLength(2);
		expect(result.entry.modifiedFiles[0]).toBe("file1.ts");
		expect(result.entry.modifiedFiles[1]).toBe("file2.ts");
	});

	// --- Added files ---
	it("parses added (A) files as modified", () => {
		const nameStatus = "A\0packages/fiscal/src/new.ts\0";
		const diff = "";
		const result = parseDiffFromText(nameStatus, diff);
		expect(result.entry.modifiedFiles).toContain("packages/fiscal/src/new.ts");
	});

	// --- Deleted files ---
	it("parses deleted (D) files", () => {
		const nameStatus = "D\0packages/fiscal/src/old.ts\0";
		const diff = "";
		const result = parseDiffFromText(nameStatus, diff);
		expect(result.entry.deletedFiles).toContain("packages/fiscal/src/old.ts");
	});

	// --- Renamed files ---
	it("parses renamed (R) files", () => {
		// R100\0src\0dst\0
		const nameStatus = "R100\0packages/fiscal/src/old.ts\0packages/fiscal/src/new.ts\0";
		const diff = "";
		const result = parseDiffFromText(nameStatus, diff);
		expect(result.entry.renamedFiles).toContain("packages/fiscal/src/old.ts");
		expect(result.entry.modifiedFiles).toContain("packages/fiscal/src/new.ts");
	});

	// --- Added lines ---
	it("extracts added lines from unified diff", () => {
		const nameStatus = "M\0file.ts\0";
		const diff = [
			"--- a/file.ts",
			"+++ b/file.ts",
			"@@ -1 +1,2 @@",
			" const existing = 1;",
			"+const nuevo = 2;",
			"+const otro = 3;",
		].join("\n");
		const result = parseDiffFromText(nameStatus, diff);
		expect(result.entry.addedLines).toContain("const nuevo = 2;");
		expect(result.entry.addedLines).toContain("const otro = 3;");
	});

	it("ignores +++ (file header) lines as added lines", () => {
		const nameStatus = "M\0file.ts\0";
		const diff = [
			"--- a/file.ts",
			"+++ b/file.ts",
			"@@ -1 +1,2 @@",
			"+new line",
		].join("\n");
		const result = parseDiffFromText(nameStatus, diff);
		expect(result.entry.addedLines).toHaveLength(1);
		expect(result.entry.addedLines[0]).toBe("new line");
	});

	// --- Paths with spaces ---
	it("handles paths with spaces", () => {
		const nameStatus = "M\0packages/fiscal/src/old dir/rates.ts\0";
		const diff = "";
		const result = parseDiffFromText(nameStatus, diff);
		expect(result.entry.modifiedFiles).toContain("packages/fiscal/src/old dir/rates.ts");
	});

	// --- Paths with Unicode ---
	it("handles Unicode in paths", () => {
		const nameStatus = "M\0packages/fiscal/src/año-2026/tasas.ts\0";
		const diff = "";
		const result = parseDiffFromText(nameStatus, diff);
		expect(result.entry.modifiedFiles).toContain("packages/fiscal/src/año-2026/tasas.ts");
	});

	// --- Binary files ---
	it("detects binary files by extension", () => {
		const nameStatus = "M\0logo.png\0M\0file.ts\0";
		const diff = "";
		const result = parseDiffFromText(nameStatus, diff);
		expect(result.binaryFiles).toContain("logo.png");
		expect(result.entry.modifiedFiles).not.toContain("logo.png");
		expect(result.entry.modifiedFiles).toContain("file.ts");
	});

	it("detects binary files from diff content", () => {
		const nameStatus = "M\0image.png\0";
		const diff = "Binary files a/image.png and b/image.png differ\n";
		const result = parseDiffFromText(nameStatus, diff);
		expect(result.binaryFiles).toContain("image.png");
	});

	// --- Error handling ---
	it("handles unknown status characters gracefully", () => {
		const nameStatus = "X\0unknown.ts\0M\0valid.ts\0";
		const diff = "";
		const result = parseDiffFromText(nameStatus, diff);
		// Unknown char should produce warning but not crash
		expect(result.hadCriticalError).toBe(false);
		expect(result.entry.modifiedFiles).not.toContain("unknown.ts");
	});

	it("handles empty name-status gracefully", () => {
		const result = parseDiffFromText("", "");
		expect(result.hadCriticalError).toBe(false);
		expect(result.entry.modifiedFiles).toEqual([]);
	});

	// --- Malformed ---
	it("handles truncated rename entry gracefully", () => {
		// R without enough fields
		const nameStatus = "R100\0only_src\0";
		const diff = "";
		const result = parseDiffFromText(nameStatus, diff);
		expect(result.hadCriticalError).toBe(false);
	});

	// --- Mixed types ---
	it("handles mixed A, M, D, R in one diff", () => {
		const nameStatus = "M\0mod.ts\0A\0add.ts\0D\0del.ts\0R050\0old.ts\0new.ts\0";
		const diff = "";
		const result = parseDiffFromText(nameStatus, diff);
		expect(result.entry.modifiedFiles).toContain("mod.ts");
		expect(result.entry.modifiedFiles).toContain("add.ts");
		expect(result.entry.modifiedFiles).toContain("new.ts");
		expect(result.entry.deletedFiles).toContain("del.ts");
		expect(result.entry.renamedFiles).toContain("old.ts");
	});

	// --- C (copy) treated as added ---
	it("treats copy (C) status as added/modified", () => {
		const nameStatus = "C100\0src.ts\0dst.ts\0";
		const diff = "";
		const result = parseDiffFromText(nameStatus, diff);
		expect(result.entry.renamedFiles).toContain("src.ts");
		expect(result.entry.modifiedFiles).toContain("dst.ts");
	});

	// --- Binary format list ---
	it("recognizes common binary extensions", () => {
		const nameStatus = [
			"M\0file.pdf\0",
			"M\0image.jpg\0",
			"M\0archive.zip\0",
			"M\0font.woff2\0",
			"M\0binary.dll\0",
			"M\0source.ts\0",
			"M\0data.db\0",
		].join("");
		const diff = "";
		const result = parseDiffFromText(nameStatus, diff);
		expect(result.binaryFiles).toContain("file.pdf");
		expect(result.binaryFiles).toContain("image.jpg");
		expect(result.binaryFiles).toContain("archive.zip");
		expect(result.binaryFiles).toContain("font.woff2");
		expect(result.binaryFiles).toContain("binary.dll");
		expect(result.binaryFiles).toContain("data.db");
		expect(result.entry.modifiedFiles).toContain("source.ts");
		expect(result.entry.modifiedFiles).not.toContain("file.pdf");
	});
});
