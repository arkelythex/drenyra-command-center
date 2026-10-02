import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentContext } from "../../types/agent-context";
import {
	createTaxCalendarStrategy,
	type TaxCalendarInput,
	type TaxObligation,
} from "../tax-calendar.strategy";

const ctx = {
	tenantId: "t",
	userId: "u",
	organizationId: "o",
	companyId: "c",
	ruc: "20123456789",
	traceId: "x",
} as AgentContext;
const NOW = new Date("2026-07-01T12:00:00.000Z");
const inDays = (d: number) =>
	new Date(NOW.getTime() + d * 86_400_000).toISOString();

function ob(id: string, over: Partial<TaxObligation>): TaxObligation {
	return {
		id,
		code: id,
		name: `Obligación ${id}`,
		description: "d",
		dueDate: inDays(10),
		status: "pending",
		filingDate: null,
		legalReference: "Ref X",
		...over,
	};
}

const input = (
	obligations: TaxObligation[],
	taxRegime = "ruta",
): TaxCalendarInput => ({
	tenantRuc: "20123456789",
	rucType: "persona_juridica",
	taxRegime,
	obligations,
});

const run = (data: unknown) =>
	createTaxCalendarStrategy().execute(
		data,
		ctx,
	) as import("../types").Anomaly[];

describe("tax-calendar (characterization)", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
	});
	afterEach(() => vi.useRealTimers());

	it.each([[null], [undefined], ["x"], [{}], [{ obligations: [] }]])(
		"returns [] for %j",
		(d) => {
			expect(run(d)).toEqual([]);
		},
	);

	const offsets: Array<[string, Partial<TaxObligation>]> = [
		[
			"overdue 5 days",
			{ dueDate: inDays(-5), amount: 250.5, period: "2026-05" },
		],
		["due now (0 days)", { dueDate: inDays(0) }],
		["due in half a day (ceil 1)", { dueDate: inDays(0.5), amount: 0 }],
		["due in 3 days (high)", { dueDate: inDays(3) }],
		["due in 4 days (medium)", { dueDate: inDays(4) }],
		["due in 7 days (medium)", { dueDate: inDays(7) }],
		["due in 8 days (low)", { dueDate: inDays(8) }],
		["due in 15 days (low)", { dueDate: inDays(15) }],
		["due in 16 days (not alerted)", { dueDate: inDays(16) }],
		["filed", { status: "filed", dueDate: inDays(1) }],
		["exempt", { status: "exempt", dueDate: inDays(1) }],
		["invalid due date", { dueDate: "nope" }],
	];
	for (const [name, over] of offsets) {
		it(`pins anomalies: ${name}`, () => {
			expect(run(input([ob("0621", over)]))).toMatchSnapshot();
		});
	}

	it.each(["general", "mype", "ruta", "especial", "unknown-regime"])(
		"pins missing standard obligations for regime %s",
		(regime) => {
			expect(
				run(input([ob("9999", { dueDate: inDays(30) })], regime)),
			).toMatchSnapshot();
		},
	);

	it("does not report standard obligations already present", () => {
		const out = run(input([ob("0621", { dueDate: inDays(30) })], "ruta"));
		expect(out).toEqual([]);
	});

	it("emits deadline alerts first (in list order), then missing obligations", () => {
		const out = run(
			input(
				[ob("A", { dueDate: inDays(2) }), ob("B", { dueDate: inDays(-1) })],
				"ruta",
			),
		);
		expect(out.map((a) => a.id)).toEqual([
			"tax-calendar-A",
			"tax-calendar-B",
			"tax-calendar-missing-0621",
		]);
	});
});
