import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentContext } from "../../types/agent-context";
import {
	createDetraccionesStrategy,
	type DetraccionInvoice,
} from "../detracciones.strategy";

const ctx = {
	tenantId: "t",
	userId: "u",
	organizationId: "o",
	companyId: "c",
	ruc: "20123456789",
	traceId: "x",
} as AgentContext;
const NOW = new Date("2026-07-01T12:00:00.000Z");
const DAY = 86_400_000;
const ago = (days: number) =>
	new Date(NOW.getTime() - days * DAY).toISOString();

function inv(over: Partial<DetraccionInvoice>): DetraccionInvoice {
	return {
		id: "INV",
		serie: "F001",
		numero: "7",
		tipoDocumento: "01",
		emisorRuc: "20123456789",
		receptorRuc: "20123456788",
		operationCode: "022",
		totalAmount: 10000,
		detraccionAmount: null,
		detraccionPercentage: null,
		detraccionDeposited: false,
		depositDate: null,
		paymentType: "CRED",
		emisionDate: ago(1),
		...over,
	};
}

// Operation 022 carries a 15% rate; "right pct" cases apply exactly that.
const run = (list: DetraccionInvoice[]) =>
	createDetraccionesStrategy().execute(
		list,
		ctx,
	) as import("../types").Anomaly[];

describe("detracciones (characterization)", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
	});
	afterEach(() => vi.useRealTimers());

	it("returns [] for non-array input", () => {
		expect(createDetraccionesStrategy().execute("x" as never, ctx)).toEqual([]);
	});

	const cases: Record<string, Partial<DetraccionInvoice>> = {
		"below credit threshold": { totalAmount: 699.99 },
		"at credit threshold, missing": { totalAmount: 700 },
		"unknown operation code": { operationCode: "999" },
		"missing (null)": {},
		"missing (zero)": { detraccionAmount: 0 },
		"missing at 49999.99 (high)": { totalAmount: 49999.99 },
		"missing at 50000 (critical)": { totalAmount: 50000 },
		"cash payment CONT below threshold": {
			paymentType: "CONT",
			totalAmount: 699.99,
		},
		"cash payment lowercase cont at threshold": {
			paymentType: "cont",
			totalAmount: 700,
		},
		"wrong pct diff exactly 1": {
			detraccionAmount: 1,
			detraccionPercentage: 14,
			detraccionDeposited: true,
		},
		"wrong pct diff just over 1": {
			detraccionAmount: 1,
			detraccionPercentage: 13.99,
			detraccionDeposited: true,
		},
		"wrong pct null percentage": {
			detraccionAmount: 5,
			detraccionPercentage: null,
			detraccionDeposited: true,
		},
		"right pct, deposited": {
			detraccionAmount: 1500,
			detraccionPercentage: 15,
			detraccionDeposited: true,
			emisionDate: ago(40),
		},
		"right pct, not deposited day 5": {
			detraccionAmount: 1500,
			detraccionPercentage: 15,
			emisionDate: ago(5),
		},
		"right pct, not deposited day 6 (low)": {
			detraccionAmount: 1500,
			detraccionPercentage: 15,
			emisionDate: ago(6),
		},
		"right pct, not deposited 20 days since (daysLate 15, low)": {
			detraccionAmount: 1500,
			detraccionPercentage: 15,
			emisionDate: ago(20),
		},
		"right pct, not deposited 21 days since (daysLate 16, high)": {
			detraccionAmount: 1500,
			detraccionPercentage: 15,
			emisionDate: ago(21),
		},
		"numero padded in message": { numero: "123" },
	};

	for (const [name, over] of Object.entries(cases)) {
		it(`pins anomalies: ${name}`, () => {
			expect(run([inv(over)])).toMatchSnapshot();
		});
	}

	it("processes a mixed list in order, one anomaly per invoice at most", () => {
		const list = [
			inv({ id: "A" }),
			inv({ id: "B", totalAmount: 100 }),
			inv({
				id: "C",
				detraccionAmount: 1,
				detraccionPercentage: 50,
				detraccionDeposited: true,
			}),
			inv({
				id: "D",
				detraccionAmount: 1500,
				detraccionPercentage: 15,
				emisionDate: ago(30),
			}),
		];
		const out = run(list);
		expect(out.map((a) => a.id)).toEqual([
			"detraccion_missing-A",
			"detraccion_wrong_percentage-C",
			"detraccion_not_deposited-D",
		]);
	});
});
