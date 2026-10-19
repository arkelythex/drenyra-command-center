import { describe, expect, it } from "vitest";
import type { PleBookType } from "../../ple.types";
import { PleValidator } from "../../ple-validator.service";

const RUC = "20123456789";
const header = (book: string, period = "2026-06", ruc = RUC) =>
	`${ruc}|${period}|${book}`;
const run = (
	book: PleBookType,
	lines: string[],
	options?: { expectedRuc?: string },
) => PleValidator.validate(book, lines.join("\n"), options);

describe("PleValidator (characterization)", () => {
	it("pins header validation", () => {
		const out = {
			empty: PleValidator.validate("LE-DIARIO", "   \n "),
			tooFewFields: PleValidator.validate("LE-DIARIO", "20123456789|2026-06"),
			shortRuc: run("LE-DIARIO", [
				header("LE-DIARIO", "2026-06", "1234567890"),
			]),
			rucMismatch: run("LE-DIARIO", [header("LE-DIARIO")], {
				expectedRuc: "20999999999",
			}),
			rucMatch: run("LE-DIARIO", [header("LE-DIARIO")], { expectedRuc: RUC }),
			bookMismatch: run("LE-DIARIO", [header("LE-MAYOR")]),
			badPeriod: run("LE-DIARIO", [header("LE-DIARIO", "2026/06")]),
			everythingWrong: run("LE-VENTAS", ["abc|xx|LE-DIARIO"], {
				expectedRuc: RUC,
			}),
			spacesAroundFields: run("LE-DIARIO", [` ${RUC} | 2026-06 |LE-DIARIO`]),
			emptyHeaderFields: PleValidator.validate("LE-DIARIO", "||"),
		};
		expect(out).toMatchSnapshot();
		expect(() => PleValidator.validate("LE-OTRO" as never, "x")).toThrow(
			"Unsupported PLE book type: LE-OTRO",
		);
	});

	it("pins LE-DIARIO rules", () => {
		const h = header("LE-DIARIO");
		const out = {
			balanced: run("LE-DIARIO", [
				h,
				"2026-06-10|g|1011|100.00|0.00",
				"2026-06-10|g|7011|0.00|100.00",
			]),
			unbalanced: run("LE-DIARIO", [
				h,
				"2026-06-10|g|1011|100.00|0.00",
				"2026-06-10|g|7011|0.00|99.00",
			]),
			withinTolerance: run("LE-DIARIO", [
				h,
				"2026-06-10|g|1011|100.00|0.00",
				"2026-06-10|g|7011|0.00|100.009",
			]),
			shortLine: run("LE-DIARIO", [h, "2026-06-10|g|1011|100"]),
			badDate: run("LE-DIARIO", [
				h,
				"2026-13-45|g|1011|1|1",
				"10/06/2026|g|1011|1|1",
			]),
			outsidePeriod: run("LE-DIARIO", [
				h,
				"2026-05-31|g|1011|100|0",
				"2026-06-30|g|7011|0|100",
			]),
			missingAccount: run("LE-DIARIO", [h, "2026-06-10|g| |1|1"]),
			invalidAmounts: run("LE-DIARIO", [
				h,
				"2026-06-10|g|1011|abc|",
				"2026-06-10|g|1011|Infinity|1",
			]),
			negatives: run("LE-DIARIO", [h, "2026-06-10|g|1011|-5|-1"]),
			emptyBody: run("LE-DIARIO", [h]),
			extraFields: run("LE-DIARIO", [
				h,
				"2026-06-10|g|1011|100|0|x|y",
				"2026-06-10|g|7011|0|100|x",
			]),
			paddedValues: run("LE-DIARIO", [
				h,
				" 2026-06-10 |g| 1011 | 100 | 0 ",
				"2026-06-10|g|7011| 0 | 100 ",
			]),
		};
		expect(out).toMatchSnapshot();
	});

	it("pins LE-MAYOR rules", () => {
		const h = header("LE-MAYOR");
		const out = {
			ok: run("LE-MAYOR", [h, "1011|Caja|100|50|20|130"]),
			mismatch: run("LE-MAYOR", [h, "1011|Caja|100|50|20|131"]),
			withinTolerance: run("LE-MAYOR", [h, "1011|Caja|100|50|20|130.005"]),
			shortLine: run("LE-MAYOR", [h, "1011|Caja|100|50|20"]),
			missingAccount: run("LE-MAYOR", [h, " |Caja|100|50|20|130"]),
			invalidAmount: run("LE-MAYOR", [
				h,
				"1011|Caja|x|50|20|130",
				"1011|Caja|100||20|130",
			]),
			missingAccountAndInvalid: run("LE-MAYOR", [h, "|Caja|x|50|20|130"]),
			negativeBalances: run("LE-MAYOR", [h, "1011|Caja|-100|0|50|-150"]),
		};
		expect(out).toMatchSnapshot();
	});

	for (const book of ["LE-COMPRAS", "LE-VENTAS"] as const) {
		it(`pins ${book} rules`, () => {
			const h = header(book);
			const ok = (
				d = "2026-06-10",
				b = "100",
				i = "18",
				t = "118",
				ruc = RUC,
			) => `${ruc}|a|b|c|d|${d}|${b}|${i}|${t}`;
			const out = {
				ok: run(book, [h, ok()]),
				badRuc: run(book, [h, ok("2026-06-10", "100", "18", "118", "123")]),
				shortLine: run(book, [h, "20123456789|a|b|c|d|2026-06-10|100|18"]),
				badDate: run(book, [h, ok("2026-02-30")]),
				outsidePeriod: run(book, [h, ok("2026-07-01")]),
				igvWrong: run(book, [h, ok("2026-06-10", "100", "20", "120")]),
				igvWithinTolerance: run(book, [
					h,
					ok("2026-06-10", "100", "18.02", "118.02"),
				]),
				totalWrong: run(book, [h, ok("2026-06-10", "100", "18", "150")]),
				bothWrong: run(book, [h, ok("2026-06-10", "100", "0", "0")]),
				invalidAmount: run(book, [h, ok("2026-06-10", "x", "18", "118")]),
				negative: run(book, [h, ok("2026-06-10", "-100", "-18", "-118")]),
				zero: run(book, [h, ok("2026-06-10", "0", "0", "0")]),
				multipleLines: run(book, [
					h,
					ok(),
					ok("2026-05-01"),
					ok("bad"),
					"short",
				]),
			};
			expect(out).toMatchSnapshot();
		});
	}
});
