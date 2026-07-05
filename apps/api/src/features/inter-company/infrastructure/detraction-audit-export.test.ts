import { describe, expect, it } from "vitest";
import { parseAuditDateRange } from "./detraction-audit-export";

describe("parseAuditDateRange", () => {
	it("builds Lima civil-day boundaries with -05:00 offset", () => {
		const { dateFrom, dateTo } = parseAuditDateRange({
			dateFrom: "2026-01-01",
			dateTo: "2026-01-01",
		});

		expect(dateFrom?.toISOString()).toBe("2026-01-01T05:00:00.000Z");
		expect(dateTo?.toISOString()).toBe("2026-01-02T04:59:59.999Z");
	});

	it("throws on invalid civil dates", () => {
		expect(() => parseAuditDateRange({ dateFrom: "2026-02-30" })).toThrow(
			/Invalid date value/,
		);
	});
});
