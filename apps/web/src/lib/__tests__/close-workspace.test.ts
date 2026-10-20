import { describe, expect, it } from "vitest";
import {
	closeWorkspaceParams,
	defaultClosePeriod,
	fiscalPeriodFromParams,
} from "../close-workspace";

describe("close workspace target", () => {
	it("defaults to the month before today, across the year boundary", () => {
		expect(defaultClosePeriod(new Date(2026, 9, 20))).toBe("2026-09");
		expect(defaultClosePeriod(new Date(2026, 0, 5))).toBe("2025-12");
	});

	it("targets the active company and period with the monthly-close intent", () => {
		expect(closeWorkspaceParams("co-1", "2026-03")).toEqual({
			companyId: "co-1",
			year: "2026",
			month: "03",
			intent: "monthly-close",
		});
	});

	it("falls back to the default period when none (or garbage) is stored", () => {
		const [year, month] = defaultClosePeriod().split("-");
		expect(closeWorkspaceParams("co-1", null)).toMatchObject({ year, month });
		expect(closeWorkspaceParams("co-1", "2026-13")).toMatchObject({
			year,
			month,
		});
	});

	it("builds the API's YYYY-MM period from the URL, padding old links", () => {
		expect(fiscalPeriodFromParams("2026", "03")).toBe("2026-03");
		expect(fiscalPeriodFromParams("2026", "3")).toBe("2026-03");
		expect(fiscalPeriodFromParams("2026", "13")).toBeNull();
		expect(fiscalPeriodFromParams("26", "03")).toBeNull();
	});
});
