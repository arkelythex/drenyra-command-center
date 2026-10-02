import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentContext } from "../../types/agent-context";
import {
	createSireFilingStrategy,
	type SireFilingRecord,
} from "../sire-filing.strategy";

const ctx = {
	tenantId: "t",
	userId: "u",
	organizationId: "o",
	companyId: "c",
	ruc: "20123456789",
	traceId: "x",
} as AgentContext;
const NOW = new Date("2026-07-01T12:00:00.000Z");
const ago = (days: number) =>
	new Date(NOW.getTime() - days * 86_400_000).toISOString();

function rec(over: Partial<SireFilingRecord>): SireFilingRecord {
	return {
		id: "R",
		serie: "F001",
		numero: "42",
		tipoDocumento: "01",
		emisorRuc: "20123456789",
		emisionDate: ago(10),
		filingDate: null,
		total: 1234.5,
		cdrReceived: false,
		...over,
	};
}

const run = (
	list: unknown,
	options?: Parameters<typeof createSireFilingStrategy>[0],
) =>
	createSireFilingStrategy(options).execute(
		list,
		ctx,
	) as import("../types").Anomaly[];

describe("sire-filing (characterization)", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
	});
	afterEach(() => vi.useRealTimers());

	it("returns [] for non-array input", () => expect(run("x")).toEqual([]));

	const cases: Record<string, Partial<SireFilingRecord>> = {
		"invalid emission date": { emisionDate: "not-a-date" },
		"compliant: filed with CDR": {
			filingDate: ago(8),
			cdrReceived: true,
			emisionDate: ago(40),
		},
		"inside window (7 days)": { emisionDate: ago(7) },
		"just overdue (8 days, daysOverdue 1)": { emisionDate: ago(8) },
		"daysOverdue 6 (medium)": { emisionDate: ago(13) },
		"daysOverdue 7 (high)": { emisionDate: ago(14) },
		"daysOverdue 29 (high)": { emisionDate: ago(36) },
		"daysOverdue 30 (critical)": { emisionDate: ago(37) },
		"not filed, long overdue (confidence cap)": { emisionDate: ago(200) },
		"filed without CDR": { emisionDate: ago(20), filingDate: ago(15) },
		"filed without CDR, long overdue (confidence cap)": {
			emisionDate: ago(200),
			filingDate: ago(150),
		},
		"CDR without filing date": { emisionDate: ago(20), cdrReceived: true },
		"numero padded": { emisionDate: ago(20), numero: "5" },
	};

	for (const [name, over] of Object.entries(cases)) {
		it(`pins anomalies: ${name}`, () => {
			expect(run([rec(over)])).toMatchSnapshot();
		});
	}

	it("honours custom deadline and critical thresholds", () => {
		expect(
			run([rec({ emisionDate: ago(4) })], {
				deadlineDays: 3,
				criticalOverdueDays: 1,
			}),
		).toMatchSnapshot();
	});

	it("keeps list order and skips compliant records", () => {
		const out = run([
			rec({ id: "A", emisionDate: ago(20) }),
			rec({ id: "B", emisionDate: ago(1) }),
			rec({ id: "C", emisionDate: ago(50) }),
		]);
		expect(out.map((a) => a.id)).toEqual(["sire-filing-A", "sire-filing-C"]);
	});
});
