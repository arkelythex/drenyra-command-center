/**
 * Domain Benchmark — Money operations
 *
 * Mide el rendimiento de operaciones fundamentales de Money.
 * Correr con: bun run bench
 *
 * @module benchmarks/domain
 */

import { Money } from "@drenyra/domain";

const ITERATIONS = 10_000;
const results: Array<{ name: string; ops: number; ms: number }> = [];

function bench(name: string, fn: () => void, iterations = ITERATIONS) {
	const start = performance.now();
	for (let i = 0; i < iterations; i++) {
		fn();
	}
	const ms = performance.now() - start;
	const ops = Math.round((iterations / ms) * 1000);
	results.push({ name, ops, ms: Math.round(ms) });
}

// Setup
const amounts: Money[] = [];
for (let i = 0; i < 1000; i++) {
	amounts.push(Money.fromAmount(Math.random() * 100_000, "PEN"));
}

console.log(
	`\n📊 Domain Benchmarks (${ITERATIONS.toLocaleString()} iterations each)\n`,
);

bench("Money.fromAmount", () => {
	Money.fromAmount(15000.5, "PEN");
});

bench("Money.add", () => {
	const a = Money.fromAmount(100, "PEN");
	const b = Money.fromAmount(50, "PEN");
	a.add(b);
});

bench("Money.multiply", () => {
	const a = Money.fromAmount(100, "PEN");
	a.multiply(0.18);
});

bench("Money batch operations (1000)", () => {
	for (const m of amounts) {
		m.add(m);
		m.multiply(0.18);
	}
});

bench("RUC.create (valid)", () => {
	const { RUC } = require("@drenyra/domain");
	try {
		RUC.create("20546296564");
	} catch {
		// skip
	}
});

// Print results
console.table(results);

// Summary
const totalMs = results.reduce((s, r) => s + r.ms, 0);
console.log(
	`\nTotal: ${results.length} benchmarks, ${totalMs}ms, fastest: ${results.reduce((a, b) => (a.ops > b.ops ? a : b)).name} (${results.reduce((a, b) => (a.ops > b.ops ? a : b)).ops.toLocaleString()} ops/s)`,
);
