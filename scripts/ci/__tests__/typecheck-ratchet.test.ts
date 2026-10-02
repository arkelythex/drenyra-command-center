import { describe, expect, it } from "vitest";
import {
	type Buckets,
	canWriteBaseline,
	compareToBaseline,
	evaluate,
	parseTscErrors,
} from "../typecheck-ratchet";

const ROOT = "/repo";
const CWD = "/repo/apps/web";

const out = (...lines: string[]) => lines.join("\n");

describe("parseTscErrors", () => {
	it("buckets errors by repo-relative file and TS code", () => {
		const buckets = parseTscErrors(
			out(
				"src/a.ts(10,5): error TS2322: Type 'x' is not assignable to type 'y'.",
				"src/a.ts(22,1): error TS2322: Type 'z' is not assignable to type 'y'.",
				"src/a.ts(30,1): error TS18048: 'v' is possibly 'undefined'.",
			),
			CWD,
			ROOT,
		);
		expect(buckets).toEqual({
			"apps/web/src/a.ts|TS2322": 2,
			"apps/web/src/a.ts|TS18048": 1,
		});
	});

	it("resolves ../ paths against the package directory", () => {
		const buckets = parseTscErrors(
			"../../packages/ui/src/Dialog.tsx(47,4): error TS2375: x",
			CWD,
			ROOT,
		);
		expect(buckets).toEqual({ "packages/ui/src/Dialog.tsx|TS2375": 1 });
	});

	it("ignores continuation lines, summaries and noise", () => {
		const buckets = parseTscErrors(
			out(
				"src/a.ts(1,1): error TS2345: boom",
				"  Types of property 'open' are incompatible.",
				"    Type 'undefined' is not assignable to type 'boolean'.",
				'error: script "typecheck" exited with code 1',
				"",
			),
			CWD,
			ROOT,
		);
		expect(buckets).toEqual({ "apps/web/src/a.ts|TS2345": 1 });
	});

	it("tolerates the bun --filter prefix", () => {
		const buckets = parseTscErrors(
			"@drenyra/web typecheck: src/a.ts(1,1): error TS2345: boom",
			CWD,
			ROOT,
		);
		expect(buckets).toEqual({ "apps/web/src/a.ts|TS2345": 1 });
	});

	it("ignores project-configuration errors that move with the import graph (TS6059, TS6307, TS6305)", () => {
		const buckets = parseTscErrors(
			out(
				"src/a.ts(1,1): error TS6059: File '/x/y.ts' is not under 'rootDir' '/z'.",
				"src/a.ts(2,1): error TS6307: File '/x/y.ts' is not listed within the file list of project.",
				"src/a.ts(3,1): error TS6305: Output file '/x/y.d.ts' has not been built from source file.",
				"src/a.ts(4,1): error TS2322: real code error",
			),
			CWD,
			ROOT,
		);
		expect(buckets).toEqual({ "apps/web/src/a.ts|TS2322": 1 });
	});

	it("returns an empty object for clean output", () => {
		expect(parseTscErrors("", CWD, ROOT)).toEqual({});
	});
});

describe("compareToBaseline", () => {
	const base: Buckets = { "a.ts|TS1": 2, "b.ts|TS2": 1 };

	it("reports nothing when identical", () => {
		expect(compareToBaseline(base, { ...base })).toEqual({
			regressions: [],
			improvements: [],
		});
	});

	it("flags more errors in an existing bucket", () => {
		const r = compareToBaseline(base, { ...base, "a.ts|TS1": 3 });
		expect(r.regressions).toEqual([
			{ key: "a.ts|TS1", baseline: 2, current: 3 },
		]);
	});

	it("flags a new file or a new code as a regression", () => {
		const r = compareToBaseline(base, {
			...base,
			"c.ts|TS9": 1,
			"a.ts|TS7": 1,
		});
		expect(r.regressions.map((x) => x.key).sort()).toEqual([
			"a.ts|TS7",
			"c.ts|TS9",
		]);
		expect(r.regressions.every((x) => x.baseline === 0)).toBe(true);
	});

	it("reports fixed buckets as improvements, never as regressions", () => {
		const r = compareToBaseline(base, { "a.ts|TS1": 1 });
		expect(r.regressions).toEqual([]);
		expect(r.improvements).toEqual([
			{ key: "a.ts|TS1", baseline: 2, current: 1 },
			{ key: "b.ts|TS2", baseline: 1, current: 0 },
		]);
	});

	it("does not let a fix in one place hide a new error elsewhere", () => {
		const r = compareToBaseline(base, { "b.ts|TS2": 1, "c.ts|TS9": 1 });
		expect(r.regressions.map((x) => x.key)).toEqual(["c.ts|TS9"]);
		expect(r.improvements.map((x) => x.key)).toEqual(["a.ts|TS1"]);
	});
});

describe("evaluate", () => {
	const base: Buckets = { "a.ts|TS1": 2 };

	it("passes (exit 0) when nothing regressed", () => {
		const v = evaluate("web", base, { "a.ts|TS1": 2 });
		expect(v.exitCode).toBe(0);
		expect(v.message).toContain("web");
		expect(v.message).toContain("2");
	});

	it("fails (exit 1) and names the offending bucket and what to do", () => {
		const v = evaluate("web", base, { "a.ts|TS1": 3 });
		expect(v.exitCode).toBe(1);
		expect(v.message).toContain("a.ts");
		expect(v.message).toContain("TS1");
		expect(v.message.toLowerCase()).toContain("fix");
	});

	it("passes but tells you to ratchet down when errors were fixed", () => {
		const v = evaluate("web", base, {});
		expect(v.exitCode).toBe(0);
		expect(v.message).toContain("--update");
		expect(v.canUpdate).toBe(true);
	});

	it("does not offer an update when nothing improved", () => {
		expect(evaluate("web", base, { ...base }).canUpdate).toBe(false);
	});

	it("refuses to lower the baseline into a higher one", () => {
		const v = evaluate("web", base, { "a.ts|TS1": 5 });
		expect(v.canUpdate).toBe(false);
	});
});

describe("canWriteBaseline", () => {
	const base: Buckets = { "a.ts|TS1": 2 };

	it("allows bootstrapping a missing baseline even though everything looks new", () => {
		expect(canWriteBaseline(evaluate("web", {}, base), false)).toBe(true);
	});

	it("allows an update that only removed errors", () => {
		expect(canWriteBaseline(evaluate("web", base, {}), true)).toBe(true);
	});

	it("refuses an update over an existing baseline when something regressed or nothing improved", () => {
		expect(
			canWriteBaseline(evaluate("web", base, { "a.ts|TS1": 3 }), true),
		).toBe(false);
		expect(canWriteBaseline(evaluate("web", base, { ...base }), true)).toBe(
			false,
		);
	});
});
